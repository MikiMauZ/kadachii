
"use client";

import type { Project } from "@/lib/types";
import {
  LayoutGrid,
  LogOut,
  PenSquare,
  Rows3,
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
import React, from "react";
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
import Image from "next/image";
import { Whiteboard } from "./whiteboard";
import { ToggleGroup, ToggleGroupItem } from "./ui/toggle-group";

interface HeaderProps {
  onProjectCreated: (project: Project) => void;
  projectName?: string;
  layout?: 'row' | 'grid';
  setLayout?: (layout: 'row' | 'grid') => void;
}

const isAvatarAnEmoji = (url: string | null | undefined) => {
    if (!url) return false;
    return url.length > 0 && !url.startsWith('http');
}


export function Header({ onProjectCreated, projectName, layout, setLayout }: HeaderProps) {
  const { user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isWhiteboardOpen, setIsWhiteboardOpen] = React.useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    router.push('/login');
  };

  const handleLayoutChange = (value: 'row' | 'grid') => {
    if (value && setLayout) { // Check if value is not empty/null
      setLayout(value);
    }
  };

  const isDashboardHome = pathname === '/dashboard';
  const isProjectPage = pathname.startsWith('/dashboard/') && !isDashboardHome;
  const projectId = isProjectPage ? pathname.split('/')[2] : undefined;


  return (
    <>
      <header className="sticky top-0 z-30 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
        <nav className="flex w-full items-center gap-6 text-lg font-medium md:gap-5 md:text-sm">
          <Link href="/dashboard" className="flex items-center gap-2 font-semibold md:text-base">
            <Image src="/logo.png" alt="Kadichii logo" width={24} height={24} className="h-6 w-6" />
            <span className="font-headline text-xl">Kadichii</span>
          </Link>
          
          {projectName && (
            <>
              <span className="text-muted-foreground">/</span>
              <h1 className="font-semibold text-lg truncate">{projectName}</h1>
            </>
          )}


          <div className="ml-auto flex items-center gap-4">
             {isProjectPage && layout && setLayout && (
               <ToggleGroup type="single" value={layout} onValueChange={handleLayoutChange} aria-label="Kanban Layout">
                  <ToggleGroupItem value="row" aria-label="Row layout">
                      <Rows3 className="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="grid" aria-label="Grid layout">
                      <LayoutGrid className="h-4 w-4" />
                  </ToggleGroupItem>
              </ToggleGroup>
             )}
             {isProjectPage && (
              <Button variant="outline" size="icon" onClick={() => setIsWhiteboardOpen(!isWhiteboardOpen)}>
                <PenSquare />
              </Button>
            )}
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                   <div className="flex flex-col items-center cursor-pointer">
                      <Avatar className="h-9 w-9">
                         {isAvatarAnEmoji(user.photoURL) ? (
                            <AvatarFallback className="text-xl bg-transparent">{user.photoURL}</AvatarFallback>
                          ) : (
                            <>
                              <AvatarImage src={user.photoURL ?? ''} alt="@user" data-ai-hint="person portrait" />
                              <AvatarFallback>{(user.displayName ?? user.email ?? 'U').charAt(0).toUpperCase()}</AvatarFallback>
                            </>
                          )}
                      </Avatar>
                       <span className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        {(user.displayName ?? "User").substring(0, 3)}
                      </span>
                  </div>
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
       {isWhiteboardOpen && projectId && (
        <Whiteboard projectId={projectId} onClose={() => setIsWhiteboardOpen(false)} />
      )}
    </>
  );
}
