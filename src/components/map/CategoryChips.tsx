import { CATEGORIES, CATEGORY_IDS } from '../../data/categories'
import type { CategoryId, Report } from '../../types'

export type CategoryFilter = 'todos' | CategoryId

export function CategoryChips({ value, onChange, reports, className = '' }: { value: CategoryFilter; onChange: (v: CategoryFilter) => void; reports: Report[]; className?: string }) {
  const count = (c: CategoryFilter) => (c === 'todos' ? reports.length : reports.filter((r) => r.category === c).length)
  const opts: CategoryFilter[] = ['todos', ...CATEGORY_IDS]
  return (
    <div role="group" aria-label="Filtrar por categoría" className={`no-scrollbar flex gap-2 overflow-x-auto ${className}`}>
      {opts.map((o) => (
        <button key={o} type="button" className="chip shadow-[var(--shadow-soft)]" aria-pressed={value === o} onClick={() => onChange(o)}>
          {o !== 'todos' && <span className="h-2.5 w-2.5 rounded-full" style={{ background: CATEGORIES[o].color }} aria-hidden="true" />}
          {o === 'todos' ? 'Todos' : CATEGORIES[o].short}
          <span className="opacity-70">{count(o)}</span>
        </button>
      ))}
    </div>
  )
}
