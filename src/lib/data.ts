
import type { Project, Column, Task, ProjectMember, Assignee } from "./types";
import { db } from './firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc, setDoc, query, where, writeBatch, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';

// Users
export const createUser = async (userId: string, data: { email: string }) => {
    const userRef = doc(db, 'users', userId);
    // Initialize with an empty projects array and other details
    return await setDoc(userRef, { 
        ...data, 
        projects: [],
        displayName: data.email.split('@')[0], // Default display name
        photoURL: `https://placehold.co/100x100.png?text=${data.email[0].toUpperCase()}`
     }, { merge: true });
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
    batch.set(memberRef, { email: userEmail, role: 'owner' });

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

    // Delete all subcollections (tasks, columns, members)
    const collectionsToDelete = ['tasks', 'columns', 'members'];
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


// Team / Members
export const getProjectMembers = async (projectId: string): Promise<ProjectMember[]> => {
    if (!projectId) return [];
    const membersSnapshot = await getDocs(collection(db, `projects/${projectId}/members`));
    const memberIds = membersSnapshot.docs.map(doc => doc.id);
    
    if(memberIds.length === 0) return [];

    const usersSnapshot = await getDocs(query(collection(db, 'users'), where('__name__', 'in', memberIds)));
    
    const usersData = new Map<string, any>();
    usersSnapshot.forEach(doc => usersData.set(doc.id, doc.data()));

    return membersSnapshot.docs.map(doc => {
        const memberData = doc.data();
        const userData = usersData.get(doc.id) ?? {};
        return {
            id: doc.id,
            email: memberData.email,
            role: memberData.role,
            name: userData.displayName,
            avatarUrl: userData.photoURL
        } as ProjectMember;
    });
};


export const addUserToProject = async (projectId: string, email: string) => {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where("email", "==", email));
    const querySnapshot = await getDocs(q);

    if (querySnapshot.empty) {
        throw new Error("No se encontró ningún usuario con ese correo electrónico.");
    }
    
    const userDoc = querySnapshot.docs[0];
    const userId = userDoc.id;

    const batch = writeBatch(db);
    
    // Add member to project's subcollection
    const memberRef = doc(db, `projects/${projectId}/members`, userId);
    batch.set(memberRef, { email, role: 'member' });

    // Add project to user's list of projects
    const userRef = doc(db, 'users', userId);
    batch.update(userRef, { projects: arrayUnion(projectId) });

    await batch.commit();
    
    const userData = userDoc.data();
    return {
        id: userId,
        email: email,
        role: 'member',
        name: userData.displayName,
        avatarUrl: userData.photoURL
    } as ProjectMember;
};


// Columns
export const getColumns = async (projectId: string): Promise<Column[]> => {
    if (!projectId) return [];
    const querySnapshot = await getDocs(collection(db, `projects/${projectId}/columns`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Column));
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
    
    // Optional: Check if column is empty before deleting
    const tasksSnapshot = await getDocs(query(collection(db, `projects/${projectId}/tasks`), where('columnId', '==', columnId)));
    if (!tasksSnapshot.empty) {
        throw new Error("Column is not empty. Move tasks before deleting.");
    }

    return await deleteDoc(columnRef);
};

// Tasks
export const getTasks = async (projectId: string): Promise<Task[]> => {
    if (!projectId) return [];
    const querySnapshot = await getDocs(collection(db, `projects/${projectId}/tasks`));
    return querySnapshot.docs.map(doc => ({ id: doc.id, projectId, ...doc.data() } as Task));
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
