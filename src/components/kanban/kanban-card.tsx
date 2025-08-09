
"use client";
import type { Task, ChecklistItem, TaskCreator } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { TaskModal } from "./task-modal";
import { CalendarIcon, CheckSquare } from "lucide-react";
import { format } from "date-fns";
import { es } from 'date-fns/locale';
import React, { useState, useEffect, useCallback } from "react";
import { Checkbox } from "../ui/checkbox";
import { updateTask, getUser } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";

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

const isAvatarAnEmoji = (url: string | null | undefined) => {
    if (!url) return false;
    return url.length > 0 && !url.startsWith('http');
}

const TaskCreatorAvatar = ({ creatorId }: { creatorId: string }) => {
    const [creator, setCreator] = useState<TaskCreator | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let isMounted = true;
        const fetchCreator = async () => {
            setLoading(true);
            try {
                const userData = await getUser(creatorId);
                if (isMounted && userData) {
                    setCreator({
                        id: userData.id,
                        name: userData.displayName ?? userData.email,
                        avatarUrl: userData.photoURL ?? ''
                    });
                }
            } catch (error) {
                console.error("Failed to fetch creator", error);
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        fetchCreator();
        return () => { isMounted = false };
    }, [creatorId]);

    if (loading) {
        return (
             <div className="flex flex-col items-center">
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-2 w-6 mt-1" />
            </div>
        )
    }

    if (!creator) return null;

    return (
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="flex flex-col items-center">
                    <Avatar className="h-8 w-8 border-2 border-primary ring-2 ring-primary">
                        {isAvatarAnEmoji(creator.avatarUrl) ? (
                            <AvatarFallback className="text-xl bg-transparent">{creator.avatarUrl}</AvatarFallback>
                        ) : (
                            <>
                                <AvatarImage src={creator.avatarUrl} data-ai-hint="person portrait" />
                                <AvatarFallback>{creator.name.charAt(0)}</AvatarFallback>
                            </>
                        )}
                    </Avatar>
                    <span className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                        {(creator.name ?? "???").substring(0, 3)}
                    </span>
                </div>
            </TooltipTrigger>
            <TooltipContent>
                <p>Creado por: {creator.name}</p>
            </TooltipContent>
        </Tooltip>
    )
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
            onUpdateTask(task);
        }
    }, 1000), [task.id, task.projectId, onUpdateTask, toast]);


    const handleChecklistChange = (itemId: string, completed: boolean) => {
        const updatedChecklist = currentTask.checklist?.map(item =>
            item.id === itemId ? { ...item, completed } : item
        );
        const updatedTask: Task = { ...currentTask, checklist: updatedChecklist };

        setCurrentTask(updatedTask); 
        onUpdateTask(updatedTask);

        debouncedUpdateTask(updatedTask);
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
      e.stopPropagation();
      onDragStart(e, taskId);
    };


  return (
    <div>
        <Card
            draggable
            onDragStart={(e) => handleDragStart(e, task.id)}
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
                <div className="flex items-start gap-4">
                <TooltipProvider>
                    {task.creatorId && <TaskCreatorAvatar creatorId={task.creatorId} />}
                    {(task.assignees || []).map((assignee) => (
                    <Tooltip key={assignee.id}>
                        <TooltipTrigger asChild>
                        <div className="flex flex-col items-center">
                            <Avatar className="h-8 w-8 border-2 border-card">
                            {isAvatarAnEmoji(assignee.avatarUrl) ? (
                                    <AvatarFallback className="text-xl bg-transparent">{assignee.avatarUrl}</AvatarFallback>
                                ) : (
                                    <>
                                        <AvatarImage src={assignee.avatarUrl} data-ai-hint="person portrait" />
                                        <AvatarFallback>{assignee.name.charAt(0)}</AvatarFallback>
                                    </>
                                )}
                            </Avatar>
                             <span className="mt-1 text-[10px] font-semibold uppercase text-muted-foreground">
                                {(assignee.name ?? "???").substring(0, 3)}
                            </span>
                        </div>
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
