

import type { Project, Column, Task, ProjectMember, Assignee, ChatMessage, ProjectInvitation, WhiteboardPath, WhiteboardPoint } from "./types";
import { db, auth } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where, writeBatch, getDoc, arrayUnion, arrayRemove, onSnapshot, serverTimestamp, orderBy, limit } from 'firebase/firestore';
import { deleteUser } from "firebase/auth";

// Users
export const createUser = async (userId: string, data: { email: string }) => {
    const userRef = doc(db, 'users', userId);
    const displayName = data.email.split('@')[0];
    return await setDoc(userRef, { 
        ...data, 
        projects: [],
        displayName: displayName, 
        photoURL: displayName.charAt(0).toUpperCase()
     }, { merge: true });
};

export const getUser = async (userId: string) => {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
        const data = userSnap.data();
        return { id: userSnap.id, ...data };
    }
    return null;
}

export const updateUser = async (userId: string, data: Partial<{ displayName: string; photoURL: string }>) => {
    const userRef = doc(db, 'users', userId);
    return await updateDoc(userRef, data);
};

export const deleteUserAccount = async (userId: string) => {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
        throw new Error("Autenticación requerida.");
    }

    const batch = writeBatch(db);
    const userRef = doc(db, 'users', userId);

    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
        await deleteUser(user);
        return;
    }
    const projectIds = userSnap.data().projects || [];

    for (const projectId of projectIds) {
        const projectRef = doc(db, 'projects', projectId);
        const projectSnap = await getDoc(projectRef);
        if (projectSnap.exists()) {
            if (projectSnap.data().ownerId === userId) {
                await deleteProject(projectId); 
            } else {
                const memberRef = doc(db, `projects/${projectId}/members`, userId);
                batch.delete(memberRef);
            }
        }
    }
    
    if (user.email) {
        const invitationsQuery = query(collection(db, "invitations"), where("email", "==", user.email));
        const invitationsSnapshot = await getDocs(invitationsQuery);
        invitationsSnapshot.forEach(doc => batch.delete(doc.ref));
    }


    batch.delete(userRef);

    await batch.commit();

    await deleteUser(user);
};


export const exportUserData = async (userId: string) => {
    const user = auth.currentUser;
    if (!user || user.uid !== userId) {
        throw new Error("Autenticación requerida.");
    }

    const userData: any = {};

    const userSnap = await getDoc(doc(db, 'users', userId));
    if (userSnap.exists()) {
        userData.profile = userSnap.data();
    }

    const projectIds = userSnap.exists() ? userSnap.data().projects || [] : [];
    
    if (projectIds.length > 0) {
        userData.projects = [];
        for (const projectId of projectIds) {
            const projectSnap = await getDoc(doc(db, 'projects', projectId));
            if (projectSnap.exists()) {
                const projectData = { id: projectId, ...projectSnap.data(), tasks: [] as any[] };
                
                const tasksSnapshot = await getDocs(collection(db, `projects/${projectId}/tasks`));
                tasksSnapshot.forEach(taskDoc => {
                    const taskData = taskDoc.data() as Task;
                    const isAssignee = taskData.assignees?.some(a => a.id === userId);
                    if (isAssignee) {
                        projectData.tasks.push({ id: taskDoc.id, ...taskData });
                    }
                });
                userData.projects.push(projectData);
            }
        }
    }

    if (user.email) {
        const invitations = await getInvitationsForUser(user.email);
        if (invitations.length > 0) {
            userData.invitations = invitations;
        }
    }
    
    return userData;
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

export const createProject = async (
    userId: string,
    userEmail: string,
    userName: string | null,
    userAvatar: string | null,
    project: Omit<Project, 'id' | 'ownerId'>
): Promise<string> => {
    const batch = writeBatch(db);

    const projectRef = doc(collection(db, 'projects'));
    batch.set(projectRef, { ...project, ownerId: userId });

    const columnsData = [
      { title: 'Por Hacer', order: 0 },
      { title: 'En Progreso', order: 1 },
      { title: 'Hecho', order: 2 }
    ];
    columnsData.forEach(col => {
        const colRef = doc(collection(db, `projects/${projectRef.id}/columns`));
        batch.set(colRef, col);
    });

    const memberRef = doc(db, `projects/${projectRef.id}/members`, userId);
    batch.set(memberRef, { 
        email: userEmail.toLowerCase(), 
        role: 'owner',
        name: userName ?? userEmail,
        avatarUrl: userAvatar ?? ''
    });

    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { projects: arrayUnion(projectRef.id) });

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

    const collectionsToDelete = ['tasks', 'columns', 'members', 'messages', 'invitations', 'whiteboard'];
    for (const subcollection of collectionsToDelete) {
        const subcollectionRef = collection(db, `projects/${projectId}/${subcollection}`);
        const snapshot = await getDocs(subcollectionRef);
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
    }

    const membersSnapshot = await getDocs(collection(db, `projects/${projectId}/members`));
    membersSnapshot.docs.forEach(memberDoc => {
        const userRef = doc(db, 'users', memberDoc.id);
        batch.update(userRef, {
            projects: arrayRemove(projectId)
        });
    });

    batch.delete(projectRef);

    await batch.commit();
};


// Team / Members / Invitations
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    if (!projectId) return [];
    const membersSnapshot = await getDocs(collection(db, `projects/${projectId}/members`));
    const memberIds = membersSnapshot.docs.map(doc => doc.id);
    
    if(memberIds.length === 0) return [];

    const chunks = [];
    for (let i = 0; i < memberIds.length; i += 30) {
        chunks.push(memberIds.slice(i, i + 30));
    }
    
    const usersData = new Map<string, any>();
    for(const chunk of chunks) {
        const usersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', 'in', chunk)));
        usersSnapshot.forEach(doc => usersData.set(doc.id, doc.data()));
    }
    
    const allMembers: ProjectMember[] = membersSnapshot.docs.map(doc => {
        const memberData = doc.data();
        const userData = usersData.get(doc.id);
        
        return {
            id: doc.id,
            email: memberData.email,
            role: memberData.role,
            name: userData?.displayName ?? memberData.email,
            avatarUrl: userData?.photoURL ?? ''
        } as ProjectMember;
    }).filter(member => !!usersData.get(member.id)); 
    
    return allMembers;
};


export const inviteUserToProject = async (projectId: string, inviterEmail: string, invitedEmail: string) => {
    const normalizedEmail = invitedEmail.toLowerCase();
    
    const projectDoc = await getDoc(doc(db, 'projects', projectId));
    if (!projectDoc.exists()) {
        throw new Error("El proyecto no existe.");
    }

    const membersRef = collection(db, `projects/${projectId}/members`);
    const memberQuery = query(membersRef, where("email", "==", normalizedEmail));
    const memberSnapshot = await getDocs(memberQuery);
    if (!memberSnapshot.empty) {
        throw new Error("Este usuario ya es miembro del proyecto.");
    }
    
    const invitationsRef = collection(db, `invitations`);
    const invitationQuery = query(invitationsRef, where("email", "==", normalizedEmail), where("projectId", "==", projectId), where("status", "==", "pending"));
    const invitationSnapshot = await getDocs(invitationQuery);
    if (!invitationSnapshot.empty) {
        throw new Error("Ya existe una invitación pendiente para este correo electrónico en este proyecto.");
    }

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

    const invitationRef = doc(db, `invitations`, invitationId);
    batch.update(invitationRef, { status: 'accepted' });
    
    const userDoc = await getUser(userId);

    const memberRef = doc(db, `projects/${projectId}/members`, userId);
    batch.set(memberRef, { 
        email: userEmail.toLowerCase(), 
        role: 'member',
        name: userDoc?.displayName ?? userEmail,
        avatarUrl: userDoc?.photoURL ?? ''
    });

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
    const columnsQuery = query(collection(db, `projects/${projectId}/columns`), orderBy("order", "asc"));
    
    const unsubscribe = onSnapshot(columnsQuery, (querySnapshot) => {
        const columns = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
        callback(columns);
    });

    return unsubscribe; 
};

export const createColumn = async (projectId: string, column: Omit<Column, 'id' | 'order'> & { order: number }) => {
    const docRef = await addDoc(collection(db, `projects/${projectId}/columns`), column);
    return docRef.id;
};

export const updateColumn = async (projectId: string, columnId: string, data: Partial<Omit<Column, 'id'>>) => {
    const columnRef = doc(db, `projects/${projectId}/columns`, columnId);
    return await updateDoc(columnRef, data);
};

export const updateColumnOrder = async (projectId: string, columnId: string, order: number) => {
    const columnRef = doc(db, `projects/${projectId}/columns`, columnId);
    return await updateDoc(columnRef, { order });
};

export const batchUpdateColumnOrder = async (projectId: string, updates: { id: string, order: number }[]) => {
    const batch = writeBatch(db);
    updates.forEach(update => {
        const columnRef = doc(db, `projects/${projectId}/columns`, update.id);
        batch.update(columnRef, { order: update.order });
    });
    return await batch.commit();
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
    
    return unsubscribe;
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
