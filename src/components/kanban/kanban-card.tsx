
"use client";
import type { Task, ChecklistItem } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskModal } from "./task-modal";
import { CalendarIcon, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useState, useEffect, useCallback } from "react";
import { Checkbox } from "../ui/checkbox";
import { updateTask } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

// Debounce function
function debounce<F extends (...args: any[]) => any>(func: F, waitFor: number) {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<F>): Promise<ReturnType<F>> =>
        new Promise(resolve => {
            if (timeout) {
                clearTimeout(timeout);
            }
            timeout = setTimeout(() => resolve(func(...args)), waitFor);
        });
}


interface KanbanCardProps {
  task: Task;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void;
  onUpdateTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
}

export function KanbanCard({ task, onDragStart, onUpdateTask, onDeleteTask }: KanbanCardProps) {
    const { toast } = useToast();
    const [currentTask, setCurrentTask] = useState<Task>(task);
    
    useEffect(() => {
      setCurrentTask(task);
    }, [task]);

    const completedChecklistItems = currentTask.checklist?.filter(item => item.completed).length ?? 0;
    const totalChecklistItems = currentTask.checklist?.length ?? 0;

    const debouncedUpdateTask = useCallback(debounce(async (updatedTask: Task) => {
        try {
            await updateTask(updatedTask.projectId, updatedTask.id, { checklist: updatedTask.checklist });
            toast({ title: "Checklist actualizada" });
        } catch (error) {
            console.error("Failed to update checklist", error);
            toast({ title: "Error al actualizar", variant: "destructive" });
            // Revert optimistic update on error
            onUpdateTask(task);
        }
    }, 1000), [task.id, task.projectId, onUpdateTask, toast]);


    const handleChecklistChange = (itemId: string, completed: boolean) => {
        const updatedChecklist = currentTask.checklist?.map(item =>
            item.id === itemId ? { ...item, completed } : item
        );
        const updatedTask: Task = { ...currentTask, checklist: updatedChecklist };

        // Optimistic UI update
        setCurrentTask(updatedTask); 
        onUpdateTask(updatedTask);

        // Debounce the database update
        debouncedUpdateTask(updatedTask);
    };


  return (
    <div>
        <Card
            draggable
            onDragStart={(e) => onDragStart(e, task.id)}
            className="cursor-grab active:cursor-grabbing bg-card hover:shadow-md transition-shadow duration-200"
        >
          <TaskModal task={task} onUpdateTask={onUpdateTask} onDeleteTask={onDeleteTask}>
            <CardHeader className="p-4 pb-2">
              <CardTitle className="text-base font-semibold truncate">{task.title}</CardTitle>
            </CardHeader>
          </TaskModal>
            <CardContent className="p-4 pt-2">
            
            {currentTask.description && <p className="text-sm text-muted-foreground truncate mb-4">{currentTask.description}</p>}
            
            {totalChecklistItems > 0 && (
                <div className="space-y-2 mb-4">
                    {currentTask.checklist?.map(item => (
                        <div key={item.id} className="flex items-center gap-2 group">
                             <Checkbox
                                id={`card-checklist-${item.id}`}
                                checked={item.completed}
                                onCheckedChange={(checked) => handleChecklistChange(item.id, !!checked)}
                                className="h-5 w-5"
                            />
                            <label htmlFor={`card-checklist-${item.id}`} className={cn("flex-grow text-sm", item.completed && "line-through text-muted-foreground")}>
                                {item.text}
                            </label>
                        </div>
                    ))}
                </div>
            )}


            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                {task.dueDate && (
                    <div className="flex items-center gap-1">
                        <CalendarIcon className="h-4 w-4" />
                        <span>{format(new Date(task.dueDate), "d MMM", { locale: es })}</span>
                    </div>
                )}
                {totalChecklistItems > 0 && (
                    <div className="flex items-center gap-1">
                        <CheckSquare className="h-4 w-4" />
                        <span>{completedChecklistItems}/{totalChecklistItems}</span>
                    </div>
                )}
            </div>
            <div className="flex items-center justify-between mt-4">
                <div className="flex -space-x-2">
                <TooltipProvider>
                    {(task.assignees || []).map((assignee) => (
                    <Tooltip key={assignee.name}>
                        <TooltipTrigger asChild>
                        <Avatar className="h-8 w-8 border-2 border-card">
                            <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                            <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        </TooltipTrigger>
                        <TooltipContent>
                        <p>{assignee.name}</p>
                        </TooltipContent>
                    </Tooltip>
                    ))}
                </TooltipProvider>
                </div>
            </div>
            </CardContent>
        </Card>
    </div>
  );
}
