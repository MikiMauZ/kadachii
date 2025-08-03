
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Send, X } from 'lucide-react';
import { useAuth } from './auth-provider';
import { ChatMessage } from '@/lib/types';
import { getChatMessages, sendChatMessage, getUser } from '@/lib/data';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Skeleton } from './ui/skeleton';

interface ChatPanelProps {
  projectId: string;
  onClose: () => void;
}

export function ChatPanel({ projectId, onClose }: ChatPanelProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!projectId) return;

    setLoading(true);
    const unsubscribe = getChatMessages(projectId, (newMessages) => {
      setMessages(newMessages);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [projectId]);

  useEffect(() => {
    // Auto-scroll to bottom
    if (scrollAreaRef.current) {
        const viewport = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
        if (viewport) {
            viewport.scrollTop = viewport.scrollHeight;
        }
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !user) return;
    
    const currentUserData = await getUser(user.uid);

    const messageData: Omit<ChatMessage, 'id' | 'timestamp'> = {
      senderId: user.uid,
      senderName: currentUserData?.displayName ?? user.email ?? "Usuario Anónimo",
      senderAvatarUrl: currentUserData?.photoURL ?? `https://placehold.co/100x100.png`,
      text: newMessage.trim(),
    };

    try {
      await sendChatMessage(projectId, messageData);
      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 w-full max-w-sm rounded-lg border bg-card text-card-foreground shadow-lg flex flex-col h-[60vh]">
      <div className="flex items-center justify-between p-4 border-b">
        <h3 className="font-semibold">Chat del Proyecto</h3>
        <Button variant="ghost" size="icon" onClick={onClose}>
          <X className="h-4 w-4" />
        </Button>
      </div>
      <ScrollArea className="flex-1 p-4" ref={scrollAreaRef}>
        <div className="space-y-4">
          {loading ? (
            <>
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
                <Skeleton className="h-16 w-full" />
            </>
          ) : messages.length === 0 ? (
             <div className="text-center text-muted-foreground py-10">
                <p>No hay mensajes todavía.</p>
                <p>¡Sé el primero en saludar!</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex items-start gap-3 ${
                  msg.senderId === user?.uid ? 'justify-end' : ''
                }`}
              >
                {msg.senderId !== user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.senderAvatarUrl} data-ai-hint="person portrait" />
                    <AvatarFallback>
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
                <div
                  className={`max-w-[75%] rounded-lg p-3 ${
                    msg.senderId === user?.uid
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  }`}
                >
                  <p className="text-sm font-semibold mb-1">{msg.senderId === user?.uid ? "Tú" : msg.senderName}</p>
                  <p className="text-sm">{msg.text}</p>
                  <p className="text-xs opacity-70 mt-1 text-right">
                    {msg.timestamp ? format(msg.timestamp.toDate(), 'p', { locale: es }) : ''}
                  </p>
                </div>
                 {msg.senderId === user?.uid && (
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={msg.senderAvatarUrl} data-ai-hint="person portrait" />
                    <AvatarFallback>
                      {msg.senderName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ))
          )}
        </div>
      </ScrollArea>
      <div className="p-4 border-t">
        <form onSubmit={handleSendMessage} className="flex gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Escribe un mensaje..."
            autoComplete="off"
            disabled={!user}
          />
          <Button type="submit" size="icon" disabled={!newMessage.trim() || !user}>
            <Send className="h-4 w-4" />
          </Button>
        </form>
      </div>
    </div>
  );
}
