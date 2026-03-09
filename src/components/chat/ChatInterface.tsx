import { useEffect, useRef, useState } from 'react';
import { ChatLanguage } from '@/lib/chat/types';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage, ChatMessageItem } from '@/components/chat/ChatMessage';
import { QuickSuggestions } from '@/components/chat/QuickSuggestions';
import { sendChatMessage } from '@/lib/api/chat';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export function ChatInterface() {
  const [language, setLanguage] = useState<ChatLanguage>('es');
  const [messages, setMessages] = useState<ChatMessageItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [messages]);

  const handleSend = async (content: string) => {
    if (isLoading) return;

    setError(null);

    const userMessage: ChatMessageItem = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toLocaleTimeString(
        language === 'en' ? 'en-CA' : 'es-MX',
        { hour: '2-digit', minute: '2-digit' }
      ),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await sendChatMessage(content, language);

      const assistantMessage: ChatMessageItem = {
        id: `${Date.now()}-assistant`,
        role: 'assistant',
        content: response.response,
        sources: response.sources,
        timestamp: new Date().toLocaleTimeString(
          language === 'en' ? 'en-CA' : 'es-MX',
          { hour: '2-digit', minute: '2-digit' }
        ),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : language === 'en'
          ? 'Unexpected error. Please try again.'
          : 'Error inesperado. Intenta de nuevo.';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const errorTitle = language === 'en' ? 'There was a problem' : 'Ocurrió un problema';

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] max-h-[720px] flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3 bg-[hsl(var(--hago-primary-50))]">
        <div className="flex items-center gap-2">
          <span className="text-xl">🌿</span>
          <div>
            <h2 className="text-sm font-semibold leading-none">
              HAGO Assistant
            </h2>
            <div className="flex items-center gap-1 mt-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--hago-success))]" />
              <span className="text-xs text-muted-foreground">
                {language === 'en' ? 'Online' : 'En línea'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center rounded-md border overflow-hidden text-xs">
          <button
            onClick={() => setLanguage('es')}
            className={cn(
              "px-3 py-1.5 transition-colors",
              language === 'es'
                ? "bg-[hsl(var(--hago-primary-800))] text-white"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}>
            ES
          </button>
          <button
            onClick={() => setLanguage('en')}
            className={cn(
              "px-3 py-1.5 transition-colors",
              language === 'en'
                ? "bg-[hsl(var(--hago-primary-800))] text-white"
                : "bg-background text-muted-foreground hover:bg-muted"
            )}>
            EN
          </button>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 px-4 py-3">
        {messages.filter(m => m.role === 'assistant').length === 0 && (
          <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
            <div className="text-center space-y-1">
              <p className="text-sm font-medium">
                {language === 'en'
                  ? 'Hello, I am your HAGO PRODUCE assistant'
                  : 'Hola, soy tu asistente de HAGO PRODUCE'}
              </p>
              <p className="text-xs text-muted-foreground">
                {language === 'en'
                  ? 'Ask me about prices, invoices or balances'
                  : 'Pregúntame sobre precios, facturas o saldos'}
              </p>
              <div className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground mt-2">
                <span className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--hago-primary-800))] animate-pulse" />
                <span>
                  {language === 'en'
                    ? 'Ready to answer your questions'
                    : 'Listo para responder tus preguntas'}
                </span>
              </div>
            </div>

            <QuickSuggestions
              language={language}
              onSelect={(query) => handleSend(query)}
              disabled={isLoading}
            />
          </div>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} language={language} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 border-t bg-background px-4 py-3 shadow-[0_-1px_4px_rgba(0,0,0,0.04)]">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {isLoading && (
          <div className="flex items-center gap-1 px-1 py-0.5">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="h-1.5 w-1.5 rounded-full bg-[hsl(var(--hago-primary-800))] animate-bounce"
                style={{ animationDelay: i * 150 + 'ms' }}
              />
            ))}
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isLoading} language={language} />
      </div>
    </div>
  );
}

