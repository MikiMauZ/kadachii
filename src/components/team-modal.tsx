
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
import { addUserToProject, getProjectMembers } from "@/lib/data";
import { usePathname } from "next/navigation";

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
    const [open, setOpen] = useState(false);


    useEffect(() => {
        if (open && projectId) {
            setLoading(true);
            getProjectMembers(projectId)
                .then(setMembers)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [open, projectId]);

    const handleInvite = async () => {
        if (!inviteEmail.trim()) {
            toast({ title: "Por favor, introduce un email.", variant: "destructive" });
            return;
        }
        if (!projectId) {
            toast({ title: "ID de proyecto no válido.", variant: "destructive" });
            return;
        }
        setLoading(true);
        try {
            const newMember = await addUserToProject(projectId, inviteEmail);
            setMembers(prev => [...prev, newMember]);
            setInviteEmail("");
            toast({ title: "¡Usuario invitado con éxito!" });
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
                {members.map(member => (
                    <div key={member.id} className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar className="h-9 w-9">
                        <AvatarImage src={member.avatarUrl ?? `https://placehold.co/100x100.png`} alt={member.name ?? member.email} data-ai-hint="person portrait"/>
                        <AvatarFallback>{member.email?.[0].toUpperCase() ?? 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                        <p className="text-sm font-medium">{member.name ?? member.email} {member.id === user?.uid && '(Tú)'}</p>
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
