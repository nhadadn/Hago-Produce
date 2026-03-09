import { ChatLanguage, ChatSource } from '@/lib/chat/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { PriceListRenderer, InvoiceRenderer, BalanceRenderer } from './renderers';
import React from 'react';

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessageItem {
  id: string;
  role: ChatMessageRole;
  content: string;
  sources?: ChatSource[];
  timestamp?: string;
}

interface ChatMessageProps {
  message: ChatMessageItem;
  language: ChatLanguage;
}

function detectAndRender(
  content: string,
  language: 'en' | 'es',
  role: string
): React.ReactNode | null {
  if (role !== 'assistant') return null
  const firstLine = content.split('\n')[0] ?? ''
  if (firstLine.startsWith('🏆') || firstLine.startsWith('🔍')) {
    return <PriceListRenderer content={content} language={language} />
  }
  if (firstLine.startsWith('📋')) {
    return <InvoiceRenderer content={content} language={language} />
  }
  if (
    firstLine.startsWith('💰') ||
    firstLine.startsWith('⚠️')
  ) {
    return <BalanceRenderer content={content} language={language} />
  }
  return null
}

export function ChatMessage({ message, language }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex w-full gap-2 message-animate-in', {
        'justify-end': isUser,
        'justify-start': !isUser,
      })}
    >
      <div
        className={cn('max-w-[80%] rounded-lg px-3 py-2 text-sm shadow-sm', {
          'bg-primary text-primary-foreground': isUser,
          'bg-muted text-foreground': !isUser,
        })}
      >
        {detectAndRender(message.content, language, message.role) 
          ?? ( 
          <p className="text-sm leading-relaxed whitespace-pre-wrap"> 
            {message.content} 
          </p> 
        )}
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="mt-3 border-t pt-2">
            <p className="mb-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {language === 'en' ? 'Sources' : 'Fuentes'}
            </p>
            <div className="flex flex-wrap gap-2">
              {message.sources.map((source) => (
                <Badge key={source.id} variant="secondary" className="text-xs">
                  {source.label}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>
      {message.timestamp && (
        <span className="text-[10px] text-muted-foreground mt-0.5 block">
          {message.timestamp}
        </span>
      )}
    </div>
  );
}
