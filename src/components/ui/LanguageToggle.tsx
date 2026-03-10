'use client';

import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';
import type { Language } from '@/lib/i18n';

const CYCLE: Record<Language, Language> = {
  es: 'en',
  en: 'fr',
  fr: 'es',
};

const NEXT_LABEL: Record<Language, string> = {
  es: 'EN',
  en: 'FR',
  fr: 'ES',
};

const ARIA_LABEL: Record<Language, string> = {
  es: 'Switch to English',
  en: 'Passer au français',
  fr: 'Cambiar a Español',
};

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(CYCLE[language])}
      className={`text-xs font-semibold w-10 ${className ?? ''}`}
      aria-label={ARIA_LABEL[language]}
    >
      {NEXT_LABEL[language]}
    </Button>
  );
}
