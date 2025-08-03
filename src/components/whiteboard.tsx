
'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Button } from './ui/button';
import { X, Trash2, Palette } from 'lucide-react';
import { drawOnWhiteboard, getWhiteboardUpdates, clearWhiteboard } from '@/lib/data';
import { WhiteboardPath, WhiteboardPoint } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';

interface WhiteboardProps {
  projectId: string;
  onClose: () => void;
}

const COLORS = ['#000000', '#EF4444', '#3B82F6', '#22C55E', '#F97316', '#8B5CF6'];

export function Whiteboard({ projectId, onClose }: WhiteboardProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [color, setColor] = useState('#000000');
  const currentPath = useRef<WhiteboardPoint[]>([]);
  const { toast } = useToast();

  const getCanvasContext = useCallback(() => {
    const canvas = canvasRef.current;
    return canvas?.getContext('2d');
  }, []);

  const redrawCanvas = useCallback((paths: WhiteboardPath[]) => {
    const ctx = getCanvasContext();
    const canvas = canvasRef.current;
    if (!ctx || !canvas) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    paths.forEach(p => {
      ctx.strokeStyle = p.color;
      ctx.lineWidth = 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      if (p.path.length > 0) {
        ctx.moveTo(p.path[0].x, p.path[0].y);
        p.path.forEach(point => {
          ctx.lineTo(point.x, point.y);
        });
        ctx.stroke();
      }
    });
  }, [getCanvasContext]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    const resizeCanvas = () => {
        const parent = canvas.parentElement;
        if(parent) {
            canvas.width = parent.clientWidth;
            canvas.height = parent.clientHeight;
        }
    };
    
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    const unsubscribe = getWhiteboardUpdates(projectId, (paths) => {
        redrawCanvas(paths);
    });

    return () => {
        window.removeEventListener('resize', resizeCanvas);
        unsubscribe();
    }
  }, [projectId, redrawCanvas]);

  const getCoords = (e: React.MouseEvent | React.TouchEvent): WhiteboardPoint | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if ('touches' in e.nativeEvent) {
      return { x: e.nativeEvent.touches[0].clientX - rect.left, y: e.nativeEvent.touches[0].clientY - rect.top };
    }
    return { x: e.nativeEvent.offsetX, y: e.nativeEvent.offsetY };
  };

  const handleStartDrawing = (e: React.MouseEvent | React.TouchEvent) => {
    const coords = getCoords(e);
    if (!coords) return;

    setIsDrawing(true);
    currentPath.current = [coords];
    
    const ctx = getCanvasContext();
    if(!ctx) return;
    ctx.beginPath();
    ctx.moveTo(coords.x, coords.y);
  };

  const handleDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const coords = getCoords(e);
    if (!coords) return;

    currentPath.current.push(coords);

    const ctx = getCanvasContext();
    if(!ctx) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineTo(coords.x, coords.y);
    ctx.stroke();
  };

  const handleEndDrawing = async () => {
    setIsDrawing(false);
    if (currentPath.current.length > 1) {
      try {
        await drawOnWhiteboard(projectId, { path: currentPath.current, color });
      } catch (error) {
        console.error("Error saving path:", error);
        toast({ title: 'Error al guardar el dibujo', variant: 'destructive'});
      }
    }
    currentPath.current = [];
  };

  const handleClear = async () => {
    try {
        await clearWhiteboard(projectId);
    } catch (error) {
        console.error("Error clearing whiteboard:", error);
        toast({ title: 'Error al limpiar la pizarra', variant: 'destructive'});
    }
  }

  return (
    <div className="fixed inset-0 bg-background/95 backdrop-blur-sm z-40 flex flex-col">
       <div className="absolute top-4 right-4 z-50 flex items-center gap-2">
         <Popover>
            <PopoverTrigger asChild>
                <Button variant="secondary" size="icon"><Palette/></Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto">
                <div className="flex gap-2">
                    {COLORS.map(c => (
                        <button key={c} onClick={() => setColor(c)} className={cn("h-8 w-8 rounded-full border-2", color === c ? 'border-ring' : 'border-transparent')} style={{ backgroundColor: c}} />
                    ))}
                </div>
            </PopoverContent>
         </Popover>
         <Button variant="destructive" size="icon" onClick={handleClear}><Trash2 /></Button>
         <Button variant="secondary" size="icon" onClick={onClose}><X /></Button>
       </div>
      <div className="flex-grow relative p-4">
        <canvas
          ref={canvasRef}
          onMouseDown={handleStartDrawing}
          onMouseMove={handleDraw}
          onMouseUp={handleEndDrawing}
          onMouseLeave={handleEndDrawing}
          onTouchStart={handleStartDrawing}
          onTouchMove={handleDraw}
          onTouchEnd={handleEndDrawing}
          className="w-full h-full bg-white rounded-md shadow-lg"
        />
      </div>
    </div>
  );
}
