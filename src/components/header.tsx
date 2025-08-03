
"use client";

import type { Project } from "@/lib/types";
import {
  LayoutGrid,
  LogOut,
  Plus,
  Settings,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ProjectModal } from "@/components/project-modal";
import React from "react";
import { SettingsModal } from "./settings-modal";
import { TeamModal } from "./team-modal";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { useAuth } from "./auth-provider";
import { auth } from "@/lib/firebase";
import { usePathname, useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import Link from "next/link";

interface HeaderProps {
  onProjectCreated: (project: Project) => void;
  projectName?: string;
}

export function Header({ onProjectCreated, projectName }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const isDashboardHome = pathname === '/dashboard';
  const isProjectPage = pathname.startsWith('/dashboard/') && !isDashboardHome;


  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
      <nav className="flex w-full items-center gap-6 text-lg font-medium md:gap-5 md:text-sm">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:text-base">
          <LayoutGrid className="h-6 w-6 text-primary" />
          <span className="font-headline text-xl">Kadichii</span>
        </Link>
        
        {projectName && (
          <>
            <span className="text-muted-foreground">/</span>
            <h1 className="font-semibold text-lg truncate">{projectName}</h1>
          </>
        )}


        <div className="ml-auto flex items-center gap-4">
          {isDashboardHome && (
            <ProjectModal onProjectCreated={onProjectCreated}>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nuevo Proyecto
              </Button>
            </ProjectModal>
          )}
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                  <Avatar className="h-9 w-9">
                    <AvatarImage src={user.photoURL ?? "https://placehold.co/100x100.png"} alt="@user" data-ai-hint="person portrait" />
                    <AvatarFallback>{user.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user.displayName ?? "Usuario Anónimo"}</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                  <SettingsModal>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Configuración</span>
                    </DropdownMenuItem>
                  </SettingsModal>
                  {isProjectPage && (
                    <TeamModal>
                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                        <Users className="mr-2 h-4 w-4" />
                        <span>Equipo</span>
                        </DropdownMenuItem>
                    </TeamModal>
                  )}
                <DropdownMenuSeparator />
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Cerrar sesión</span>
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                      <AlertDialogDescription>
                        Esta acción cerrará tu sesión actual.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancelar</AlertDialogCancel>
                      <AlertDialogAction onClick={handleLogout}>Cerrar sesión</AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </nav>
    </header>
  );
}
