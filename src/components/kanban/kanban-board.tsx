
"use client";

import type { Task, Column } from "@/lib/types";
import React, { useState, useMemo, useEffect } from "react";
import { KanbanColumn } from "./kanban-column";
import { useAuth } from "../auth-provider";
import { updateTask, createColumn as apiCreateColumn } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "../ui/input";

interface KanbanBoardProps {
  initialTasks: Task[];
  setInitialTasks: (tasks: Task[]) => void;
  initialColumns: Column[];
  setInitialColumns: (columns: Column[]) => void;
  projectId?: string;
  loading: boolean;
}

export function KanbanBoard({
  initialTasks,
  setInitialTasks,
  initialColumns,
  setInitialColumns,
  projectId,
  loading
}: KanbanBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");


  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>, columnId: Column["id"]) => {
    const taskId = e.dataTransfer.getData("taskId");
    if (!taskId || !user || !projectId) return;
    
    const taskToMove = initialTasks.find(t => t.id === taskId);
    if (!taskToMove || taskToMove.columnId === columnId) return;


    // Optimistic update for smoother UI
    const originalTasks = [...initialTasks];
    const updatedTasks = initialTasks.map((task) =>
      task.id === taskId ? { ...task, columnId: columnId } : task
    );
    setInitialTasks(updatedTasks);

    try {
      await updateTask(projectId, taskId, { columnId });
    } catch (error) {
      setInitialTasks(originalTasks); // Revert on error
      toast({
        title: "Error al mover la tarea",
        description: "No se pudo actualizar la tarea. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };
  
  // These handlers can be simplified or removed as real-time listeners now handle state updates.
  // They can be kept for components that might not be listening in real-time or for optimistic UI.
  const handleUpdateTask = (updatedTask: Task) => {
     // The listener will handle this, but an optimistic update can feel faster.
    setInitialTasks(initialTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  }

  const handleDeleteTask = (taskId: string) => {
    // The listener will handle this, but an optimistic update can feel faster.
    setInitialTasks(initialTasks.filter(task => task.id !== taskId));
  }
  
  const handleTaskCreated = (newTask: Task) => {
     // The listener will handle this, but an optimistic update can feel faster.
    setInitialTasks([...initialTasks, newTask]);
  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !projectId) {
        toast({ title: "El nombre de la columna no puede estar vacío", variant: 'destructive'});
        return;
    }
    try {
        // The listener will add the new column to the state.
        await apiCreateColumn(projectId, { title: newColumnName.trim() });
        setNewColumnName("");
        setIsAddingColumn(false);
        toast({title: "Columna creada con éxito"});
    } catch (error) {
        console.error("Error creating column:", error);
        toast({ title: "Error al crear la columna", variant: 'destructive'});
    }
  }
  
  const handleColumnUpdated = (updatedColumn: Column) => {
     // The listener will handle this.
    setInitialColumns(initialColumns.map(c => c.id === updatedColumn.id ? updatedColumn : c));
  }

  const handleColumnDeleted = (columnId: string) => {
    // The listener will handle this.
    setInitialColumns(initialColumns.filter(c => c.id !== columnId));
  }


  const columns = useMemo(() => {
    if (!initialColumns.length) return [];
    
    // Simple sort by title, can be replaced by a dedicated 'order' field later
    const sortedColumns = [...initialColumns].sort((a, b) => {
         const order = ['Por Hacer', 'En Progreso', 'Hecho'];
         const indexA = order.indexOf(a.title);
         const indexB = order.indexOf(b.title);

         if (indexA !== -1 && indexB !== -1) return indexA - indexB;
         if (indexA !== -1) return -1;
         if (indexB !== -1) return 1;
         return a.title.localeCompare(b.title);
    });

    return sortedColumns.map((col) => {
      const colTasks = initialTasks.filter((task) => task.columnId === col.id);
      return { ...col, tasks: colTasks };
    });
  }, [initialColumns, initialTasks]);
  
  if (loading) {
    return (
        <div className="flex gap-6 p-4 md:p-6 w-full">
            {[1,2,3].map(i => (
                 <div key={i} className="flex flex-col w-80 shrink-0 space-y-4">
                    <Skeleton className="h-8 w-3/4" />
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                 </div>
            ))}
        </div>
    )
  }

  if (!projectId && !loading) {
    return (
        <div className="flex flex-col items-center justify-center h-full w-full gap-4 p-8 text-center">
            <h2 className="text-2xl font-bold">Bienvenido a Kadichii</h2>
            <p className="text-muted-foreground max-w-md">Para empezar a organizar tus tareas, selecciona un proyecto del menú desplegable o crea uno nuevo para comenzar.</p>
        </div>
    )
  }


  return (
    <div className="relative flex gap-6 p-4 md:p-6 w-full items-start">
      {columns.map((column) => (
        <KanbanColumn
          key={column.id}
          column={column}
          tasks={column.tasks}
          projectId={projectId!}
          onDrop={handleDrop}
          onDragStart={handleDragStart}
          onUpdateTask={handleUpdateTask}
          onDeleteTask={handleDeleteTask}
          onTaskCreated={handleTaskCreated}
          onColumnUpdated={handleColumnUpdated}
          onColumnDeleted={handleColumnDeleted}
        />
      ))}
       <div className="shrink-0 w-80">
        {isAddingColumn ? (
            <div className="p-2 rounded-lg bg-muted/50 space-y-2">
                <Input 
                    placeholder="Nombre de la nueva columna..." 
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateColumn()}
                    autoFocus
                />
                <div className="flex items-center gap-2">
                    <Button onClick={handleCreateColumn}>Añadir Columna</Button>
                    <Button variant="ghost" size="icon" onClick={() => setIsAddingColumn(false)}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            </div>
        ) : (
             <Button variant="outline" onClick={() => setIsAddingColumn(true)} className="w-full">
                <Plus className="mr-2 h-4 w-4"/>
                Añadir otra columna
            </Button>
        )}
      </div>
    </div>
  );
}
