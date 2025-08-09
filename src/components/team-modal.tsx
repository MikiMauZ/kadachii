
"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Plus } from "lucide-react";
import { useAuth } from "./auth-provider";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useToast } from "@/hooks/use-toast";
import { useEffect, useState, useMemo } from "react";
import { ProjectMember } from "@/lib/types";
import { inviteUserToProject, getProjectMembers } from "@/lib/data";
import { usePathname } from "next/navigation";


const isAvatarAnEmoji = (url: string | null | undefined) => {
    if (!url) return false;
    return url.length > 0 && !url.startsWith('http');
}

export function TeamModal({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const pathname = usePathname();
    
    const projectId = useMemo(() => {
        const parts = pathname.split('/');
        if (parts.length === 3 && parts[1] === 'dashboard') {
            return parts[2];
        }
        return '';
    }, [pathname]);

    const [members, setMembers] = useState<ProjectMember[]>([]);
    const [inviteEmail, setInviteEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingMembers, setLoadingMembers] = useState(false);
    const [open, setOpen] = useState(false);


    useEffect(() => {
        if (open && projectId) {
            setLoadingMembers(true);
            getProjectMembers(projectId)
                .then(setMembers)
                .catch(console.error)
                .finally(() => setLoadingMembers(false));
        }
    }, [open, projectId]);

    const handleInvite = async () => {
        const normalizedEmail = inviteEmail.trim().toLowerCase();
        if (!user?.email || !normalizedEmail || !/^\S+@\S+\.\S+$/.test(normalizedEmail)) {
            toast({ title: "Por favor, introduce un email válido.", variant: "destructive" });
            return;
        }
        if (!projectId) {
            toast({ title: "ID de proyecto no válido.", variant: "destructive" });
            return;
        }
        if (members.some(member => member.email.toLowerCase() === normalizedEmail)) {
            toast({ title: "Este usuario ya es miembro del proyecto.", variant: "default" });
            return;
        }

        setLoading(true);
        try {
            await inviteUserToProject(projectId, user.email, normalizedEmail);
            setInviteEmail("");
            toast({ title: "¡Invitación enviada con éxito!" });
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error al invitar", description: error.message, variant: "destructive" });
        } finally {
            setLoading(false);
        }
    }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Gestionar Equipo</DialogTitle>
          <DialogDescription>
            Invita y gestiona los miembros de tu equipo para este proyecto.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
             <div className="space-y-2">
                <Label htmlFor="invite-email">Invitar por email</Label>
                <div className="flex gap-2">
                    <Input id="invite-email" type="email" placeholder="email@ejemplo.com" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} />
                    <Button onClick={handleInvite} disabled={loading}>
                        <Plus className="mr-2 h-4 w-4" />
                        {loading ? "Invitando..." : "Invitar"}
                    </Button>
                </div>
            </div>
          <div className="space-y-4 pt-4">
             <h4 className="text-sm font-medium text-muted-foreground">Miembros del equipo ({members.length})</h4>
             <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
                {loadingMembers ? (
                    <p className="text-sm text-muted-foreground">Cargando miembros...</p>
                ) : members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                           {isAvatarAnEmoji(member.avatarUrl) ? (
                              <AvatarFallback className="text-xl bg-transparent">{member.avatarUrl}</AvatarFallback>
                          ) : (
                              <>
                                <AvatarImage src={member.avatarUrl} alt={member.name ?? member.email} data-ai-hint="person portrait"/>
                                <AvatarFallback>{(member.name ?? member.email).charAt(0).toUpperCase()}</AvatarFallback>
                              </>
                          )}
                        </Avatar>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium">{member.name ?? member.email} {member.id === user?.uid && '(Tú)'}</p>
                             <span className="h-2 w-2 rounded-full bg-green-500"></span>
                          </div>
                          <p className="text-xs text-muted-foreground">{member.email}</p>
                        </div>
                    </div>
                    <span className="text-xs text-muted-foreground capitalize">{member.role}</span>
                    </div>
                ))}
             </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
