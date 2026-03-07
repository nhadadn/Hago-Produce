import { cn } from '@/lib/utils'

interface BalanceRendererProps {
  content: string
  language: 'en' | 'es'
}

interface MetricItem {
  label: string
  value: string
  isOverdue: boolean
}

export function BalanceRenderer({ content, language }: BalanceRendererProps) {
  const allLines = content.split('\n')
  const titleLine = allLines[0]
  const title = titleLine.replace(/^[💰⚠️]/, '').trim()
  
  // Style detection
  // STYLE B — Overdue (⚠️) if content starts with ⚠️ or title indicates overdue
  const isStyleB = content.startsWith('⚠️') || title.includes('Overdue') || title.includes('Vencida')

  const metricLines: MetricItem[] = []
  const otherLines: string[] = []
  
  // Parse lines starting from index 1
  for (let i = 1; i < allLines.length; i++) {
    const line = allLines[i].trim()
    if (!line) continue

    // Try to parse as Label: Value or Label  Value
    let label = ''
    let value = ''
    let parsed = false
    
    // Split each line on first "  " (2+ spaces) or ":"
    if (line.includes('  ')) {
       const match = line.match(/^(.+?)\s{2,}(.+)$/)
       if (match) {
         label = match[1].trim()
         value = match[2].trim()
         parsed = true
       }
    } else if (line.includes(':')) {
       const parts = line.split(':')
       label = parts[0].trim()
       value = parts.slice(1).join(':').trim()
       parsed = true
    }
    
    if (parsed && label && value) {
       metricLines.push({
         label,
         value,
         isOverdue: line.includes('⚠️')
       })
    } else {
       otherLines.push(line)
    }
  }

  if (metricLines.length === 0 && otherLines.length === 0) {
    return <p className="text-sm whitespace-pre-wrap">{content}</p>
  }

  return (
    <div className="rounded-md border overflow-hidden">
      {/* Header */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 border-b",
        isStyleB 
          ? "bg-[hsl(var(--hago-secondary-50))] border-[hsl(var(--hago-secondary-800))]/20"
          : "bg-[hsl(var(--hago-primary-50))]"
      )}>
        <span className="text-base">{isStyleB ? '⚠️' : '💰'}</span>
        <span className="font-semibold text-sm">{title}</span>
      </div>

      {/* Metrics */}
      <div className="px-3 py-2 space-y-1.5">
        {metricLines.map(({label, value, isOverdue}, index) => (
           <div key={index} className="flex items-center justify-between">
             <span className="text-xs text-muted-foreground">{label}</span>
             <span className={cn(
               "text-sm font-semibold",
               isOverdue && "text-[hsl(var(--hago-error))]"
             )}>
               {value}
             </span>
           </div>
        ))}
      </div>
      
      {/* Top debtors / Other lines */}
      {otherLines.length > 0 && (
        <div className="px-3 py-2 border-t bg-muted/20">
          <p className="text-xs font-semibold mb-2 text-muted-foreground">
            {language === 'en' ? 'Details' : 'Detalles'}
          </p>
          <div className="space-y-1">
            {otherLines.map((line, idx) => (
              <p key={idx} className="text-xs text-muted-foreground whitespace-pre-wrap">
                {line}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
