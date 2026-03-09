import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { TrendingUp, FileText, AlertTriangle, Award } from 'lucide-react';

export interface Suggestion {
  label: string;
  action?: string;
  query?: string;
  icon?: React.ReactNode;
}

interface QuickSuggestionsProps {
  language?: 'en' | 'es';
  suggestions?: Suggestion[];
  onSelect: (message: string) => void;
  disabled?: boolean;
  className?: string;
}

export function QuickSuggestions({ language = 'es', suggestions: customSuggestions, onSelect, disabled, className }: QuickSuggestionsProps) {
  const defaultSuggestions: Suggestion[] = [
    {
      icon: <TrendingUp className="h-3.5 w-3.5" />,
      label: language === 'en' ? 'Apple prices' : 'Precios manzana',
      query: language === 'en' ? 'price of apple' : 'precio de manzana',
    },
    {
      icon: <Award className="h-3.5 w-3.5" />,
      label: language === 'en' ? 'Best supplier' : 'Mejor proveedor',
      query: language === 'en'
        ? 'best price for grapefruit'
        : 'mejor precio de toronja',
    },
    {
      icon: <FileText className="h-3.5 w-3.5" />,
      label: language === 'en' ? 'Invoices' : 'Facturas',
      query: language === 'en'
        ? 'show recent invoices'
        : 'mostrar facturas recientes',
    },
    {
      icon: <AlertTriangle className="h-3.5 w-3.5" />,
      label: language === 'en' ? 'Overdue' : 'Vencidas',
      query: language === 'en'
        ? 'overdue invoices'
        : 'facturas vencidas',
    },
  ];

  if (customSuggestions) {
    if (!customSuggestions.length) return null;
    
    return (
      <div className={cn("flex gap-2 overflow-x-auto pb-2 px-1 snap-x no-scrollbar", className)}>
        {customSuggestions.map((suggestion, index) => (
          <Button
            key={index}
            variant="outline"
            size="sm"
            onClick={() => !disabled && onSelect(suggestion.action || suggestion.query || '')}
            disabled={disabled}
            className={cn(
              "snap-start shrink-0 rounded-full text-xs h-7 bg-background/80 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all",
              disabled && "opacity-50 cursor-not-allowed"
            )}
          >
            {suggestion.icon && <span className="mr-1.5 opacity-70">{suggestion.icon}</span>}
            {suggestion.label}
          </Button>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("grid grid-cols-2 gap-2 w-full max-w-xs", className)}>
      {defaultSuggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => !disabled && onSelect(suggestion.query || suggestion.action || '')}
          disabled={disabled}
          className={cn(
            "flex items-center justify-start gap-2 h-auto py-2 px-3 text-xs text-left transition-colors",
            "bg-background hover:bg-[hsl(var(--hago-primary-50))] hover:border-[hsl(var(--hago-primary-800))]/30",
            disabled && "opacity-50 cursor-not-allowed hover:bg-background hover:border-border"
          )}
        >
          <span className={cn("text-muted-foreground", disabled && "opacity-50")}>
            {suggestion.icon}
          </span>
          <span className="text-muted-foreground truncate">{suggestion.label}</span>
        </Button>
      ))}
    </div>
  );
}
