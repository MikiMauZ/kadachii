
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "./auth-provider";
import { useState, useEffect } from "react";
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword, updateProfile } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";
import { updateUser, deleteUserAccount, exportUserData } from "@/lib/data";
import { cn } from "@/lib/utils";
import { Download, Trash } from "lucide-react";

const EMOJIS = ['😀', '😎', '🚀', '🎉', '💡', '🧠', '🔥', '💻', '🤔', '😊', '🥳', 'M'];

export function SettingsModal({ children }: { children: React.ReactNode }) {
    const { user, refreshUser } = useAuth();
    const { toast } = useToast();
    const [displayName, setDisplayName] = useState('');
    const [selectedAvatar, setSelectedAvatar] = useState('');
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [open, setOpen] = useState(false);
    const [isExporting, setIsExporting] = useState(false);

    useEffect(() => {
        if (user) {
            setDisplayName(user.displayName ?? '');
            setSelectedAvatar(user.photoURL ?? '');
        }
    }, [user, open]);


    const handleSaveChanges = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) {
            toast({ title: "No estás autenticado", variant: "destructive"});
            return;
        }

        let changesMade = false;
        const updatePayload: Partial<{ displayName: string; photoURL: string }> = {};

        const nameChanged = displayName !== (currentUser.displayName ?? '');
        const avatarChanged = selectedAvatar && selectedAvatar !== (currentUser.photoURL ?? '');
        
        if (nameChanged) {
            updatePayload.displayName = displayName;
        }
        if (avatarChanged) {
            updatePayload.photoURL = selectedAvatar;
        }
        
        if (Object.keys(updatePayload).length > 0) {
            try {
                await updateUser(currentUser.uid, updatePayload);

                await updateProfile(currentUser, { 
                    displayName: updatePayload.displayName ?? currentUser.displayName,
                    photoURL: updatePayload.photoURL ?? currentUser.photoURL
                });

                toast({ title: "Perfil actualizado con éxito" });
                refreshUser();
                changesMade = true;
            } catch (error) {
                 console.error("Error updating profile:", error);
                 toast({ title: "Error al actualizar el perfil", variant: "destructive"});
            }
        }
        
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
                if (!currentUser.email) throw new Error("No hay email de usuario para reautenticar");
                const credential = EmailAuthProvider.credential(currentUser.email, currentPassword);
                await reauthenticateWithCredential(currentUser, credential);
                await updatePassword(currentUser, newPassword);
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
        } else {
            toast({ title: "No se han realizado cambios" });
        }
    };

    const handleDeleteAccount = async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) return;
      try {
        await deleteUserAccount(currentUser.uid);
        toast({title: "Cuenta eliminada", description: "Tu cuenta y todos tus datos han sido eliminados."})
        setOpen(false);
      } catch (error) {
        console.error("Error deleting account:", error);
        toast({title: "Error al eliminar la cuenta", variant: "destructive"});
      }
    }

    const handleExportData = async () => {
        const currentUser = auth.currentUser;
        if (!currentUser) return;
        setIsExporting(true);
        toast({ title: "Recopilando tus datos...", description: "Esto puede tardar unos segundos." });
        try {
            const userData = await exportUserData(currentUser.uid);
            const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                JSON.stringify(userData, null, 2)
            )}`;
            const link = document.createElement("a");
            link.href = jsonString;
            link.download = "kadichii_user_data.json";
            link.click();
            toast({ title: "¡Datos exportados!" });
        } catch (error) {
            console.error("Error exporting data:", error);
            toast({ title: "Error al exportar tus datos", variant: "destructive"});
        } finally {
            setIsExporting(false);
        }
    }


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
        <div className="grid gap-6 py-4 max-h-[70vh] overflow-y-auto pr-4">
            <div>
                 <Label className="text-center block mb-4">Elige tu Avatar</Label>
                 <div className="flex flex-wrap justify-center gap-2">
                     {EMOJIS.map(emoji => (
                         <button 
                            key={emoji}
                            onClick={() => setSelectedAvatar(emoji)}
                            className={cn(
                                "text-2xl p-2 rounded-full transition-all w-12 h-12 flex items-center justify-center bg-muted",
                                selectedAvatar === emoji ? "ring-2 ring-primary scale-110" : "hover:bg-accent"
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
                <Input id="email" type="email" value={user?.email ?? ""} className="col-span-3" disabled />
            </div>

             <div className="border-t pt-4">
                 <p className="text-sm text-muted-foreground text-center mb-4">Configuración de la cuenta</p>
                 <div className="flex justify-center">
                    <Button variant="outline" onClick={handleExportData} disabled={isExporting}>
                        <Download className="mr-2 h-4 w-4" />
                        {isExporting ? "Exportando..." : "Descargar mis datos"}
                    </Button>
                 </div>
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

          <div className="border-t pt-4 mt-4">
             <h4 className="text-center font-semibold text-destructive">Zona de Peligro</h4>
              <div className="mt-4 flex justify-center">
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                           <Button variant="destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Eliminar mi cuenta
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>¿Estás absolutamente seguro?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Esta acción es irreversible. Todos tus datos, incluidos proyectos y tareas, se eliminarán permanentemente. No podrás recuperar tu cuenta.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Cancelar</AlertDialogCancel>
                              <AlertDialogAction onClick={handleDeleteAccount} className="bg-destructive hover:bg-destructive/90">
                                  Sí, eliminar mi cuenta
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>
          </div>
        </div>
        <DialogFooter className="border-t pt-4">
          <Button onClick={handleSaveChanges}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
