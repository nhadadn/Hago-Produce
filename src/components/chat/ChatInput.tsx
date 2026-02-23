import { useState, KeyboardEvent } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { ChatLanguage } from '@/lib/chat/types';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (message: string) => Promise<void> | void;
  disabled?: boolean;
  language: ChatLanguage;
}

export function ChatInput({ onSend, disabled, language }: ChatInputProps) {
  const [value, setValue] = useState('');

  const handleSend = async () => {
    const trimmed = value.trim();
    if (!trimmed || disabled) return;
    await onSend(trimmed);
    setValue('');
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      void handleSend();
    }
  };

  const placeholder =
    language === 'en'
      ? 'Ask about prices, suppliers, invoices or balances...'
      : 'Pregunta sobre precios, proveedores, facturas o saldos...';

  const sendLabel = language === 'en' ? 'Send' : 'Enviar';

  return (
    <div className="flex items-end gap-2">
      <Textarea
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="min-h-[60px] max-h-40 resize-none text-sm"
        disabled={disabled}
      />
      <Button type="button" onClick={handleSend} disabled={disabled} className="shrink-0">
        <Send className="mr-2 h-4 w-4" />
        {sendLabel}
      </Button>
    </div>
  );
}

