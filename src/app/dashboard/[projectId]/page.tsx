
'use client';
import { Header } from '@/components/header';
import { KanbanBoard } from '@/components/kanban/kanban-board';
import { useAuth } from '@/components/auth-provider';
import React, { useEffect, useState } from 'react';
import { Project, Column, Task } from '@/lib/types';
import { getColumns, getProject, getTasksWithListener } from '@/lib/data';
import { Button } from '@/components/ui/button';
import { MessageSquare } from 'lucide-react';
import { ChatPanel } from '@/components/chat-panel';


export default function ProjectPage({ params }: { params: { projectId: string } }) {
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const projectId = React.use(params).projectId;

  useEffect(() => {
    if (user && projectId) {
      setLoading(true);
      
      const fetchStaticData = async () => {
        try {
          const projectData = await getProject(projectId);
          setProject(projectData);
        } catch (error) {
           console.error("Error fetching project data:", error);
           setProject(null);
        }
      };

      fetchStaticData();

      const unsubscribeColumns = getColumns(projectId, (projectColumns) => {
        setColumns(projectColumns);
        setLoading(false); // Assume loading is finished after first column fetch
      });

      const unsubscribeTasks = getTasksWithListener(projectId, (projectTasks) => {
        setTasks(projectTasks);
      });

      // Cleanup subscription on unmount
      return () => {
        unsubscribeColumns();
        unsubscribeTasks();
      };
    } else if (user === null) {
      setLoading(false);
      setColumns([]);
      setTasks([]);
      setProject(null);
    }
  }, [user, projectId]);

  const handleProjectCreated = (newProject: Project) => {
    // This is handled on the main dashboard page now
  }

  // Optimistic updates are now handled by real-time listeners. 
  // We can still keep these handlers for components that might not be subscribed yet,
  // or to provide an immediate UI feedback before the listener catches up.
  const handleDeleteTask = (taskId: string) => {
    setTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header 
        onProjectCreated={handleProjectCreated}
        projectName={project?.name} 
      />
      <main className="flex flex-1 overflow-x-auto relative">
        <KanbanBoard
            key={projectId}
            initialColumns={columns}
            setInitialColumns={setColumns}
            initialTasks={tasks}
            setInitialTasks={setTasks}
            projectId={projectId}
            loading={loading}
        />
         {!isChatOpen && (
          <Button
            className="fixed bottom-4 right-4 z-40 rounded-full h-14 w-14 shadow-lg"
            onClick={() => setIsChatOpen(true)}
            size="icon"
          >
            <MessageSquare className="h-6 w-6" />
          </Button>
        )}

        {isChatOpen && <ChatPanel projectId={projectId} onClose={() => setIsChatOpen(false)} />}
      </main>
    </div>
  );
}
