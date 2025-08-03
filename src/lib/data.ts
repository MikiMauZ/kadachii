

import type { Project, Column, Task, ProjectMember, Assignee, ChatMessage, ProjectInvitation, WhiteboardPath, WhiteboardPoint } from "./types";
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where, writeBatch, getDoc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp, orderBy, limit } from 'firebase/firestore';

// Users
export const createUser = async (userId: string, data: { email: string }) => {
    const userRef = doc(db, 'users', userId);
    // Initialize with an empty projects array and other details
    return await setDoc(userRef, { 
        ...data, 
        projects: [],
        displayName: data.email.split('@')[0], // Default display name
        photoURL: `https://placehold.co/100x100/E8E8E8/000000?text=${data.email[0].toUpperCase()}`
     }, { merge: true });
};

export const getUser = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        return { id: userSnap.id, ...userSnap.data() };
    }
    return null;
}

export const updateUser = async (userId: string, data: Partial<{ displayName: string; photoURL: string }>) => {
    const userRef = doc(db, 'users', userId);
    return await updateDoc(userRef, data);
};


// Projects
export const getProjects = async (userId: string): Promise<Project[]> => {
    const projects: Project[] = [];
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
        const projectIds = userSnap.data().projects || [];
        if (projectIds.length === 0) {
            return [];
        }
        
        const chunks = [];
        for (let i = 0; i < projectIds.length; i += 30) {
            chunks.push(projectIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
             const q = query(collection(db, `projects`), where('__name__', 'in', chunk));
             const querySnapshot = await getDocs(q);
             querySnapshot.forEach(doc => {
                 projects.push({ id: doc.id, ...doc.data() } as Project);
             });
        }
    }
    return projects;
};

export const getProject = async (projectId: string): Promise<Project | null> => {
    const projectRef = doc(db, 'projects', projectId);
    const projectSnap = await getDoc(projectRef);

    if (projectSnap.exists()) {
        return { id: projectSnap.id, ...projectSnap.data() } as Project;
    } else {
        console.error("No such project!");
        return null;
    }
};

export const createProject = async (userId: string, userEmail: string, project: Omit<Project, 'id' | 'ownerId'>): Promise<string> => {
    const batch = writeBatch(db);

    const projectRef = doc(collection(db, 'projects'));
    batch.set(projectRef, { ...project, ownerId: userId });

    const columnsData = [{ title: 'Por Hacer' }, { title: 'En Progreso' }, { title: 'Hecho' }];
    columnsData.forEach(col => {
        const colRef = doc(collection(db, `projects/${projectRef.id}/columns`));
        batch.set(colRef, col);
    });

    const memberRef = doc(db, `projects/${projectRef.id}/members`, userId);
    batch.set(memberRef, { email: userEmail.toLowerCase(), role: 'owner' });

    const userRef = doc(db, 'users', userId);
    batch.set(userRef, { projects: arrayUnion(projectRef.id) }, { merge: true });

    await batch.commit();
    return projectRef.id;
};

export const updateProject = async (projectId: string, data: Partial<Omit<Project, 'id' | 'ownerId'>>) => {
    const projectRef = doc(db, 'projects', projectId);
    return await updateDoc(projectRef, data);
};

export const deleteProject = async (projectId: string) => {
    const batch = writeBatch(db);
    const projectRef = doc(db, 'projects', projectId);

    // Delete all subcollections (tasks, columns, members, messages, invitations, whiteboard)
    const collectionsToDelete = ['tasks', 'columns', 'members', 'messages', 'invitations', 'whiteboard'];
    for (const subcollection of collectionsToDelete) {
        const subcollectionRef = collection(db, `projects/${projectId}/${subcollection}`);
        const snapshot = await getDocs(subcollectionRef);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    // Remove project from users' project lists
    const membersSnapshot = await getDocs(collection(db, `projects/${projectId}/members`));
    membersSnapshot.docs.forEach(memberDoc => {
        const userRef = doc(db, 'users', memberDoc.id);
        batch.update(userRef, {
            projects: arrayRemove(projectId)
        });
    });

    // Delete the project document itself
    batch.delete(projectRef);

    await batch.commit();
};


// Team / Members / Invitations
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    if (!projectId) return [];
    const membersSnapshot = await getDocs(collection(db, `projects/${projectId}/members`));
    const memberIds = membersSnapshot.docs.map(doc => doc.id);
    
    if(memberIds.length === 0) return [];

    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', 'in', memberIds)));
    
    const usersData = new Map<string, any>();
    usersSnapshot.forEach(doc => usersData.set(doc.id, doc.data()));
    
    const allMembers: ProjectMember[] = membersSnapshot.docs.map(doc => {
        const memberData = doc.data();
        const userData = usersData.get(doc.id);
        
        return {
            id: doc.id,
            email: memberData.email,
            role: memberData.role,
            name: userData?.displayName ?? memberData.email,
            avatarUrl: userData?.photoURL ?? `https://placehold.co/100x100.png?text=${memberData.email[0].toUpperCase()}`
        } as ProjectMember;
    }).filter(member => !!usersData.get(member.id)); // Filter out pending members who aren't users yet
    
    return allMembers;
};


export const inviteUserToProject = async (projectId: string, inviterEmail: string, invitedEmail: string) => {
    const normalizedEmail = invitedEmail.toLowerCase();
    
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
        throw new Error("El proyecto no existe.");
    }

    // Check if user is already a member
    const membersRef = collection(db, `projects/${projectId}/members`);
    const memberQuery = query(membersRef, where("email", "==", normalizedEmail));
    const memberSnapshot = await getDocs(memberQuery);
    if (!memberSnapshot.empty) {
        throw new Error("Este usuario ya es miembro del proyecto.");
    }
    
    // Check for an existing pending invitation for this email
    const invitationsRef = collection(db, `invitations`);
    const invitationQuery = query(invitationsRef, where("email", "==", normalizedEmail), where("projectId", "==", projectId), where("status", "==", "pending"));
    const invitationSnapshot = await getDocs(invitationQuery);
    if (!invitationSnapshot.empty) {
        throw new Error("Ya existe una invitación pendiente para este correo electrónico en este proyecto.");
    }

    // Create a new invitation in the root collection
    await addDoc(invitationsRef, {
        email: normalizedEmail,
        projectId: projectId,
        projectName: projectDoc.data().name,
        invitedByUserEmail: inviterEmail,
        status: 'pending',
        createdAt: serverTimestamp()
    });
};

export const getInvitationsForUser = async (userEmail: string): Promise<ProjectInvitation[]> => {
    const normalizedEmail = userEmail.toLowerCase();
    const invitations: ProjectInvitation[] = [];
    
    const q = query(collection(db, "invitations"), where("email", "==", normalizedEmail), where("status", "==", "pending"));
    
    const invitationsSnapshot = await getDocs(q);
    invitationsSnapshot.forEach(doc => {
        invitations.push({ id: doc.id, ...doc.data() } as ProjectInvitation);
    });

    return invitations;
}

export const acceptInvitation = async (userId: string, userEmail: string, invitationId: string, projectId: string) => {
    const batch = writeBatch(db);

    // 1. Update invitation status to 'accepted'
    const invitationRef = doc(db, `invitations`, invitationId);
    batch.update(invitationRef, { status: 'accepted' });

    // 2. Add user to the project's members subcollection
    const memberRef = doc(db, `projects/${projectId}/members`, userId);
    batch.set(memberRef, { email: userEmail.toLowerCase(), role: 'member' });

    // 3. Add project to the user's list of projects
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { projects: arrayUnion(projectId) });

    await batch.commit();
};

export const declineInvitation = async (invitationId: string) => {
    const invitationRef = doc(db, "invitations", invitationId);
    await deleteDoc(invitationRef);
};


// Columns
export const getColumns = (projectId: string, callback: (columns: Column[]) => void) => {
    if (!projectId) return () => {};
    const columnsQuery = query(collection(db, `projects/${projectId}/columns`));
    
    const unsubscribe = onSnapshot(columnsQuery, (querySnapshot) => {
        const columns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
        callback(columns);
    });

    return unsubscribe; // Return the unsubscribe function
};

export const createColumn = async (projectId: string, column: Omit<Column, 'id'>) => {
    const docRef = await addDoc(collection(db, `projects/${projectId}/columns`), column);
    return docRef.id;
};

export const updateColumn = async (projectId: string, columnId: string, data: Partial<Omit<Column, 'id'>>) => {
    const columnRef = doc(db, `projects/${projectId}/columns`, columnId);
    return await updateDoc(columnRef, data);
};

export const deleteColumn = async (projectId: string, columnId: string) => {
    const columnRef = doc(db, `projects/${projectId}/columns`, columnId);
    
    const tasksSnapshot = await getDocs(query(collection(db, `projects/${projectId}/tasks`), where('columnId', '==', columnId), limit(1)));
    if (!tasksSnapshot.empty) {
        throw new Error("Column is not empty. Move tasks before deleting.");
    }

    return await deleteDoc(columnRef);
};

// Tasks
export const getTasks = async (projectId: string): Promise<Task[]> => {
    if (!projectId) return [];
    const tasksQuery = query(collection(db, `projects/${projectId}/tasks`));
    const querySnapshot = await getDocs(tasksQuery);
    return querySnapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as Task));
};


export const getTasksWithListener = (projectId: string, callback: (tasks: Task[]) => void) => {
    if (!projectId) return () => {};
    const tasksQuery = query(collection(db, `projects/${projectId}/tasks`));

    const unsubscribe = onSnapshot(tasksQuery, (querySnapshot) => {
        const tasks = querySnapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as Task));
        callback(tasks);
    });
    
    return unsubscribe; // Return the unsubscribe function
};

export const createTask = async (projectId: string, task: Omit<Task, 'id' | 'projectId'>): Promise<string> => {
    const taskData: { [key: string]: any } = { ...task };

    Object.keys(taskData).forEach(key => {
        if (taskData[key] === undefined) {
            delete taskData[key];
        }
    });

    const docRef = await addDoc(collection(db, `projects/${projectId}/tasks`), taskData);
    return docRef.id;
};

export const updateTask = async (projectId: string, taskId: string, task: Partial<Omit<Task, 'id' | 'projectId'>>) => {
    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
    
    const updateData: { [key: string]: any } = { ...task };
    
    Object.keys(updateData).forEach(key => {
        if (updateData[key] === undefined) {
            delete updateData[key];
        }
    });

    return await updateDoc(taskRef, updateData);
};

export const deleteTask = async (projectId: string, taskId: string) => {
    const taskRef = doc(db, `projects/${projectId}/tasks`, taskId);
    return await deleteDoc(taskRef);
};


// Chat Messages
export const getChatMessages = (projectId: string, callback: (messages: ChatMessage[]) => void) => {
    const messagesRef = collection(db, `projects/${projectId}/messages`);
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const messages = querySnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
        } as ChatMessage));
        callback(messages);
    });

    return unsubscribe;
};

export const sendChatMessage = async (projectId: string, message: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    const messagesRef = collection(db, `projects/${projectId}/messages`);
    return await addDoc(messagesRef, {
        ...message,
        timestamp: serverTimestamp()
    });
};

// Whiteboard
export const getWhiteboardUpdates = (projectId: string, callback: (paths: WhiteboardPath[]) => void) => {
    const whiteboardRef = collection(db, `projects/${projectId}/whiteboard`);
    const q = query(whiteboardRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
        const paths: WhiteboardPath[] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as WhiteboardPath));
        callback(paths);
    });

    return unsubscribe;
};

export const drawOnWhiteboard = async (projectId: string, pathData: { path: WhiteboardPoint[], color: string }) => {
    const whiteboardRef = collection(db, `projects/${projectId}/whiteboard`);
    return await addDoc(whiteboardRef, { ...pathData, timestamp: serverTimestamp() });
}

export const clearWhiteboard = async (projectId: string) => {
    const whiteboardRef = collection(db, `projects/${projectId}/whiteboard`);
    const snapshot = await getDocs(whiteboardRef);
    const batch = writeBatch(db);
    snapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
    });
    await batch.commit();
}
