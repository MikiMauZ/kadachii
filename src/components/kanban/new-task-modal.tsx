
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
import { useAuth } from "../auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Task, ChecklistItem } from "@/lib/types";
import { createTask, getUser } from "@/lib/data";
import { Calendar as CalendarIcon, Plus, X as XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";

interface NewTaskModalProps {
  projectId: string;
  columnId: string;
  onTaskCreated: (task: Task) => void;
}

export function NewTaskModal({ projectId, columnId, onTaskCreated }: NewTaskModalProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const checklistProgress = checklist.length > 0 ? (checklist.filter(item => item.completed).length / checklist.length) * 100 : 0;

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setChecklist([]);
    setNewChecklistItem("");
  }

  const handleSave = async () => {
    if (!user) {
      toast({ title: "Debes iniciar sesión para crear una tarea", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "El título de la tarea no puede estar vacío", variant: "destructive" });
      return;
    }

    try {
      const newTaskData: Omit<Task, 'id' | 'projectId'> = { 
          title, 
          description, 
          columnId, 
          assignees: [], 
          dueDate: dueDate?.toISOString(),
          checklist,
          creatorId: user.uid,
        };
      const newTaskId = await createTask(projectId, newTaskData);
      onTaskCreated({ id: newTaskId, projectId: projectId, ...newTaskData });
      resetForm();
      setOpen(false);
      toast({ title: "Tarea creada con éxito" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al crear la tarea", variant: "destructive" });
    }
  };

  const addChecklistItem = () => {
    if (newChecklistItem.trim() !== "") {
      const newItem: ChecklistItem = {
        id: `item-${Date.now()}`,
        text: newChecklistItem.trim(),
        completed: false,
      };
      setChecklist([...checklist, newItem]);
      setNewChecklistItem("");
    }
  };

  const toggleChecklistItem = (itemId: string) => {
    setChecklist(
      checklist.map(item =>
        item.id === itemId ? { ...item, completed: !item.completed } : item
      )
    );
  };
  
  const removeChecklistItem = (itemId: string) => {
    setChecklist(checklist.filter(item => item.id !== itemId));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon">
            <Plus className="h-4 w-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Crear Nueva Tarea</DialogTitle>
          <DialogDescription>
            Introduce los detalles de tu nueva tarea. Haz clic en guardar cuando termines.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="title" className="text-right pt-2">
              Título
            </Label>
            <div className="col-span-3">
              <Input id="title" value={title} onChange={(e) => setTitle(e.target.value.slice(0, 80))} className="w-full" maxLength={80} />
              <p className="text-xs text-muted-foreground text-right mt-1">{title.length} / 80</p>
            </div>
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Descripción
            </Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="col-span-3 min-h-[120px]"
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="due-date" className="text-right">
              Vencimiento
            </Label>
             <Popover>
                <PopoverTrigger asChild>
                <Button
                    variant={"outline"}
                    className={cn(
                    "col-span-3 justify-start text-left font-normal",
                    !dueDate && "text-muted-foreground"
                    )}
                >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span>Elige una fecha</span>}
                </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                    <Calendar
                        mode="single"
                        selected={dueDate}
                        onSelect={setDueDate}
                        initialFocus
                    />
                </PopoverContent>
            </Popover>
          </div>
           <div className="grid grid-cols-4 gap-4">
            <Label className="text-right pt-2">Checklist</Label>
            <div className="col-span-3 space-y-3">
              {checklist.length > 0 && (
                  <Progress value={checklistProgress} className="w-full h-2" />
              )}
              <div className="space-y-2 max-h-40 overflow-y-auto pr-2">
                {checklist.map(item => (
                  <div key={item.id} className="flex items-center gap-2 group">
                    <Checkbox
                      id={`new-checklist-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <Label htmlFor={`new-checklist-${item.id}`} className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>
                      {item.text}
                    </Label>
                     <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => removeChecklistItem(item.id)}>
                        <XIcon className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Añadir un elemento..."
                  value={newChecklistItem}
                  onChange={e => setNewChecklistItem(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addChecklistItem()}
                />
                <Button onClick={addChecklistItem} size="sm">
                  <Plus className="h-4 w-4 mr-1" /> Añadir
                </Button>
              </div>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSave}>Guardar Tarea</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
