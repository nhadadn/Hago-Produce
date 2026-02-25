"use client";

import { useState, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useChatStore } from "@/lib/hooks/chat/useChatStore";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageCircle, X, Send, Minus, Bot, User } from "lucide-react";

interface FloatingChatAssistantProps {
  position?: "bottom-right" | "bottom-left";
  initialOpen?: boolean;
}

export function FloatingChatAssistant({
  position = "bottom-right",
  initialOpen = false,
}: FloatingChatAssistantProps) {
  const { 
    isOpen, 
    toggleOpen, 
    messages, 
    isTyping, 
    addMessage, 
    setTyping, 
    setIsOpen 
  } = useChatStore();
  
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Initialize open state if prop provided (only once)
  useEffect(() => {
    if (initialOpen) setIsOpen(true);
  }, [initialOpen, setIsOpen]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping, isOpen]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim()) return;

    const userMsgContent = inputValue;
    setInputValue("");

    // Add user message immediately
    const userMessage = {
      id: crypto.randomUUID(),
      role: "user" as const,
      content: userMsgContent,
      timestamp: new Date(),
    };
    addMessage(userMessage);
    
    setTyping(true);

    // Simulate bot response (Replace with real API call later)
    try {
      // Mock API delay
      setTimeout(() => {
        const botMessage = {
          id: crypto.randomUUID(),
          role: "assistant" as const,
          content: `Entendido: "${userMsgContent}". Estoy en modo de prueba, pronto podré ayudarte con tus facturas.`,
          timestamp: new Date(),
        };
        addMessage(botMessage);
        setTyping(false);
      }, 1500);
    } catch (error) {
      console.error("Error sending message:", error);
      setTyping(false);
    }
  };

  return (
    <>
      {/* Floating Button */}
      <Button
        onClick={toggleOpen}
        className={cn(
          "fixed z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-105",
          position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6",
          isOpen ? "scale-0 opacity-0" : "scale-100 opacity-100"
        )}
        size="icon"
      >
        <MessageCircle className="h-6 w-6" />
        <span className="sr-only">Abrir asistente</span>
      </Button>

      {/* Chat Window */}
      <div
        className={cn(
          "fixed z-50 flex flex-col overflow-hidden rounded-lg border bg-background shadow-xl transition-all duration-300 ease-in-out",
          position === "bottom-right" ? "bottom-6 right-6" : "bottom-6 left-6",
          isOpen
            ? "h-[500px] w-[350px] translate-y-0 opacity-100 sm:w-[400px]"
            : "pointer-events-none h-0 w-0 translate-y-10 opacity-0"
        )}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b bg-primary px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            <h3 className="font-semibold">Hago Assistant</h3>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <Minus className="h-4 w-4" />
              <span className="sr-only">Minimizar</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-primary-foreground/20 text-primary-foreground"
              onClick={() => setIsOpen(false)}
            >
              <X className="h-4 w-4" />
              <span className="sr-only">Cerrar</span>
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 dark:bg-slate-900/50">
          {messages.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center text-center text-muted-foreground">
              <Bot className="mb-2 h-12 w-12 opacity-20" />
              <p className="text-sm">¡Hola! ¿En qué puedo ayudarte hoy?</p>
              <div className="mt-4 grid gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setInputValue("Consultar mis facturas pendientes");
                  }}
                >
                  Ver facturas pendientes
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="text-xs"
                  onClick={() => {
                    setInputValue("Crear una nueva factura");
                  }}
                >
                  Crear nueva factura
                </Button>
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={cn(
                  "flex w-max max-w-[80%] flex-col gap-1 rounded-lg px-3 py-2 text-sm",
                  msg.role === "user"
                    ? "ml-auto bg-primary text-primary-foreground"
                    : "bg-muted text-foreground"
                )}
              >
                <p>{msg.content}</p>
                <span className="text-[10px] opacity-70">
                  {new Date(msg.timestamp).toLocaleTimeString([], { 
                    hour: '2-digit', 
                    minute: '2-digit' 
                  })}
                </span>
              </div>
            ))
          )}

          {isTyping && (
            <div className="flex w-max max-w-[80%] items-center gap-1 rounded-lg bg-muted px-3 py-2 text-sm text-muted-foreground">
              <span className="animate-bounce">●</span>
              <span className="animate-bounce delay-100">●</span>
              <span className="animate-bounce delay-200">●</span>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="border-t p-4 bg-background">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu mensaje..."
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={!inputValue.trim() || isTyping}>
              <Send className="h-4 w-4" />
              <span className="sr-only">Enviar</span>
            </Button>
          </form>
        </div>
      </div>
    </>
  );
}
