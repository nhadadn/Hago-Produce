import { useState } from 'react';
import { useChatStore } from '@/lib/hooks/chat/useChatStore';

export const useChat = () => {
  const store = useChatStore();
  
  const sendMessage = async (content: string) => {
    // Add user message
    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: new Date(),
    };
    
    store.addMessage(userMessage);
    store.setTyping(true);

    try {
      // Simulate API call for now
      // In production, this would be: await fetch('/api/chat', { ... })
      setTimeout(() => {
        const botMessage: Message = {
          id: crypto.randomUUID(),
          role: 'assistant',
          content: `Recibí tu mensaje: "${content}". Como soy un asistente de prueba, aún no puedo procesar solicitudes complejas, pero pronto podré ayudarte con facturas y consultas.`,
          timestamp: new Date(),
        };
        store.addMessage(botMessage);
        store.setTyping(false);
      }, 1500);
      
    } catch (error) {
      console.error('Failed to send message:', error);
      store.setTyping(false);
    }
  };

  return {
    ...store,
    sendMessage,
  };
};
