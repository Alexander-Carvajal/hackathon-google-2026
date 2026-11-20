import { ArrowRight, Droplets, ExternalLink, Network, ShieldCheck, FileText, MapPinned } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CategoryChips, type CategoryFilter } from '../../components/map/CategoryChips'
import { FloatingPanel, SidePanel } from '../../components/map/SelectionPanel'
import { UrbiaMap } from '../../components/map/UrbiaMap'
import { CategoryDot } from '../../components/ui'
import { detectConnections } from '../../features/connections/detect'
import { useReports } from '../../features/reports/store'
import { AVISO_SOURCES, AVISO_TYPES, avisoDate } from '../../features/avisos/api'
import { RainCard } from '../../features/avisos/AvisosPage'
import { AvisosLayer, useAvisos, useMappableAvisos } from '../../features/avisos/AvisosProvider'
import { relativeTime } from '../../lib/format'
import { isActive } from '../../lib/rules'

function Kpi({ icon: I, value, label, hint }: { icon: typeof FileText; value: number; label: string; hint: string }) {
  return (
    <div className="card flex items-center gap-4 px-5 py-4">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-soft"><I size={21} className="text-primary-strong" aria-hidden="true" /></span>
      <div className="min-w-0">
        <p className="font-display text-[26px] font-extrabold leading-none">{value}</p>
        <p className="mt-1 text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>
    </div>
  )
}

export function HomePage() {
  const { reports } = useReports()
  const [cat, setCat] = useState<CategoryFilter>('todos')
  const [sel, setSel] = useState<string | null>(null)

  const active = useMemo(() => reports.filter(isActive), [reports])
  const visible = useMemo(() => (cat === 'todos' ? active : active.filter((r) => r.category === cat)), [active, cat])
  const kpi = {
    active: active.length,
    corroborated: reports.filter((r) => r.status === 'corroborado').length,
    zones: new Set(active.map((r) => r.zoneId)).size,
  }
  const connection = useMemo(() => detectConnections(reports)[0], [reports])
  const selected = sel ? reports.find((r) => r.id === sel) : undefined
  const { avisos } = useAvisos()
  const mapAvisos = useMappableAvisos(14)
  const latest = (avisos.data ?? []).filter((a) => a.city !== 'otra').slice(0, 3)

  return (
    <div className="flex flex-col gap-4 px-4 pt-4 md:gap-5 md:px-8 md:pt-7">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-[22px] font-extrabold leading-tight md:text-[28px]"><span className="md:hidden">Cancún hoy</span><span className="hidden md:inline">Tu ciudad, en una sola vista</span></h1>
          <p className="mt-1 hidden text-[15px] text-muted md:block">Explora incidencias cercanas y participa en su verificación.</p>
          <p className="mt-1 text-sm text-muted md:hidden"><strong className="text-navy">{kpi.active}</strong> reportes activos · <strong className="text-navy">{kpi.corroborated}</strong> corroborados</p>
        </div>
        <Link to="/mapa" className="btn btn-ghost hidden md:inline-flex">Abrir mapa completo <ArrowRight size={16} aria-hidden="true" /></Link>
      </div>

      <div className="hidden gap-4 md:grid md:grid-cols-3">
        <Kpi icon={FileText} value={kpi.active} label="Reportes activos" hint="Pendientes, en revisión o corroborados" />
        <Kpi icon={ShieldCheck} value={kpi.corroborated} label="Corroborados por vecinos" hint="Validación comunitaria, no oficial" />
        <Kpi icon={MapPinned} value={kpi.zones} label="Zonas con incidencias" hint="Zonas generales con reportes activos" />
      </div>

      <CategoryChips className="-mx-4 px-4 md:hidden" value={cat} onChange={setCat} reports={active} />

      <div className="flex gap-4">
        <UrbiaMap
          className="card h-[calc(100dvh-60px-64px-150px)] min-h-[340px] flex-1 !rounded-2xl md:h-[clamp(440px,calc(100vh-372px),680px)]"
          reports={visible} selectedId={sel} onSelect={setSel}
          showAvisosLegend={mapAvisos.length > 0} extraLayer={<AvisosLayer avisos={mapAvisos} />}
          topLeft={<CategoryChips className="hidden md:flex" value={cat} onChange={setCat} reports={active} />}
          overlay={selected && <FloatingPanel report={selected} onClose={() => setSel(null)} />}
        />
        {selected && <SidePanel report={selected} onClose={() => setSel(null)} />}
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
        <RainCard compact />
        <section className="card flex flex-col gap-3 p-4" aria-labelledby="av-home">
          <div className="flex items-center gap-2">
            <Droplets size={18} className="text-primary" aria-hidden="true" />
            <h2 id="av-home" className="text-[15px] font-bold">Últimos avisos oficiales</h2>
            <Link to="/avisos" className="btn btn-ghost ml-auto !min-h-9 !px-2 text-sm">Ver todos <ArrowRight size={15} aria-hidden="true" /></Link>
          </div>
          {avisos.status === 'loading' && !avisos.data && <p className="help">Consultando avisos oficiales…</p>}
          {avisos.status === 'error' && !avisos.data && <p className="help">No se pudieron cargar los avisos en este momento.</p>}
          <ul className="flex flex-col gap-2">
            {latest.map((a) => (
              <li key={a.key}>
                <a href={a.link} target="_blank" rel="noopener noreferrer" className="flex items-start gap-3 rounded-xl border border-line p-3 hover:bg-bg">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: AVISO_TYPES[a.type].color }} aria-hidden="true" />
                  <span className="min-w-0 flex-1"><span className="block text-[13px] font-semibold leading-snug">{a.title}</span><span className="text-xs text-muted">{AVISO_SOURCES[a.source].short} · {AVISO_TYPES[a.type].label} · {relativeTime(avisoDate(a.date))}</span></span>
                  <ExternalLink size={14} className="mt-1 shrink-0 text-muted" aria-hidden="true" />
                </a>
              </li>
            ))}
          </ul>
        </section>
      </div>

      {connection && (
        <section aria-labelledby="cx-home" className="card mb-6 flex flex-col gap-4 p-4 sm:flex-row sm:items-center md:px-5">
          <div className="flex items-center gap-2">
            {connection.categories.map((c) => <CategoryDot key={c} category={c} size={40} />)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted"><Network size={14} aria-hidden="true" /> Conexiones urbanas · {connection.zoneName}</p>
            <h2 id="cx-home" className="mt-1 text-[16px] font-bold">{connection.title}</h2>
            <p className="text-[13px] text-muted">{connection.reports.length} reportes a menos de 500 m en 7 días · <em className="not-italic font-medium text-[#7A3E0E]">Coincidencia observada; no implica causalidad.</em></p>
          </div>
          <Link to={`/analisis?cx=${connection.id}`} className="btn btn-secondary shrink-0">Explorar relación <ArrowRight size={16} aria-hidden="true" /></Link>
        </section>
      )}
    </div>
  )
}
