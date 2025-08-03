
'use client';
import { Header } from '@/components/header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { useAuth } from '@/components/auth-provider';
import React, { useEffect, useState } from 'react';
import { Project, Column, Task } from '@/lib/types';
import { getColumns, getProject, getTasks } from '@/lib/data';

export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const { projectId } = React.use(params);

  useEffect(() => {
    if (user && projectId) {
      const fetchData = async () => {
        setLoading(true);
        try {
          const [projectData, projectColumns, projectTasks] = await Promise.all([
            getProject(projectId),
            getColumns(projectId),
            getTasks(projectId),
          ]);
          setProject(projectData);
          setColumns(projectColumns);
          setTasks(projectTasks);
        } catch (error) {
           console.error("Error fetching project data:", error);
           setProject(null);
           setColumns([]);
           setTasks([]);
        } finally {
            setLoading(false);
        }
      };
      fetchData();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user, projectId]);

  const handleProjectCreated = (newProject: Project) => {
    // This is handled on the main dashboard page now
  }

  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header 
        onProjectCreated={handleProjectCreated}
        projectName={project?.name} 
      />
      <main className="flex flex-1 overflow-x-auto">
        <KanbanBoard
            key={projectId}
            initialColumns={columns}
            setInitialColumns={setColumns}
            initialTasks={tasks}
            setInitialTasks={setTasks}
            projectId={projectId}
            loading={loading}
            onDeleteTask={handleDeleteTask}
        />
      </main>
    </div>
  );
}
