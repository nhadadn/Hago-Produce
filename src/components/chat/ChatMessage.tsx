import { ChatLanguage, ChatSource } from '@/lib/chat/types';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export type ChatMessageRole = 'user' | 'assistant';

export interface ChatMessageItem {
  id: string;
  role: ChatMessageRole;
  content: string;
  sources?: ChatSource[];
}

interface ChatMessageProps {
  message: ChatMessageItem;
  language: ChatLanguage;
}

export function ChatMessage({ message, language }: ChatMessageProps) {
  const isUser = message.role === 'user';

  return (
    <div
      className={cn('flex w-full gap-2', {
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
        <p className="whitespace-pre-line leading-relaxed">{message.content}</p>
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
    </div>
  );
}

