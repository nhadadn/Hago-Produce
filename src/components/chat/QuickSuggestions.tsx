import React from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ArrowRight, FileText, Users, BarChart, Plus, Search, HelpCircle } from 'lucide-react';

export interface Suggestion {
  label: string;
  action: string; // The message to send
  icon?: React.ReactNode;
}

interface QuickSuggestionsProps {
  suggestions: Suggestion[];
  onSelect: (message: string) => void;
  className?: string;
}

export function QuickSuggestions({ suggestions, onSelect, className }: QuickSuggestionsProps) {
  if (!suggestions || suggestions.length === 0) return null;

  return (
    <div className={cn("flex gap-2 overflow-x-auto pb-2 px-1 snap-x no-scrollbar", className)}>
      {suggestions.map((suggestion, index) => (
        <Button
          key={index}
          variant="outline"
          size="sm"
          onClick={() => onSelect(suggestion.action)}
          className="snap-start shrink-0 rounded-full text-xs h-7 bg-background/80 hover:bg-primary/10 hover:text-primary border-primary/20 transition-all"
        >
          {suggestion.icon && <span className="mr-1.5 opacity-70">{suggestion.icon}</span>}
          {suggestion.label}
        </Button>
      ))}
    </div>
  );
}
