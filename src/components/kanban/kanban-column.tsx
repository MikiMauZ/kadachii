
"use client";

import type { Column, Task } from "@/lib/types";
import { KanbanCard } from "./kanban-card";
import { Badge } from "@/components/ui/badge";
import { NewTaskModal } from "./new-task-modal";
import React, { useState } from "react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Button } from "../ui/button";
import { Edit, MoreHorizontal, Trash } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "../ui/alert-dialog";
import { deleteColumn, updateColumn } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Input } from "../ui/input";

interface KanbanColumnProps {
  column: Column;
  tasks: Task[];
  projectId: string;
  onDrop: (e: React.DragEvent<HTMLDivElement>, columnId: Column["id"]) => void;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onTaskCreated: (task: Task) => void;
  onColumnUpdated: (column: Column) => void;
  onColumnDeleted: (columnId: string) => void;
}

export function KanbanColumn({
  column,
  tasks,
  projectId,
  onDrop,
  onDragStart,
  onUpdateTask,
  onDeleteTask,
  onTaskCreated,
  onColumnUpdated,
  onColumnDeleted
}: KanbanColumnProps) {
  const { toast } = useToast();
  const [isEditingName, setIsEditingName] = useState(false);
  const [columnName, setColumnName] = useState(column.title);

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };
  
  const handleRenameColumn = async () => {
    if (!columnName.trim() || columnName.trim() === column.title) {
        setIsEditingName(false);
        setColumnName(column.title);
        return;
    }
    try {
        await updateColumn(projectId, column.id, { title: columnName.trim() });
        onColumnUpdated({ ...column, title: columnName.trim() });
        toast({ title: "Columna renombrada"});
    } catch(error) {
        console.error("Error renaming column:", error);
        toast({ title: "Error al renombrar", variant: "destructive" });
        setColumnName(column.title); // revert on error
    }
    setIsEditingName(false);
  }

  const handleDeleteColumn = async () => {
    if (tasks.length > 0) {
        toast({ title: "No se puede eliminar", description: "Mueve o elimina todas las tareas de esta columna primero.", variant: "destructive" });
        return;
    }
    try {
        await deleteColumn(projectId, column.id);
        onColumnDeleted(column.id);
        toast({ title: "Columna eliminada" });
    } catch (error) {
        console.error("Error deleting column:", error);
        toast({ title: "Error al eliminar la columna", variant: "destructive" });
    }
  }


  return (
    <div
      onDrop={(e) => onDrop(e, column.id)}
      onDragOver={handleDragOver}
      className="flex flex-col w-80 shrink-0"
    >
      <div className="flex items-center justify-between p-2 rounded-t-lg bg-muted/50">
        <div className="flex items-center gap-2 flex-grow">
             {isEditingName ? (
                <Input
                    value={columnName}
                    onChange={(e) => setColumnName(e.target.value)}
                    onBlur={handleRenameColumn}
                    onKeyDown={(e) => e.key === 'Enter' && handleRenameColumn()}
                    autoFocus
                    className="h-8 font-semibold text-lg"
                />
            ) : (
                <h3 className="font-semibold text-lg px-2">{column.title}</h3>
            )}
            <Badge variant="secondary" className="bg-accent text-accent-foreground">{tasks.length}</Badge>
        </div>
        <div className="flex items-center">
            <NewTaskModal projectId={projectId} columnId={column.id} onTaskCreated={onTaskCreated}>
            </NewTaskModal>
             <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreHorizontal className="h-4 w-4" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setIsEditingName(true)}>
                        <Edit className="mr-2 h-4 w-4" />
                        Renombrar
                    </DropdownMenuItem>
                    <AlertDialog>
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={tasks.length > 0} className="text-destructive focus:text-destructive">
                                <Trash className="mr-2 h-4 w-4" />
                                Eliminar
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>¿Eliminar esta columna?</AlertDialogTitle>
                                <AlertDialogDescription>
                                    Esta acción no se puede deshacer. Esto eliminará permanentemente la columna "{column.title}".
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction onClick={handleDeleteColumn} className="bg-destructive hover:bg-destructive/90">
                                    Eliminar Columna
                                </AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
      </div>
      <div className="flex flex-col gap-4 p-2 bg-muted/50 rounded-b-lg h-full">
        {tasks.map((task) => (
          <KanbanCard 
            key={task.id} 
            task={task} 
            onDragStart={onDragStart}
            onUpdateTask={onUpdateTask}
            onDeleteTask={onDeleteTask}
            />
        ))}
      </div>
    </div>
  );
}
