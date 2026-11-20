import { Search, X, SearchX } from 'lucide-react'
import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CategoryChips, type CategoryFilter } from '../../components/map/CategoryChips'
import { FloatingPanel, SidePanel } from '../../components/map/SelectionPanel'
import { UrbiaMap, type FlyTarget } from '../../components/map/UrbiaMap'
import { STATUSES, STATUS_ORDER } from '../../data/categories'
import { useReports } from '../../features/reports/store'
import { AvisosLayer, useMappableAvisos } from '../../features/avisos/AvisosProvider'
import { searchPlaces } from '../../lib/search'
import type { Status } from '../../types'

type StatusFilter = 'activos' | 'todos' | Status

export function MapPage() {
  const { reports } = useReports()
  const [params, setParams] = useSearchParams()
  const [cat, setCat] = useState<CategoryFilter>('todos')
  const [status, setStatus] = useState<StatusFilter>('activos')
  const [q, setQ] = useState(params.get('q') ?? '')
  const [applied, setApplied] = useState(params.get('q') ?? '')
  const [fly, setFly] = useState<FlyTarget | null>(null)
  const [showAvisos, setShowAvisos] = useState(true)
  const avisos = useMappableAvisos(30)
  const sel = params.get('sel')
  const setSel = (id: string | null) => setParams((p) => { const n = new URLSearchParams(p); if (id) n.set('sel', id); else n.delete('sel'); return n }, { replace: true })

  // Búsqueda que llega desde el encabezado
  const urlQ = params.get('q') ?? ''
  useEffect(() => { setQ(urlQ); setApplied(urlQ) }, [urlQ])

  const byStatus = useMemo(() => reports.filter((r) =>
    status === 'todos' ? true : status === 'activos' ? r.status !== 'resuelto' && r.status !== 'descartado' : r.status === status), [reports, status])
  const search = useMemo(() => searchPlaces(applied, byStatus), [applied, byStatus])
  // Si la búsqueda coincide con una zona, centramos el mapa y mostramos todo; si coincide con reportes, filtramos.
  const base = applied && !search.zone ? search.reports : byStatus
  const visible = cat === 'todos' ? base : base.filter((r) => r.category === cat)
  const noResults = !!applied && !search.zone && search.reports.length === 0

  useEffect(() => {
    if (!applied) return
    if (search.zone) setFly({ lat: search.zone.lat, lng: search.zone.lng, zoom: 15, key: Date.now() })
    else if (search.reports[0]) setFly({ lat: search.reports[0].lat, lng: search.reports[0].lng, zoom: 15, key: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [applied])

  useEffect(() => {
    const r = sel ? reports.find((x) => x.id === sel) : null
    if (r) setFly({ lat: r.lat, lng: r.lng, zoom: 15, key: Date.now() })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const submit = (e: FormEvent) => { e.preventDefault(); setApplied(q.trim()); setParams((p) => { const n = new URLSearchParams(p); if (q.trim()) n.set('q', q.trim()); else n.delete('q'); return n }, { replace: true }) }
  const clear = () => { setQ(''); setApplied(''); setParams((p) => { const n = new URLSearchParams(p); n.delete('q'); return n }, { replace: true }) }
  const selected = sel ? reports.find((r) => r.id === sel) : undefined

  return (
    <div className="flex flex-1 flex-col gap-3 px-4 pt-4 md:px-8 md:pt-6">
      <div className="flex flex-wrap items-center gap-2 md:gap-3">
        <h1 className="mr-2 text-[22px] font-extrabold md:text-[26px]">Mapa urbano</h1>
        <form role="search" onSubmit={submit} className="relative order-3 w-full sm:order-none sm:w-[300px]">
          <label htmlFor="map-search" className="sr-only">Buscar zona, colonia o referencia</label>
          <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
          <input id="map-search" value={q} onChange={(e) => setQ(e.target.value)} className="input !pl-10 !pr-10" placeholder="Zona, colonia o referencia" />
          {q && <button type="button" onClick={clear} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg hover:bg-soft" aria-label="Limpiar búsqueda"><X size={16} /></button>}
        </form>
        <label className="sr-only" htmlFor="status-filter">Estado</label>
        <select id="status-filter" value={status} onChange={(e) => setStatus(e.target.value as StatusFilter)} className="input !w-auto">
          <option value="activos">Estado: activos</option>
          <option value="todos">Estado: todos</option>
          {STATUS_ORDER.map((s) => <option key={s} value={s}>{STATUSES[s].long}</option>)}
        </select>
        <label className="flex min-h-11 cursor-pointer items-center gap-2 rounded-xl border border-line bg-white px-3 text-sm font-semibold">
          <input type="checkbox" className="h-4 w-4 accent-[#0670C4]" checked={showAvisos} onChange={(e) => setShowAvisos(e.target.checked)} />
          Avisos oficiales <span className="font-normal text-muted">{avisos.length}</span>
        </label>
        <p className="ml-auto text-sm text-muted" aria-live="polite"><strong className="text-navy">{visible.length}</strong> reportes visibles</p>
      </div>
      {applied && (
        <div role="status" className="flex flex-wrap items-center gap-2 text-sm">
          {noResults
            ? <span className="inline-flex items-center gap-2 rounded-xl bg-[#FFF6EC] px-3 py-2 text-[#7A3E0E]"><SearchX size={16} aria-hidden="true" />No se encontraron resultados para «{applied}».</span>
            : <span className="rounded-xl bg-soft px-3 py-2 text-[#0A4F87]">{search.zone ? <>Mapa centrado en <strong>{search.zone.name}</strong> ({search.zone.hint}) · ubicación ilustrativa</> : <>{search.reports.length} reporte(s) coinciden con «{applied}»</>}</span>}
          <button type="button" className="btn btn-ghost !min-h-9 !px-2 text-sm" onClick={clear}>Quitar búsqueda</button>
        </div>
      )}
      <CategoryChips className="-mx-4 px-4 md:hidden" value={cat} onChange={setCat} reports={base} />
      <div className="mb-4 flex gap-4">
        <UrbiaMap
          className="card h-[calc(100dvh-60px-64px-190px)] min-h-[360px] flex-1 !rounded-2xl md:h-[calc(100vh-72px-180px)]"
          reports={visible} selectedId={sel} onSelect={setSel} flyTo={fly}
          showAvisosLegend={showAvisos} extraLayer={showAvisos ? <AvisosLayer avisos={avisos} /> : null}
          topLeft={<CategoryChips className="hidden md:flex" value={cat} onChange={setCat} reports={base} />}
          overlay={selected && <FloatingPanel report={selected} onClose={() => setSel(null)} />}
        />
        {selected && <SidePanel report={selected} onClose={() => setSel(null)} />}
      </div>
    </div>
  )
}
