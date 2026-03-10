'use client';

import { useLanguage } from '@/lib/i18n';
import { Button } from '@/components/ui/button';

export function LanguageToggle({ className }: { className?: string }) {
  const { language, setLanguage } = useLanguage();

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
      className={`text-xs font-semibold w-10 ${className ?? ''}`}
      aria-label={language === 'es' ? 'Switch to English' : 'Cambiar a Español'}
    >
      {language === 'es' ? 'EN' : 'ES'}
    </Button>
  );
}
