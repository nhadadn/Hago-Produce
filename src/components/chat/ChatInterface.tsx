import { useEffect, useRef, useState } from 'react';
import { ChatLanguage } from '@/lib/chat/types';
import { ChatInput } from '@/components/chat/ChatInput';
import { ChatMessage, ChatMessageItem } from '@/components/chat/ChatMessage';
import { sendChatMessage } from '@/lib/api/chat';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, AlertCircle } from 'lucide-react';

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

  const title = language === 'en' ? 'Business chat' : 'Chat de negocio';
  const description =
    language === 'en'
      ? 'Ask questions about prices, suppliers, invoices and customer balances.'
      : 'Haz preguntas sobre precios, proveedores, facturas y saldos de clientes.';

  const emptyState =
    language === 'en'
      ? 'Start by asking something about your business data.'
      : 'Comienza preguntando algo sobre tus datos de negocio.';

  const loadingLabel =
    language === 'en'
      ? 'Analyzing your question and preparing an answer...'
      : 'Analizando tu pregunta y preparando una respuesta...';

  const errorTitle = language === 'en' ? 'There was a problem' : 'Ocurrió un problema';

  return (
    <div className="flex h-[calc(100vh-220px)] min-h-[480px] max-h-[720px] flex-col rounded-lg border bg-background">
      <div className="flex items-center justify-between border-b px-4 py-3">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold leading-none tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="text-muted-foreground">Idioma</span>
          <Select value={language} onValueChange={(value) => setLanguage(value as ChatLanguage)}>
            <SelectTrigger className="h-8 w-[110px] text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="es">Español</SelectItem>
              <SelectItem value="en">English</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 space-y-3 overflow-y-auto bg-muted/10 px-4 py-3">
        {messages.length === 0 && (
          <p className="mt-4 text-center text-xs text-muted-foreground">{emptyState}</p>
        )}
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} language={language} />
        ))}
        <div ref={messagesEndRef} />
      </div>

      <div className="space-y-3 border-t bg-background px-4 py-3">
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertTitle>{errorTitle}</AlertTitle>
            <AlertDescription className="text-xs">{error}</AlertDescription>
          </Alert>
        )}
        {isLoading && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{loadingLabel}</span>
          </div>
        )}
        <ChatInput onSend={handleSend} disabled={isLoading} language={language} />
      </div>
    </div>
  );
}

