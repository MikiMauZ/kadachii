
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
import { Textarea } from "@/components/ui/textarea";
import React, { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/lib/types";
import { updateProject } from "@/lib/data";

interface EditProjectModalProps {
    children: React.ReactNode;
    project: Project;
    onProjectUpdated: (project: Project) => void;
}

export function EditProjectModal({ children, project, onProjectUpdated }: EditProjectModalProps) {
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description);
  const [open, setOpen] = useState(false);
  const { toast } = useToast();

  const handleSave = async () => {
    if (!name.trim()) {
        toast({ title: "El nombre del proyecto no puede estar vacío", variant: "destructive" });
        return;
    }

    try {
        const updatedProjectData = { name, description };
        await updateProject(project.id, updatedProjectData);
        onProjectUpdated({ ...project, ...updatedProjectData });
        setOpen(false);
        toast({ title: "Proyecto actualizado con éxito" });
    } catch (error) {
        console.error(error);
        toast({ title: "Error al actualizar el proyecto", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Editar Proyecto</DialogTitle>
          <DialogDescription>
            Realiza cambios en tu proyecto. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="name" className="text-right">
              Nombre del Proyecto
            </Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3"
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
