
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "./auth-provider";
import { useState } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { updateUser } from "@/lib/data";
import { cn } from "@/lib/utils";

const EMOJIS = ['😀', '😎', '🚀', '🎉', '💡', '🧠', '🔥', '💻', '🤔', '😊', '🥳', 'M'];

export function SettingsModal({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState(user?.displayName ?? '');
    const [selectedAvatar, setSelectedAvatar] = useState(user?.photoURL ?? '');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [open, setOpen] = useState(false);

    const getEmojiUrl = (emoji: string) => `https://placehold.co/100x100/E8E8E8/000000?text=${emoji}`;

    const handleSaveChanges = async () => {
        if (!user) {
            toast({ title: "No estás autenticado", variant: "destructive"});
            return;
        }

        let changesMade = false;

        const updatePayload: Partial<{ displayName: string; photoURL: string }> = {};

        // 1. Handle display name change
        if (displayName !== user.displayName) {
            updatePayload.displayName = displayName;
        }
        
        // 2. Handle avatar change
        if (selectedAvatar && selectedAvatar !== user.photoURL) {
            updatePayload.photoURL = selectedAvatar;
        }
        
        if (Object.keys(updatePayload).length > 0) {
            try {
                await updateUser(user.uid, updatePayload);
                if (updatePayload.displayName || updatePayload.photoURL) {
                    await updateProfile(user, { 
                        displayName: updatePayload.displayName ?? user.displayName,
                        photoURL: updatePayload.photoURL ?? user.photoURL
                    });
                }
                toast({ title: "Perfil actualizado con éxito" });
                changesMade = true;
            } catch (error) {
                 console.error("Error updating profile:", error);
                 toast({ title: "Error al actualizar el perfil", variant: "destructive"});
            }
        }
        
        // 3. Handle password change (only if fields are filled)
        if (currentPassword || newPassword || confirmPassword) {
            if (newPassword !== confirmPassword) {
                toast({ title: "Las nuevas contraseñas no coinciden", variant: "destructive"});
                return;
            }
            if (!currentPassword || !newPassword) {
                toast({ title: "Por favor, rellena todos los campos de contraseña para cambiarla", variant: "destructive"});
                return;
            }

            try {
                const credential = EmailAuthProvider.credential(user.email!, currentPassword);
                await reauthenticateWithCredential(user, credential);
                await updatePassword(user, newPassword);
                toast({ title: "Contraseña actualizada con éxito" });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
                changesMade = true;
            } catch (error: any) {
                console.error(error);
                toast({ title: "Error al cambiar la contraseña", description: "Asegúrate de que la contraseña actual es correcta.", variant: "destructive"});
            }
        }

        if (changesMade) {
             setOpen(false);
             // Quick hack to force reload and show new avatar in header
             setTimeout(() => window.location.reload(), 500);
        } else {
            toast({ title: "No se han realizado cambios" });
        }
    };


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Gestiona la configuración de tu cuenta y de la aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
            <div>
                 <Label className="text-center block mb-4">Elige tu Avatar</Label>
                 <div className="flex flex-wrap justify-center gap-2">
                     {EMOJIS.map(emoji => (
                         <button 
                            key={emoji}
                            onClick={() => setSelectedAvatar(getEmojiUrl(emoji))}
                            className={cn(
                                "text-2xl p-2 rounded-full transition-all",
                                selectedAvatar === getEmojiUrl(emoji) ? "bg-primary/20 scale-110" : "hover:bg-accent"
                            )}
                         >
                            {emoji}
                         </button>
                     ))}
                 </div>
            </div>
             <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                Nombre
                </Label>
                <Input id="name" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="col-span-3" />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="email" className="text-right">
                Email
                </Label>
                <Input id="email" type="email" defaultValue={user?.email ?? ""} className="col-span-3" disabled />
            </div>

            <div className="border-t pt-4">
             <p className="text-sm text-muted-foreground text-center mb-4">Cambiar contraseña</p>
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="current-password" className="text-right">
                  Contraseña Actual
                </Label>
                <Input id="current-password" type="password" className="col-span-3" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
              </div>
               <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="password" className="text-right">
                  Nueva Contraseña
                </Label>
                <Input id="password" type="password" className="col-span-3" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
              </div>
              <div className="grid grid-cols-4 items-center gap-4 mt-4">
                <Label htmlFor="confirm-password" className="text-right">
                  Confirmar
                </Label>
                <Input id="confirm-password" type="password" className="col-span-3" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
              </div>
          </div>
          
          <div className="flex items-center space-x-2 justify-center">
            <Switch id="dark-mode" />
            <Label htmlFor="dark-mode">Modo oscuro</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
