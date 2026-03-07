import { cn } from '@/lib/utils'

interface InvoiceRendererProps {
  content: string
  language: 'en' | 'es'
}

interface InvoiceItem {
  number: string
  status: string
  amount: string
  dueDate: string
}

interface InvoiceDetailField {
  label: string
  value: string
}

export function InvoiceRenderer({ content, language }: InvoiceRendererProps) {
  const allLines = content.split('\n')
  const isFormatA = allLines.some(l => l.includes('Invoice #') || l.includes('Factura #'))
  
  if (isFormatA) {
    // FORMAT A - Single Invoice Detail
    const titleLineIndex = allLines.findIndex(l => l.includes('Invoice #') || l.includes('Factura #'))
    const titleLine = titleLineIndex >= 0 ? allLines[titleLineIndex] : ''
    const invoiceNumber = titleLine.trim()

    // Parse fields
    const fields: InvoiceDetailField[] = []
    let statusLabel = ''
    let isOverdue = content.includes('⚠️')

    // Filter potential detail lines (containing 2+ spaces separator)
    // We skip the title line.
    const detailLines = allLines.filter((l, idx) => 
      idx !== titleLineIndex && l.includes('  ')
    )

    for (const line of detailLines) {
      // Split on first occurrence of 2+ spaces
      const match = line.trim().match(/^(.+?)\s{2,}(.+)$/)
      if (match) {
        const label = match[1].trim()
        const value = match[2].trim()
        fields.push({ label, value })

        if (label.startsWith('Status') || label.startsWith('Estado')) {
          statusLabel = value
        }
      }
    }

    if (fields.length === 0 && !invoiceNumber) {
       return <p className="text-sm whitespace-pre-wrap">{content}</p>
    }

    return (
      <div className="rounded-md border overflow-hidden">
        <div className="flex items-center justify-between px-3 py-2 bg-muted/50 border-b">
          <span className="font-semibold text-sm">{invoiceNumber}</span>
          <span className={cn("text-xs px-2 py-0.5 rounded-full font-medium",
            isOverdue
              ? "bg-destructive/10 text-destructive"
              : "bg-muted text-muted-foreground"
          )}>
            {statusLabel}
          </span>
        </div>
        <div className="px-3 py-2 space-y-1.5">
          {fields.map(({label, value}, i) => (
            <div key={i} className="grid grid-cols-[120px_1fr] gap-2">
              <span className="text-xs text-muted-foreground">{label}</span>
              <span className="text-sm font-medium">{value}</span>
            </div>
          ))}
        </div>
      </div>
    )
  } else {
    // FORMAT B - List of Invoices
    const header = allLines[0]
    const itemLines = allLines.filter(l => l.includes('  ·  '))
    
    // Find footer (last non-empty line)
    let footer = ''
    for (let i = allLines.length - 1; i >= 0; i--) {
      if (allLines[i].trim()) {
        footer = allLines[i]
        break
      }
    }

    const parsedItems: InvoiceItem[] = []
    
    for (const line of itemLines) {
      const parts = line.trim().split('  ·  ')
      if (parts.length >= 4) {
        const number = parts[0].trim()
        const status = parts[1].trim()
        const amount = parts[2].trim()
        const dueDate = parts[3].replace('Due:', '').replace('Vence:', '').trim()
        
        parsedItems.push({
          number,
          status,
          amount,
          dueDate
        })
      }
    }

    if (parsedItems.length === 0) {
      return <p className="text-sm whitespace-pre-wrap">{content}</p>
    }

    return (
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <span className="font-semibold text-sm">{header}</span>
           <span className="text-xs px-2 py-0.5 rounded-full bg-[hsl(var(--hago-primary-100))] text-[hsl(var(--hago-primary-800))]">
             {parsedItems.length} {language === 'en' ? 'found' : 'encontradas'}
           </span>
         </div>
         
         <div className="rounded-md border overflow-hidden">
            {parsedItems.map((item, index) => (
              <div key={index} className={cn(
                "flex items-center gap-3 px-3 py-2 text-sm",
                index % 2 === 0 ? "bg-background" : "bg-muted/30",
                index === 0 && "border-l-2 border-[hsl(var(--hago-primary-800))]"
              )}>
                <span className="text-xs font-mono font-medium shrink-0 min-w-[80px]">
                  {item.number}
                </span>
                
                <span className={cn(
                  "text-[10px] px-1.5 py-0.5 rounded-full border shrink-0",
                  (item.status.includes('Overdue') || item.status.includes('Vencida') || item.status.includes('⚠️')) 
                    ? "bg-destructive/10 text-destructive border-destructive/20" 
                    : "bg-muted text-muted-foreground border-transparent"
                )}>
                  {item.status}
                </span>
                
                <div className="flex-1 text-right">
                   <p className="font-semibold text-sm">{item.amount}</p>
                </div>
                
                <div className="text-right shrink-0 min-w-[90px]">
                   <p className="text-xs text-muted-foreground">{item.dueDate}</p>
                </div>
              </div>
            ))}
         </div>
         
         <p className="text-xs text-muted-foreground text-right">{footer}</p>
       </div>
    )
  }
}
