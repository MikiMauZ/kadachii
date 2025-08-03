
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
import { EmailAuthProvider, reauthenticateWithCredential, updatePassword } from "firebase/auth";
import { useToast } from "@/hooks/use-toast";
import { auth } from "@/lib/firebase";

export function SettingsModal({ children }: { children: React.ReactNode }) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const handlePasswordChange = async () => {
        if (!user) {
            toast({ title: "No estás autenticado", variant: "destructive"});
            return;
        }
        if (newPassword !== confirmPassword) {
            toast({ title: "Las nuevas contraseñas no coinciden", variant: "destructive"});
            return;
        }
        if (!currentPassword || !newPassword) {
            toast({ title: "Por favor, rellena todos los campos de contraseña", variant: "destructive"});
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
        } catch (error: any) {
            console.error(error);
            toast({ title: "Error al cambiar la contraseña", description: "Asegúrate de que la contraseña actual es correcta.", variant: "destructive"});
        }
    };


  return (
    <Dialog>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Configuración</DialogTitle>
          <DialogDescription>
            Gestiona la configuración de tu cuenta y de la aplicación.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre
            </Label>
            <Input id="name" defaultValue={user?.displayName ?? "Usuario Anónimo"} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="email" className="text-right">
              Email
            </Label>
            <Input id="email" type="email" defaultValue={user?.email ?? ""} className="col-span-3" disabled />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="current-password" className="text-right">
              Contraseña Actual
            </Label>
            <Input id="current-password" type="password" className="col-span-3" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="password" className="text-right">
              Nueva Contraseña
            </Label>
            <Input id="password" type="password" className="col-span-3" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="confirm-password" className="text-right">
              Confirmar Contraseña
            </Label>
            <Input id="confirm-password" type="password" className="col-span-3" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
          </div>
          <div className="flex items-center space-x-2 justify-center">
            <Switch id="dark-mode" />
            <Label htmlFor="dark-mode">Modo oscuro</Label>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handlePasswordChange}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
