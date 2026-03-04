'use client';

import React, { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MessageCircle, X, Send, Minimize2, Loader2, Bot, User, AlertCircle, History, Plus, Trash2, ChevronLeft, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { QuickSuggestions } from '@/components/chat/QuickSuggestions';
import { getSuggestionsForRoute } from '@/lib/chat/suggestions';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { clientLogger as logger } from '@/lib/logger/client-logger';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatSession {
  id: string;
  title: string;
  lastMessage: string;
  timestamp: number;
}

interface FloatingChatAssistantProps {
  position?: 'bottom-right' | 'bottom-left';
  initialOpen?: boolean;
}

export function FloatingChatAssistant({
  position = 'bottom-right',
  initialOpen = false,
}: FloatingChatAssistantProps) {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(initialOpen);
  const [isTyping, setIsTyping] = useState(false);
  const [inputValue, setInputValue] = useState('');
  
  // State for multiple sessions
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [view, setView] = useState<'chat' | 'history'>('chat'); // 'chat' or 'history'

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [hasUnread, setHasUnread] = useState(false);

  // Initial Load & Migration
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Load sessions list
      const savedSessions = localStorage.getItem('hago-chat-sessions');
      let loadedSessions: ChatSession[] = [];
      
      if (savedSessions) {
        try {
          loadedSessions = JSON.parse(savedSessions);
          setSessions(loadedSessions);
        } catch (e) {
          logger.error('Failed to parse sessions', e);
        }
      }

      // Check for legacy single-session history and migrate
      const legacyHistory = localStorage.getItem('hago-chat-history');
      const legacySessionId = localStorage.getItem('hago-chat-session-id');

      if (legacyHistory && !savedSessions) {
        try {
          const parsed = JSON.parse(legacyHistory);
          if (parsed.length > 0) {
            const newSessionId = legacySessionId || Date.now().toString();
            const firstUserMsg = parsed.find((m: any) => m.role === 'user');
            const title = firstUserMsg ? firstUserMsg.content.slice(0, 30) + '...' : 'Conversación anterior';
            
            const newSession: ChatSession = {
              id: newSessionId,
              title,
              lastMessage: parsed[parsed.length - 1].content.slice(0, 50),
              timestamp: Date.now(),
            };
            
            loadedSessions = [newSession];
            setSessions(loadedSessions);
            localStorage.setItem('hago-chat-sessions', JSON.stringify(loadedSessions));
            localStorage.setItem(`hago-chat-session-${newSessionId}`, legacyHistory);
            
            // Cleanup legacy
            localStorage.removeItem('hago-chat-history');
            localStorage.removeItem('hago-chat-session-id');
          }
        } catch (e) {
          logger.error('Migration failed', e);
        }
      }

      // Select most recent session or create new
      if (loadedSessions.length > 0) {
        setCurrentSessionId(loadedSessions[0].id);
      } else {
        createNewSession();
      }
    }
  }, []);

  // Load messages when currentSessionId changes
  useEffect(() => {
    if (!currentSessionId || typeof window === 'undefined') return;

    const savedMessages = localStorage.getItem(`hago-chat-session-${currentSessionId}`);
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        const hydrated = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp),
        }));
        setMessages(hydrated);
      } catch (e) {
        logger.error('Failed to parse messages', e);
        setMessages([]);
      }
    } else {
        // New session
        setMessages([
          {
            id: 'welcome',
            role: 'assistant',
            content: '¡Hola! Soy tu asistente virtual de Hago Produce. ¿En qué puedo ayudarte hoy?',
            timestamp: new Date(),
          },
        ]);
    }
  }, [currentSessionId]);

  // Persist messages and update session metadata
  useEffect(() => {
    if (!currentSessionId || typeof window === 'undefined') return;

    if (messages.length > 0) {
      localStorage.setItem(`hago-chat-session-${currentSessionId}`, JSON.stringify(messages));
      
      // Update session metadata (lastMessage, timestamp)
      setSessions(prev => {
        const index = prev.findIndex(s => s.id === currentSessionId);
        if (index === -1) {
            // Should be created via createNewSession, but safety check
            return prev; 
        }
        
        const updated = [...prev];
        const lastMsg = messages[messages.length - 1];
        
        // Generate title if it's "Nueva conversación" and we have a user message
        let title = updated[index].title;
        if (title === 'Nueva conversación') {
            const firstUserMsg = messages.find(m => m.role === 'user');
            if (firstUserMsg) {
                title = firstUserMsg.content.slice(0, 30) + (firstUserMsg.content.length > 30 ? '...' : '');
            }
        }

        updated[index] = {
            ...updated[index],
            lastMessage: lastMsg.content.slice(0, 50) + (lastMsg.content.length > 50 ? '...' : ''),
            timestamp: Date.now(),
            title,
        };
        // Move to top
        updated.sort((a, b) => b.timestamp - a.timestamp);
        
        localStorage.setItem('hago-chat-sessions', JSON.stringify(updated));
        return updated;
      });
    }
  }, [messages, currentSessionId]);

  const createNewSession = () => {
    const newId = Date.now().toString();
    const newSession: ChatSession = {
      id: newId,
      title: 'Nueva conversación',
      lastMessage: '',
      timestamp: Date.now(),
    };
    
    setSessions(prev => [newSession, ...prev]);
    localStorage.setItem('hago-chat-sessions', JSON.stringify([newSession, ...sessions]));
    setCurrentSessionId(newId);
    setMessages([
        {
          id: 'welcome',
          role: 'assistant',
          content: '¡Hola! Soy tu asistente virtual de Hago Produce. ¿En qué puedo ayudarte hoy?',
          timestamp: new Date(),
        },
    ]);
    setView('chat');
  };

  const deleteSession = (e: React.MouseEvent, sessionId: string) => {
    e.stopPropagation();
    const newSessions = sessions.filter(s => s.id !== sessionId);
    setSessions(newSessions);
    localStorage.setItem('hago-chat-sessions', JSON.stringify(newSessions));
    localStorage.removeItem(`hago-chat-session-${sessionId}`);

    if (currentSessionId === sessionId) {
        if (newSessions.length > 0) {
            setCurrentSessionId(newSessions[0].id);
        } else {
            createNewSession();
        }
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen, isTyping, view]);

  // Keyboard shortcut logic ...
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      setHasUnread(false);
    }
  }, [isOpen]);

  const handleSendText = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessageContent = text.trim();
    const newMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessageContent,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, newMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      const token = localStorage.getItem('accessToken') || localStorage.getItem('customerAccessToken');
      
      if (!token) {
        throw new Error('No estás autenticado');
      }

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          message: userMessageContent,
          sessionId: currentSessionId,
          context: {
            language: 'es',
            route: pathname,
          }
        }),
      });

      if (!response.ok) throw new Error(`Error ${response.status}`);

      const data = await response.json();
      
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.reply || 'Lo siento, no pude procesar tu solicitud.',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      if (!isOpen) setHasUnread(true);

    } catch (error) {
      logger.error('Chat error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Hubo un problema de conexión.',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    handleSendText(inputValue);
  };

  const showSuggestions = !messages.some(m => m.role === 'user');
  const suggestions = getSuggestionsForRoute(pathname || '/');

  return (
    <div
      className={cn(
        'fixed z-50 flex flex-col items-end gap-4',
        position === 'bottom-right' ? 'bottom-6 right-6' : 'bottom-6 left-6'
      )}
    >
      {/* Chat Window */}
      {isOpen && (
        <Card className="w-[350px] sm:w-[380px] h-[500px] max-h-[80vh] flex flex-col shadow-2xl border-primary/20 animate-in slide-in-from-bottom-10 fade-in duration-200 overflow-hidden">
          
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b bg-primary text-primary-foreground shrink-0">
            <div className="flex items-center gap-2">
              {view === 'history' ? (
                 <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-6 w-6 text-primary-foreground hover:bg-primary-foreground/20 -ml-2"
                    onClick={() => setView('chat')}
                 >
                    <ChevronLeft className="h-4 w-4" />
                 </Button>
              ) : (
                <Bot className="h-5 w-5" />
              )}
              <h3 className="font-semibold">{view === 'history' ? 'Historial' : 'Hago Assistant'}</h3>
            </div>
            <div className="flex items-center gap-1">
                {view === 'chat' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={() => setView('history')}
                        title="Ver historial"
                    >
                        <History className="h-4 w-4" />
                    </Button>
                )}
                {view === 'history' && (
                    <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                        onClick={createNewSession}
                        title="Nueva conversación"
                    >
                        <Plus className="h-4 w-4" />
                    </Button>
                )}
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
                    onClick={() => setIsOpen(false)}
                >
                    <Minimize2 className="h-4 w-4" />
                </Button>
            </div>
          </div>

          {/* Content Area - Conditional Render */}
          {view === 'history' ? (
             <div className="flex-1 overflow-y-auto p-2 bg-muted/30">
                {sessions.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-50">
                        <MessageSquare className="h-12 w-12 mb-2" />
                        <p>No hay historial</p>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sessions.map(session => (
                            <div 
                                key={session.id}
                                onClick={() => {
                                    setCurrentSessionId(session.id);
                                    setView('chat');
                                }}
                                className={cn(
                                    "p-3 rounded-lg border cursor-pointer hover:bg-muted transition-colors flex justify-between group",
                                    currentSessionId === session.id ? "bg-muted border-primary/50" : "bg-background"
                                )}
                            >
                                <div className="overflow-hidden">
                                    <h4 className="font-medium text-sm truncate">{session.title}</h4>
                                    <p className="text-xs text-muted-foreground truncate">{session.lastMessage || 'Nueva conversación'}</p>
                                    <span className="text-[10px] text-muted-foreground mt-1 block">
                                        {formatDistanceToNow(session.timestamp, { addSuffix: true, locale: es })}
                                    </span>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 opacity-0 group-hover:opacity-100 text-destructive hover:bg-destructive/10"
                                    onClick={(e) => deleteSession(e, session.id)}
                                >
                                    <Trash2 className="h-3 w-3" />
                                </Button>
                            </div>
                        ))}
                    </div>
                )}
             </div>
          ) : (
            <>
                {/* Messages Area */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/30">
                    {messages.map((message) => (
                    <div
                        key={message.id}
                        className={cn(
                        'flex w-full gap-2 max-w-[85%]',
                        message.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                        )}
                    >
                        <div
                        className={cn(
                            'h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0',
                            message.role === 'user' ? 'bg-primary text-primary-foreground' : 'bg-muted border'
                        )}
                        >
                        {message.role === 'user' ? <User className="h-4 w-4" /> : <Bot className="h-4 w-4" />}
                        </div>
                        <div
                        className={cn(
                            'p-3 rounded-lg text-sm shadow-sm break-words',
                            message.role === 'user'
                            ? 'bg-primary text-primary-foreground rounded-tr-none'
                            : 'bg-background border rounded-tl-none'
                        )}
                        >
                        <p>{message.content}</p>
                        <span className="text-[10px] opacity-70 mt-1 block text-right">
                            {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        </div>
                    </div>
                    ))}
                    
                    {isTyping && (
                    <div className="flex w-full gap-2 max-w-[85%] mr-auto">
                        <div className="h-8 w-8 rounded-full bg-muted border flex items-center justify-center flex-shrink-0">
                        <Bot className="h-4 w-4" />
                        </div>
                        <div className="bg-background border rounded-lg rounded-tl-none p-3 shadow-sm flex items-center gap-1">
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                        <span className="w-1.5 h-1.5 bg-muted-foreground/40 rounded-full animate-bounce"></span>
                        </div>
                    </div>
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-4 border-t bg-background shrink-0 flex flex-col gap-2">
                    {showSuggestions && suggestions.length > 0 && (
                    <QuickSuggestions suggestions={suggestions} onSelect={handleSendText} />
                    )}
                    
                    <div className="flex gap-2 w-full">
                        <form onSubmit={handleSendMessage} className="flex gap-2 w-full">
                        <Input
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            placeholder="Escribe tu mensaje..."
                            className="flex-1"
                            disabled={isTyping}
                            autoComplete="off"
                        />
                        <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
                            {isTyping ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                            <span className="sr-only">Enviar mensaje</span>
                        </Button>
                        </form>
                    </div>
                    <div className="text-[10px] text-center text-muted-foreground">
                    Presiona Enter para enviar. IA puede cometer errores.
                    </div>
                </div>
            </>
          )}
        </Card>
      )}

      {/* Toggle Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          size="lg"
          className={cn(
            "h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105 relative bg-primary hover:bg-primary/90 text-primary-foreground",
            hasUnread && "animate-pulse ring-2 ring-destructive ring-offset-2"
          )}
        >
          <MessageCircle className="h-7 w-7" />
          <span className="sr-only">Abrir asistente</span>
          {hasUnread && (
            <span className="absolute -top-1 -right-1 h-4 w-4 bg-destructive rounded-full border-2 border-background"></span>
          )}
        </Button>
      )}
    </div>
  );
}
