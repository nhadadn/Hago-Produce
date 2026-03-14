'use client';

import { useLanguage } from '@/lib/i18n';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Language } from '@/lib/i18n';

const LANGUAGE_LABELS: Record<Language, string> = {
  es: 'Español',
  en: 'English',
  fr: 'Français',
};

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <Select value={language} onValueChange={(val) => setLanguage(val as Language)}>
      <SelectTrigger className={`w-32 text-xs h-8 ${className ?? ''}`} aria-label="Seleccionar idioma">
        <SelectValue>{LANGUAGE_LABELS[language]}</SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="es">Español</SelectItem>
        <SelectItem value="en">English</SelectItem>
        <SelectItem value="fr">Français</SelectItem>
      </SelectContent>
    </Select>
  );
}
