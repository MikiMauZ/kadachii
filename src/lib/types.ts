
export interface ChecklistItem {
  id: string;
  text: string;
  completed: boolean;
}

export interface Assignee {
  id: string; // Typically user ID
  name: string;
  avatarUrl: string;
  email: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  assignees?: Assignee[];
  columnId: string;
  projectId: string;
  dueDate?: string; 
  checklist?: ChecklistItem[];
}

export interface Column {
  id: string;
  title: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  ownerId: string;
}

export interface ProjectMember {
    id: string; // User ID
    email: string;
    role: 'owner' | 'member';
    name?: string; 
    avatarUrl?: string;
}
