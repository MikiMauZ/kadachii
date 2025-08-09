
"use client";

import type { Task, Column } from "@/lib/types";
import React, { useState, useMemo, useEffect } from "react";
import { KanbanColumn } from "./kanban-column";
import { useAuth } from "../auth-provider";
import { updateTask, createColumn as apiCreateColumn, batchUpdateColumnOrder } from "@/lib/data";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "../ui/skeleton";
import { Button } from "../ui/button";
import { Plus, X } from "lucide-react";
import { Input } from "../ui/input";
import { cn } from "@/lib/utils";

interface KanbanBoardProps {
  initialTasks: Task[];
  setInitialTasks: (tasks: Task[]) => void;
  initialColumns: Column[];
  setInitialColumns: (columns: Column[]) => void;
  projectId?: string;
  loading: boolean;
  layout: 'row' | 'grid';
}

export function KanbanBoard({
  initialTasks,
  setInitialTasks,
  initialColumns,
  setInitialColumns,
  projectId,
  loading,
  layout
}: KanbanBoardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [newColumnName, setNewColumnName] = useState("");

  const columns = useMemo(() => {
    if (!initialColumns.length) return [];
    
    const sortedColumns = [...initialColumns].sort((a, b) => a.order - b.order);

    return sortedColumns.map((col) => {
      const colTasks = initialTasks.filter((task) => task.columnId === col.id);
      return { ...col, tasks: colTasks };
    });
  }, [initialColumns, initialTasks]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    e.dataTransfer.setData("taskId", taskId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleColumnDragStart = (e: React.DragEvent<HTMLDivElement>, columnId: string) => {
    e.dataTransfer.setData("columnId", columnId);
    e.dataTransfer.effectAllowed = "move";
  }
  
  const handleColumnDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }

  const handleColumnDrop = async (e: React.DragEvent<HTMLDivElement>, targetColumnId: string) => {
    const draggedColumnId = e.dataTransfer.getData("columnId");
    if (!draggedColumnId || draggedColumnId === targetColumnId || !projectId) return;

    const currentColumns = [...columns];
    const draggedIndex = currentColumns.findIndex(c => c.id === draggedColumnId);
    const targetIndex = currentColumns.findIndex(c => c.id === targetColumnId);

    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Optimistic update
    const [draggedColumn] = currentColumns.splice(draggedIndex, 1);
    currentColumns.splice(targetIndex, 0, draggedColumn);

    const updatedColumnsWithOrder = currentColumns.map((col, index) => ({
      ...col,
      order: index
    }));
    
    setInitialColumns(updatedColumnsWithOrder);

    // Persist changes to backend
    try {
        const updates = updatedColumnsWithOrder.map(c => ({ id: c.id, order: c.order }));
        await batchUpdateColumnOrder(projectId, updates);
    } catch(error) {
        console.error("Failed to reorder columns", error);
        toast({ title: "Error al reordenar las columnas", variant: "destructive" });
        // Revert on error
        setInitialColumns(columns);
    }
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
  
  const handleUpdateTask = (updatedTask: Task) => {
    setInitialTasks(initialTasks.map(task => task.id === updatedTask.id ? updatedTask : task));
  }

  const handleDeleteTask = (taskId: string) => {
    setInitialTasks(initialTasks.filter(task => task.id !== taskId));
  }
  
  const handleTaskCreated = (newTask: Task) => {
    setInitialTasks([...initialTasks, newTask]);
  }

  const handleCreateColumn = async () => {
    if (!newColumnName.trim() || !projectId) {
        toast({ title: "El nombre de la columna no puede estar vacío", variant: 'destructive'});
        return;
    }
    try {
        const newOrder = columns.length > 0 ? Math.max(...columns.map(c => c.order)) + 1 : 0;
        await apiCreateColumn(projectId, { title: newColumnName.trim(), order: newOrder });
        setNewColumnName("");
        setIsAddingColumn(false);
        toast({title: "Columna creada con éxito"});
    } catch (error) {
        console.error("Error creating column:", error);
        toast({ title: "Error al crear la columna", variant: 'destructive'});
    }
  }
  
  const handleColumnUpdated = (updatedColumn: Column) => {
    setInitialColumns(initialColumns.map(c => c.id === updatedColumn.id ? updatedColumn : c));
  }

  const handleColumnDeleted = (columnId: string) => {
    setInitialColumns(initialColumns.filter(c => c.id !== columnId));
  }
  
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
    <div className={cn(
      "p-4 md:p-6 w-full",
      layout === 'row' && "flex flex-row items-start gap-6",
      layout === 'grid' && "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 items-start gap-6",
    )}>
      {columns.map((column) => (
        <div 
          key={column.id}
          draggable
          onDragStart={(e) => handleColumnDragStart(e, column.id)}
          onDrop={(e) => handleColumnDrop(e, column.id)}
          onDragOver={handleColumnDragOver}
          className="shrink-0"
        >
          <KanbanColumn
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
        </div>
      ))}
       <div className="shrink-0 w-80 pt-1">
        {isAddingColumn ? (
            <div className="p-2 rounded-lg bg-muted space-y-2">
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
