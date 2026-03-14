'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { es, TranslationKeys } from './translations/es';
import { en } from './translations/en';
import { fr } from './translations/fr';

export type Language = 'es' | 'en' | 'fr';

interface LanguageContextValue {
  language: Language;
  t: TranslationKeys;
  setLanguage: (lang: Language) => void;
}

const STORAGE_KEY = 'hago-language';

export const LanguageContext = createContext<LanguageContextValue>({
  language: 'es',
  t: es,
  setLanguage: () => {},
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('es');

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Language | null;
    if (saved === 'en' || saved === 'es' || saved === 'fr') {
      setLanguageState(saved);
    }
  }, []);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem(STORAGE_KEY, lang);
    document.cookie = `hago-language=${lang};path=/;max-age=31536000;samesite=lax`;
  };

  const t = language === 'es' ? es : language === 'en' ? en : fr;

  return (
    <LanguageContext.Provider value={{ language, t, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
}
