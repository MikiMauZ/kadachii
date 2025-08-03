
'use client';
import { Header } from '@/components/header';
import { useAuth } from '@/components/auth-provider';
import { useEffect, useState } from 'react';
import { Project, Task } from '@/lib/types';
import { deleteProject, getProjects, getTasks, updateProject } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MoreHorizontal, Plus, Trash, Edit } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectModal } from '@/components/project-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EditProjectModal } from '@/components/edit-project-modal';

interface ProjectWithTasks extends Project {
  taskCount: number;
  completedTaskCount: number;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [projects, setProjects] = useState<ProjectWithTasks[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjectsAndTasks();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user]);

  const fetchProjectsAndTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userProjects = await getProjects(user.uid);
      const projectsWithTasks: ProjectWithTasks[] = await Promise.all(
        userProjects.map(async (project) => {
          const tasks = await getTasks(project.id);
          const completedTasks = tasks.filter(
            (task) => task.columnId === 'hecho' // Assuming 'hecho' is the done column
          );
          return {
            ...project,
            taskCount: tasks.length,
            completedTaskCount: completedTasks.length,
          };
        })
      );
      setProjects(projectsWithTasks);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({ title: "Error al cargar los proyectos", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleProjectCreated = (project: Project) => {
    const newProjectWithTasks: ProjectWithTasks = {
        ...project,
        taskCount: 0,
        completedTaskCount: 0,
    };
    setProjects(prevProjects => [...prevProjects, newProjectWithTasks]);
  };
  
  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prevProjects => prevProjects.map(p => 
        p.id === updatedProject.id ? { ...p, ...updatedProject } : p
    ));
  };

  const handleProjectDeleted = async (projectId: string) => {
    try {
      await deleteProject(projectId);
      setProjects(prevProjects => prevProjects.filter(p => p.id !== projectId));
      toast({ title: "Proyecto eliminado con éxito" });
    } catch (error) {
      console.error("Error deleting project:", error);
      toast({ title: "Error al eliminar el proyecto", variant: 'destructive' });
    }
  };


  return (
    <div className="flex min-h-screen w-full flex-col bg-background">
      <Header onProjectCreated={handleProjectCreated} />
      <main className="flex-1 p-4 md:p-6 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Mis Proyectos</h1>
           <ProjectModal onProjectCreated={handleProjectCreated}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </ProjectModal>
        </div>
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[...Array(3)].map((_, i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-full mt-2" />
                </CardHeader>
                <CardContent>
                   <Skeleton className="h-4 w-1/2" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {projects.map((project) => (
              <Card key={project.id} className="h-full flex flex-col group">
                <div className="relative">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                       <EditProjectModal project={project} onProjectUpdated={handleProjectUpdated}>
                         <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Edit className="mr-2 h-4 w-4" />
                            Editar
                          </DropdownMenuItem>
                       </EditProjectModal>
                      <AlertDialog>
                          <AlertDialogTrigger asChild>
                             <DropdownMenuItem onSelect={(e) => e.preventDefault()} className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                              <AlertDialogHeader>
                                  <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                      Esta acción no se puede deshacer. Esto eliminará permanentemente tu proyecto y todos los datos asociados, incluidas las tareas y columnas.
                                  </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleProjectDeleted(project.id)} className="bg-destructive hover:bg-destructive/90">
                                      Eliminar
                                  </AlertDialogAction>
                              </AlertDialogFooter>
                          </AlertDialogContent>
                      </AlertDialog>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                 <Link href={`/dashboard/${project.id}`} className="flex-grow">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 h-[40px]">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-sm text-muted-foreground">
                        {project.completedTaskCount} / {project.taskCount} tareas completadas
                      </div>
                    </CardContent>
                 </Link>
              </Card>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-[calc(100vh-200px)] w-full gap-4 p-8 text-center border-2 border-dashed rounded-lg">
            <h2 className="text-2xl font-bold">¡Bienvenido a Kadichii!</h2>
            <p className="text-muted-foreground max-w-md">
              Parece que aún no tienes ningún proyecto. ¡Crea uno para empezar a organizar tus tareas!
            </p>
             <ProjectModal onProjectCreated={handleProjectCreated}>
                <Button>
                    <Plus className="mr-2 h-4 w-4" />
                    Crear mi primer proyecto
                </Button>
            </ProjectModal>
          </div>
        )}
      </main>
    </div>
  );
}

    