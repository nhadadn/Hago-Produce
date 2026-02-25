import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface ChatState {
  isOpen: boolean;
  messages: Message[];
  isTyping: boolean;
  setIsOpen: (isOpen: boolean) => void;
  toggleOpen: () => void;
  addMessage: (message: Message) => void;
  setTyping: (isTyping: boolean) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>()(
  persist(
    (set) => ({
      isOpen: false,
      messages: [],
      isTyping: false,
      setIsOpen: (isOpen) => set({ isOpen }),
      toggleOpen: () => set((state) => ({ isOpen: !state.isOpen })),
      addMessage: (message) => set((state) => ({ 
        messages: [...state.messages, message] 
      })),
      setTyping: (isTyping) => set({ isTyping }),
      clearMessages: () => set({ messages: [] }),
    }),
    {
      name: 'hago-chat-storage',
      partialize: (state) => ({ isOpen: state.isOpen, messages: state.messages }),
    }
  )
);
