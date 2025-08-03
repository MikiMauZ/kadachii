
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
import { useAuth } from "./auth-provider";
import { createProject } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Project } from "@/lib/types";

interface ProjectModalProps {
    children: React.ReactNode;
    onProjectCreated: (project: Project) => void;
}

export function ProjectModal({ children, onProjectCreated }: ProjectModalProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async () => {
    if (!user || !user.email) {
        toast({ title: "Debes iniciar sesión para crear un proyecto", variant: "destructive" });
        return;
    }
    if (!name.trim()) {
        toast({ title: "El nombre del proyecto no puede estar vacío", variant: "destructive" });
        return;
    }

    try {
        const newProjectData = { name, description };
        const projectId = await createProject(user.uid, user.email, newProjectData);
        onProjectCreated({id: projectId, ...newProjectData, ownerId: user.uid });
        setName("");
        setDescription("");
        setOpen(false);
        toast({ title: "Proyecto creado con éxito" });
    } catch (error) {
        console.error(error);
        toast({ title: "Error al crear el proyecto", variant: "destructive" });
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Crear Nuevo Proyecto</DialogTitle>
          <DialogDescription>
            Introduce los detalles de tu nuevo proyecto. Haz clic en guardar cuando termines.
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
          <Button onClick={handleSave}>Guardar Proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
