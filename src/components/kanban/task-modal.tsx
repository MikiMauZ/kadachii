
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
import { Textarea } from "@/components/ui/textarea";
import React, { useState, useEffect } from "react";
import { useAuth } from "../auth-provider";
import { useToast } from "@/hooks/use-toast";
import { Task, ChecklistItem, Assignee, ProjectMember } from "@/lib/types";
import { deleteTask, updateTask, getProjectMembers } from "@/lib/data";
import { Calendar as CalendarIcon, Plus, Trash, UserPlus, X as XIcon } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Calendar } from "../ui/calendar";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { Checkbox } from "../ui/checkbox";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

interface TaskModalProps {
  task: Task;
  children: React.ReactNode;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

const isAvatarAnEmoji = (url: string | null | undefined) => {
    if (!url) return false;
    return url.length > 0 && !url.startsWith('http');
}

export function TaskModal({ task, children, onUpdateTask, onDeleteTask }: TaskModalProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [dueDate, setDueDate] = useState<Date | undefined>(task.dueDate ? new Date(task.dueDate) : undefined);
  const [checklist, setChecklist] = useState<ChecklistItem[]>(task.checklist ?? []);
  const [assignees, setAssignees] = useState<Assignee[]>(task.assignees ?? []);
  
  const [teamMembers, setTeamMembers] = useState<ProjectMember[]>([]);

  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [open, setOpen] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  const checklistProgress = checklist.length > 0 ? (checklist.filter(item => item.completed).length / checklist.length) * 100 : 0;
  
    useEffect(() => {
        setTitle(task.title);
        setDescription(task.description);
        setDueDate(task.dueDate ? new Date(task.dueDate) : undefined);
        setChecklist(task.checklist ?? []);
        setAssignees(task.assignees ?? []);
    }, [task]);


  useEffect(() => {
    if (open && task.projectId) {
      getProjectMembers(task.projectId).then(setTeamMembers);
    }
  }, [open, task.projectId, task.id]);


  const handleSave = async () => {
    if (!user || !task.projectId) {
      toast({ title: "Error", description: "No se pudo guardar la tarea.", variant: "destructive" });
      return;
    }
    if (!title.trim()) {
      toast({ title: "El título no puede estar vacío", variant: "destructive" });
      return;
    }

    try {
       const updatePayload: Partial<Omit<Task, 'id' | 'projectId' | 'creatorId'>> = { 
          title, 
          description, 
          dueDate: dueDate?.toISOString(),
          checklist,
          assignees,
        };
      
      await updateTask(task.projectId, task.id, updatePayload);
      
      const updatedData: Task = { ...task, ...updatePayload };

      onUpdateTask(updatedData);
      setOpen(false);
      toast({ title: "Tarea actualizada" });
    } catch (error) {
      console.error(error);
      toast({ title: "Error al actualizar la tarea", variant: "destructive" });
    }
  };

  const handleDelete = async () => {
    if (!user || !task.projectId) {
      toast({ title: "Error", description: "No se pudo eliminar la tarea.", variant: "destructive" });
      return;
    }
    try {
      await deleteTask(task.projectId, task.id);
      onDeleteTask(task.id);
      setOpen(false);
      toast({ title: "Tarea eliminada" });
    } catch (error) {
       console.error(error);
       toast({ title: "Error al eliminar la tarea", variant: "destructive" });
    }
  }
  
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
  
  const toggleAssignee = (member: ProjectMember) => {
    setAssignees(prev => {
        const isAssigned = prev.some(a => a.id === member.id);
        if (isAssigned) {
            return prev.filter(a => a.id !== member.id);
        } else {
            const newAssignee: Assignee = {
                id: member.id,
                name: member.name ?? member.email,
                avatarUrl: member.avatarUrl ?? '',
                email: member.email
            };
            return [...prev, newAssignee];
        }
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Editar Tarea</DialogTitle>
          <DialogDescription>
            Realiza cambios en tu tarea aquí. Haz clic en guardar cuando hayas terminado.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
          <div className="grid grid-cols-4 items-start gap-4">
            <Label htmlFor="title" className="text-right pt-2">
              Título
            </Label>
            <div className="col-span-3">
              <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value.slice(0, 80))}
                  className="w-full"
                  maxLength={80}
              />
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
            <Label className="text-right">Vencimiento</Label>
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
             <Label className="text-right pt-2">Asignados</Label>
              <div className="col-span-3">
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" className="w-full justify-start">
                            <UserPlus className="mr-2 h-4 w-4" />
                            Gestionar asignados ({assignees.length})
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80">
                         <div className="grid gap-4">
                            <p className="text-sm font-medium">Miembros del equipo</p>
                            <div className="space-y-2">
                                {teamMembers.map(member => (
                                    <div key={member.id} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                {isAvatarAnEmoji(member.avatarUrl) ? (
                                                    <AvatarFallback className="text-xl bg-transparent">{member.avatarUrl}</AvatarFallback>
                                                ) : (
                                                    <>
                                                        <AvatarImage src={member.avatarUrl} data-ai-hint="person portrait" />
                                                        <AvatarFallback>{(member.name ?? member.email).charAt(0)}</AvatarFallback>
                                                    </>
                                                )}
                                            </Avatar>
                                            <Label htmlFor={`assign-${member.id}`}>{member.name ?? member.email}</Label>
                                        </div>
                                        <Checkbox
                                            id={`assign-${member.id}`}
                                            checked={assignees.some(a => a.id === member.id)}
                                            onCheckedChange={() => toggleAssignee(member)}
                                        />
                                    </div>
                                ))}
                                {teamMembers.length === 0 && (
                                    <p className="text-sm text-muted-foreground text-center py-2">No hay miembros en este proyecto.</p>
                                )}
                            </div>
                        </div>
                    </PopoverContent>
                </Popover>
              </div>
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
                      id={`checklist-${item.id}`}
                      checked={item.completed}
                      onCheckedChange={() => toggleChecklistItem(item.id)}
                    />
                    <Label htmlFor={`checklist-${item.id}`} className={cn("flex-grow", item.completed && "line-through text-muted-foreground")}>
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
        <DialogFooter className="justify-between sm:justify-between pt-4 border-t">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="icon">
                    <Trash className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>¿Estás seguro?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Esta acción no se puede deshacer. Esto eliminará permanentemente la tarea.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancelar</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90">Eliminar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          <Button onClick={handleSave}>Guardar Cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
