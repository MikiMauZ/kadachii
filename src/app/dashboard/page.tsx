
'use client';
import { Header } from '@/components/header';
import { useAuth } from '@/components/auth-provider';
import { useEffect, useState } from 'react';
import { Project, Task, ProjectInvitation, ProjectMember } from '@/lib/types';
import { deleteProject, getProjects, getTasks, updateProject, getInvitationsForUser, acceptInvitation, declineInvitation, getProjectMembers, getUser } from '@/lib/data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { MoreHorizontal, Plus, Trash, Edit, Check, X, Mail } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { ProjectModal } from '@/components/project-modal';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { EditProjectModal } from '@/components/edit-project-modal';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface ProjectWithDetails extends Project {
  taskCount: number;
  completedTaskCount: number;
  members: ProjectMember[];
  creator: {
    name: string;
    avatarUrl?: string;
  }
}

const isAvatarAnEmoji = (url: string | null | undefined) => {
    if (!url) return false;
    return url.length > 0 && !url.startsWith('http');
}

export default function DashboardPage() {
  const { user, userVersion } = useAuth();
  const [projects, setProjects] = useState<ProjectWithDetails[]>([]);
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProjectsAndTasks();
      fetchInvitations();
    } else if (user === null) {
      setLoading(false);
    }
  }, [user, userVersion]);

  const fetchProjectsAndTasks = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const userProjects = await getProjects(user.uid);
      const projectsWithDetails: ProjectWithDetails[] = await Promise.all(
        userProjects.map(async (project) => {
          const tasks = await getTasks(project.id);
          const completedTasks = tasks.filter(
            (task: Task) => task.columnId === 'hecho' // Assuming 'hecho' is the done column
          );
           const members = await getProjectMembers(project.id);
           const creatorData = await getUser(project.ownerId);

          return {
            ...project,
            taskCount: tasks.length,
            completedTaskCount: completedTasks.length,
            members,
            creator: {
                name: creatorData?.displayName ?? creatorData?.email ?? 'Desconocido',
                avatarUrl: creatorData?.photoURL
            }
          };
        })
      );
      setProjects(projectsWithDetails);
    } catch (error) {
      console.error("Error fetching projects:", error);
      toast({ title: "Error al cargar los proyectos", variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const fetchInvitations = async () => {
      if (!user?.email) return;
      try {
          const userInvitations = await getInvitationsForUser(user.email);
          setInvitations(userInvitations);
      } catch (error) {
          console.error("Error fetching invitations:", error);
          toast({ title: "Error al cargar las invitaciones", variant: 'destructive' });
      }
  };
  
  const handleAcceptInvitation = async (invitation: ProjectInvitation) => {
    if (!user) return;
    try {
        await acceptInvitation(user.uid, user.email!, invitation.id, invitation.projectId);
        toast({ title: `¡Bienvenido a ${invitation.projectName}!` });
        setInvitations(prev => prev.filter(i => i.id !== invitation.id));
        fetchProjectsAndTasks(); // Refresh project list
    } catch (error) {
        console.error("Error accepting invitation:", error);
        toast({ title: "Error al aceptar la invitación", variant: 'destructive' });
    }
  };

  const handleDeclineInvitation = async (invitation: ProjectInvitation) => {
    try {
        await declineInvitation(invitation.id);
        toast({ title: "Invitación rechazada" });
        setInvitations(prev => prev.filter(i => i.id !== invitation.id));
    } catch (error) {
        console.error("Error declining invitation:", error);
        toast({ title: "Error al rechazar la invitación", variant: 'destructive' });
    }
  };


  const handleProjectCreated = (project: Project) => {
    fetchProjectsAndTasks();
  };
  
  const handleProjectUpdated = (updatedProject: Project) => {
    setProjects(prevProjects => prevProjects.map(p => 
        p.id === updatedProject.id ? { ...p, ...updatedProject } : p
    ));
    // Optionally re-fetch to get updated member details if names/avatars change
    fetchProjectsAndTasks();
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
        
        {invitations.length > 0 && (
            <div className="mb-8">
                 <h2 className="text-xl font-bold mb-4">Invitaciones Pendientes</h2>
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {invitations.map(invitation => (
                         <Card key={invitation.id} className="bg-muted/50">
                             <CardHeader>
                                 <CardTitle className="text-lg">Te han invitado a <span className="font-bold">{invitation.projectName}</span></CardTitle>
                                 <CardDescription>Invitado por: {invitation.invitedByUserEmail}</CardDescription>
                             </CardHeader>
                             <CardContent className="flex gap-4">
                                 <Button onClick={() => handleAcceptInvitation(invitation)} className="w-full">
                                     <Check className="mr-2 h-4 w-4"/> Aceptar
                                 </Button>
                                 <Button onClick={() => handleDeclineInvitation(invitation)} variant="destructive" className="w-full">
                                     <X className="mr-2 h-4 w-4"/> Rechazar
                                 </Button>
                             </CardContent>
                         </Card>
                     ))}
                 </div>
            </div>
        )}

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
                   <Skeleton className="h-8 w-1/4 mt-4" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : projects.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <TooltipProvider>
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
                 <Link href={`/dashboard/${project.id}`} className="flex-grow flex flex-col">
                    <CardHeader>
                      <CardTitle>{project.name}</CardTitle>
                      <CardDescription className="line-clamp-2 h-[40px]">{project.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="flex-grow flex flex-col justify-between">
                      <div className="text-sm text-muted-foreground">
                        {project.completedTaskCount} / {project.taskCount} tareas completadas
                      </div>
                      <div className="flex items-center mt-4">
                         <div className="flex items-start gap-4">
                              <Tooltip>
                                <TooltipTrigger asChild>
                                    <div className="flex flex-col items-center">
                                        <Avatar className="h-8 w-8 border-2 border-primary ring-2 ring-primary z-10">
                                            {isAvatarAnEmoji(project.creator.avatarUrl) ? (
                                            <AvatarFallback className="text-xl bg-transparent">{project.creator.avatarUrl}</AvatarFallback>
                                            ) : (
                                            <>
                                                <AvatarImage src={project.creator.avatarUrl} data-ai-hint="person portrait" />
                                                <AvatarFallback>{(project.creator.name ?? '').charAt(0)}</AvatarFallback>
                                            </>
                                            )}
                                        </Avatar>
                                        <span className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                                            {(project.creator.name ?? "???").substring(0, 3)}
                                        </span>
                                    </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Creado por: {project.creator.name}</p>
                                </TooltipContent>
                             </Tooltip>
                             {project.members.filter(m => m.id !== project.ownerId).map(member => (
                                 <Tooltip key={member.id}>
                                     <TooltipTrigger asChild>
                                        <div className="flex flex-col items-center">
                                            <Avatar className="h-8 w-8 border-2 border-card">
                                                {isAvatarAnEmoji(member.avatarUrl) ? (
                                                    <AvatarFallback className="text-xl bg-transparent">{member.avatarUrl}</AvatarFallback>
                                                ) : (
                                                    <>
                                                        <AvatarImage src={member.avatarUrl} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{(member.name ?? member.email).charAt(0)}</AvatarFallback>
                                                    </>
                                                )}
                                            </Avatar>
                                            <span className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                                                {(member.name ?? "???").substring(0, 3)}
                                            </span>
                                        </div>
                                     </TooltipTrigger>
                                     <TooltipContent><p>{member.name ?? member.email}</p></TooltipContent>
                                 </Tooltip>
                             ))}
                          </div>
                          <span className="text-xs text-muted-foreground ml-3 self-start pt-2">
                            {project.members.length} {project.members.length === 1 ? 'miembro' : 'miembros'}
                          </span>
                      </div>
                    </CardContent>
                 </Link>
              </Card>
            ))}
            </TooltipProvider>
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
