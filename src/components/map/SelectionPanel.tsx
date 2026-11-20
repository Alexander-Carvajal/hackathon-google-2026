import { ArrowRight, Camera, ChevronDown, ChevronUp, MapPin, Users, X } from 'lucide-react'
import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { zoneById } from '../../data/zones'
import { CorroborateButton } from '../../features/reports/actions'
import { relativeTime, plural } from '../../lib/format'
import { confirmationsOf, evidenceOf } from '../../lib/rules'
import type { Report } from '../../types'
import { CategoryTag, StatusBadge } from '../ui'

function Body({ report, expanded }: { report: Report; expanded: boolean }) {
  const zone = zoneById(report.zoneId)
  return (
    <>
      <div className="flex flex-wrap items-center gap-2"><StatusBadge status={report.status} long /></div>
      <h2 className="text-[17px] font-bold leading-snug">{report.title}</h2>
      <dl className="flex flex-col gap-1.5 text-[13px] text-muted">
        <div className="flex items-start gap-2"><MapPin size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><dd>{zone?.name} · ubicación aproximada</dd></div>
        <div className="flex items-start gap-2"><Users size={15} className="mt-0.5 shrink-0" aria-hidden="true" /><dd><strong className="text-navy">{plural(confirmationsOf(report), 'confirmación', 'confirmaciones')}</strong> · {plural(evidenceOf(report), 'evidencia', 'evidencias')}</dd></div>
        <dd className="pl-[23px]">Publicado {relativeTime(report.createdAt)} · Ciudadanía (demo)</dd>
      </dl>
      {expanded && (
        <>
          {report.photo
            ? <img src={report.photo} alt={`Evidencia del reporte: ${report.title}`} className="h-36 w-full rounded-xl object-cover" />
            : <div className="flex h-20 items-center justify-center gap-2 rounded-xl bg-bg text-xs text-muted"><Camera size={15} aria-hidden="true" />Sin fotografía en esta demo</div>}
          <p className="text-sm leading-relaxed text-[#29435E]">{report.description}</p>
        </>
      )}
    </>
  )
}

function Actions({ report }: { report: Report }) {
  return (
    <div className="grid grid-cols-2 gap-2">
      <Link to={`/reportes/${report.id}`} className="btn btn-secondary">Ver detalle <ArrowRight size={16} aria-hidden="true" /></Link>
      <CorroborateButton report={report} compact />
    </div>
  )
}

/** Panel lateral de escritorio (≥1024 px). */
export function SidePanel({ report, onClose }: { report: Report; onClose: () => void }) {
  return (
    <aside aria-label="Reporte seleccionado" className="animate-fade card hidden w-[330px] shrink-0 flex-col gap-3 self-stretch overflow-y-auto p-5 lg:flex">
      <div className="flex items-center justify-between gap-2">
        <CategoryTag category={report.category} />
        <button type="button" className="btn btn-ghost h-10 w-10 !min-h-0 !p-0" aria-label="Cerrar panel del reporte" onClick={onClose}><X size={18} /></button>
      </div>
      <Body report={report} expanded />
      <div className="mt-auto pt-2"><Actions report={report} /></div>
      <p className="text-[11px] text-muted">La corroboración es comunitaria; no equivale a validación oficial.</p>
    </aside>
  )
}

/** Drawer flotante (768–1023 px) o bottom sheet (móvil). Se monta dentro del mapa. */
export function FloatingPanel({ report, onClose }: { report: Report; onClose: () => void }) {
  const [expanded, setExpanded] = useState(false)
  const startY = useRef<number | null>(null)
  return (
    <div className="lg:hidden">
      <section aria-label="Reporte seleccionado"
        className="animate-sheet fixed inset-x-0 bottom-[calc(64px+env(safe-area-inset-bottom))] z-[1100] flex max-h-[70vh] flex-col gap-3 overflow-y-auto rounded-t-3xl border border-line bg-white px-5 pb-5 pt-2 shadow-[var(--shadow-float)] md:absolute md:inset-x-auto md:bottom-auto md:right-16 md:top-3 md:w-[320px] md:max-h-[calc(100%-24px)] md:rounded-2xl md:pt-5"
        onTouchStart={(e) => { startY.current = e.touches[0].clientY }}
        onTouchEnd={(e) => {
          if (startY.current == null) return
          const dy = e.changedTouches[0].clientY - startY.current
          if (dy < -40) setExpanded(true)
          else if (dy > 60) { if (expanded) setExpanded(false); else onClose() }
          startY.current = null
        }}>
        <span className="mx-auto mb-1 h-1.5 w-10 rounded-full bg-[#C9DDEC] md:hidden" aria-hidden="true" />
        <div className="flex items-center justify-between gap-2">
          <CategoryTag category={report.category} />
          <button type="button" className="btn btn-ghost h-10 w-10 !min-h-0 !p-0" aria-label="Cerrar panel del reporte" onClick={onClose}><X size={18} /></button>
        </div>
        <Body report={report} expanded={expanded} />
        <button type="button" className="btn btn-ghost !min-h-9 self-start !px-2 text-[13px]" aria-expanded={expanded} onClick={() => setExpanded((v) => !v)}>
          {expanded ? <>Ver menos <ChevronDown size={15} /></> : <>Ver más <ChevronUp size={15} /></>}
        </button>
        <Actions report={report} />
      </section>
    </div>
  )
}
