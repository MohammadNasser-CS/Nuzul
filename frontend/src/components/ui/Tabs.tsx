import type { ReactNode } from 'react'
import { cn } from '@/lib/format'

export interface TabItem<T extends string> {
  value: T
  label: ReactNode
  count?: number
  icon?: ReactNode
}

/** Pill-style segmented tabs. Scrolls horizontally on narrow screens. */
export function Tabs<T extends string>({
  items,
  value,
  onChange,
  className,
}: {
  items: TabItem<T>[]
  value: T
  onChange: (v: T) => void
  className?: string
}) {
  return (
    <div className={cn('-mx-4 overflow-x-auto px-4 scrollbar-none sm:mx-0 sm:px-0', className)}>
      <div role="tablist" className="inline-flex gap-1 rounded-2xl border border-line bg-white p-1 shadow-soft">
        {items.map((item) => {
          const active = item.value === value
          return (
            <button
              key={item.value}
              role="tab"
              aria-selected={active}
              onClick={() => onChange(item.value)}
              className={cn(
                'inline-flex h-9 items-center gap-2 whitespace-nowrap rounded-xl px-4 text-sm font-semibold transition-all [&>svg]:size-4',
                active ? 'bg-brand-600 text-white shadow-sm' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-800',
              )}
            >
              {item.icon}
              {item.label}
              {item.count !== undefined && (
                <span
                  className={cn(
                    'min-w-5 rounded-full px-1.5 text-xs leading-5',
                    active ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500',
                  )}
                >
                  {item.count}
                </span>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
