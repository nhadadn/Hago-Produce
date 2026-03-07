import { cn } from '@/lib/utils'

interface PriceListRendererProps {
  content: string
  language: 'en' | 'es'
}

interface PriceItem {
  rank: string
  name: string
  supplier: string
  price: string
  currency: string
}

export function PriceListRenderer({ content, language }: PriceListRendererProps) {
  // Handle multi-section content separated by "\n\n---\n\n"
  const sections = content.split('\n\n---\n\n')

  if (sections.length > 1) {
    return (
      <div className="space-y-4">
        {sections.map((section, index) => (
          <div key={index}>
            <PriceListRenderer content={section} language={language} />
            {index < sections.length - 1 && <hr className="border-border/50 my-4" />}
          </div>
        ))}
      </div>
    )
  }

  const allLines = content.trim().split('\n')
  const header = allLines[0]
  const itemLines = allLines.filter(l => l.trim().startsWith('#'))
  const footer = allLines.length > 1 && !allLines[allLines.length - 1].trim().startsWith('#') ? allLines[allLines.length - 1] : ''

  const parsedItems: PriceItem[] = []

  for (const line of itemLines) {
    // Split by '  ·  ' (two spaces, dot, two spaces)
    const parts = line.trim().split('  ·  ')
    
    if (parts.length >= 3) {
      const rankAndName = parts[0]
      const supplier = parts[1]
      const priceStr = parts[2]
      
      // Extract rank: rankAndName.match(/^#(\d+)/)?.[1]
      const rankMatch = rankAndName.match(/^#(\d+)/)
      const rank = rankMatch ? rankMatch[1] : ''
      
      // Extract name: rankAndName.replace(/^#\d+\s+/, '').trim()
      const name = rankAndName.replace(/^#\d+\s+/, '').trim()
      
      // Split price and currency
      // e.g. "$34.00 CAD" -> price="$34.00", currency="CAD"
      const priceParts = priceStr.trim().split(' ')
      let price = priceStr
      let currency = ''
      
      if (priceParts.length > 1) {
        currency = priceParts.pop() || ''
        price = priceParts.join(' ')
      }
      
      parsedItems.push({
        rank,
        name,
        supplier,
        price,
        currency
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
          {parsedItems.length} {language === 'en' ? 'items' : 'artículos'}
        </span>
      </div>

      <div className="rounded-md border overflow-hidden">
        {parsedItems.map((item, index) => (
          <div key={index} className={cn(
            "flex items-center gap-3 px-3 py-2 text-sm",
            index % 2 === 0 ? "bg-background" : "bg-muted/30",
            index === 0 && "border-l-2 border-[hsl(var(--hago-primary-800))]"
          )}>
            <span className="w-6 text-center text-xs text-muted-foreground font-mono shrink-0">
              {item.rank}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{item.name}</p>
              <p className="text-xs text-muted-foreground truncate">
                {item.supplier}
              </p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-semibold text-sm">{item.price}</p>
              <p className="text-xs text-muted-foreground">{item.currency}</p>
            </div>
          </div>
        ))}
      </div>

      <p className="text-xs text-muted-foreground text-right">{footer}</p>
    </div>
  )
}
