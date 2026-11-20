import L from 'leaflet'
import { ChevronDown, ChevronUp, LocateFixed, Minus, Plus, WifiOff, Loader2 } from 'lucide-react'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { Circle, MapContainer, Marker, TileLayer, useMap, useMapEvents } from 'react-leaflet'
import MarkerClusterGroup from 'react-leaflet-cluster'
import { CATEGORIES, CATEGORY_IDS } from '../../data/categories'
import { CANCUN_CENTER, CANCUN_ZOOM } from '../../data/zones'
import { inCancunArea } from '../../lib/geo'
import type { Report } from '../../types'
import { useToast } from '../ui/Toast'
import { clusterIcon, draftPinIcon, pinIcon, pinSvg, userIcon } from './pins'

export const TILE_URL = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
export const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright">Colaboradores de OpenStreetMap</a>'

export interface FlyTarget { lat: number; lng: number; zoom: number; key: number }

/** Ajusta el tamaño del mapa cuando su contenedor cambia (panel contextual que se abre o cierra). */
function AutoResize() {
  const map = useMap()
  useEffect(() => {
    const el = map.getContainer()
    const ro = new ResizeObserver(() => map.invalidateSize())
    ro.observe(el)
    return () => ro.disconnect()
  }, [map])
  return null
}

function FlyTo({ target }: { target?: FlyTarget | null }) {
  const map = useMap()
  useEffect(() => { if (target) map.flyTo([target.lat, target.lng], target.zoom, { duration: 0.8 }) }, [target, map])
  return null
}

function BackgroundClick({ onClick }: { onClick: () => void }) {
  useMapEvents({ click: onClick })
  return null
}

type TileState = 'loading' | 'ok' | 'error'

function useTileState() {
  const [state, setState] = useState<TileState>('loading')
  const [errors, setErrors] = useState(0)
  const handlers = useMemo(() => ({
    // Leaflet emite «load» aunque los mosaicos fallen; solo un mosaico cargado confirma el mapa base.
    tileload: () => setState('ok'),
    tileerror: () => setErrors((n) => n + 1),
  }), [])
  useEffect(() => { if (errors >= 4 && state !== 'ok') setState('error') }, [errors, state])
  useEffect(() => { const t = setTimeout(() => setState((s) => (s === 'loading' ? 'error' : s)), 12000); return () => clearTimeout(t) }, [])
  return { state, handlers }
}

function TileStatus({ state }: { state: TileState }) {
  if (state === 'ok') return null
  return (
    <div className="pointer-events-none absolute inset-x-0 top-1/2 z-[500] flex -translate-y-1/2 justify-center px-4" role="status">
      <div className="pointer-events-auto flex max-w-sm items-start gap-3 rounded-xl bg-white/95 px-4 py-3 text-sm shadow-[var(--shadow-float)]">
        {state === 'loading'
          ? <><Loader2 size={18} className="mt-0.5 animate-spin text-primary" aria-hidden="true" /><span>Cargando mapa base de OpenStreetMap…</span></>
          : <><WifiOff size={18} className="mt-0.5 shrink-0 text-[#B45309]" aria-hidden="true" /><span><strong>No se pudo cargar el mapa base.</strong> Revisa tu conexión a internet. Los reportes siguen disponibles en el listado.</span></>}
      </div>
    </div>
  )
}

function MapButtons({ map, onLocated }: { map: L.Map | null; onLocated: (p: { lat: number; lng: number; acc: number }) => void }) {
  const toast = useToast()
  const [busy, setBusy] = useState(false)
  const locate = () => {
    if (!('geolocation' in navigator)) { toast('Tu navegador no permite geolocalización.', 'warn'); return }
    setBusy(true)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setBusy(false)
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude, acc: pos.coords.accuracy }
        onLocated(p)
        if (!inCancunArea(p.lat, p.lng)) toast('Tu ubicación está fuera del área de Cancún que cubre esta demostración.', 'info')
        map?.flyTo([p.lat, p.lng], 15)
      },
      (err) => { setBusy(false); toast(err.code === 1 ? 'Permiso de ubicación denegado. Puedes seguir usando el mapa sin él.' : 'No se pudo obtener tu ubicación.', 'warn') },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }
  const base = 'flex h-11 w-11 items-center justify-center bg-white text-navy hover:bg-soft disabled:opacity-60'
  return (
    <div className="absolute right-3 top-3 z-[600] flex flex-col gap-2">
      <div className="flex flex-col overflow-hidden rounded-xl border border-line shadow-[var(--shadow-soft)]">
        <button type="button" className={base} aria-label="Acercar" onClick={() => map?.zoomIn()}><Plus size={18} /></button>
        <span className="h-px bg-line" aria-hidden="true" />
        <button type="button" className={base} aria-label="Alejar" onClick={() => map?.zoomOut()}><Minus size={18} /></button>
      </div>
      <button type="button" className={`${base} rounded-xl border border-line shadow-[var(--shadow-soft)]`} aria-label="Mostrar mi ubicación" onClick={locate} disabled={busy}>
        {busy ? <Loader2 size={18} className="animate-spin" /> : <LocateFixed size={18} />}
      </button>
    </div>
  )
}

export function Legend({ className = '', avisos = false }: { className?: string; avisos?: boolean }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`absolute bottom-7 left-3 z-[600] rounded-xl border border-line bg-white/95 shadow-[var(--shadow-soft)] ${className}`}>
      <button type="button" className="flex min-h-10 items-center gap-2 px-3 text-xs font-semibold" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        Leyenda {open ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
      </button>
      {open && (
        <ul className="flex flex-col gap-2 px-3 pb-3 text-xs">
          {CATEGORY_IDS.map((c) => (
            <li key={c} className="flex items-center gap-2"><span dangerouslySetInnerHTML={{ __html: pinSvg(c, 18) }} />{CATEGORIES[c].label}</li>
          ))}
          <li className="flex items-center gap-2"><span className="flex h-[22px] w-[22px] items-center justify-center rounded-full border-2 border-sky bg-white text-[10px] font-bold">3</span>Grupo de reportes cercanos</li>
          {avisos && <li className="flex items-center gap-2"><span className="inline-block h-[14px] w-[14px] rotate-45 rounded-[4px] border-2 border-white bg-[#DC2626] shadow" aria-hidden="true" />Aviso oficial: Aguakan o Gobierno del Estado (ubicación inferida)</li>}
          <li className="text-muted">Puntos aproximados · datos de demostración</li>
        </ul>
      )}
    </div>
  )
}

interface Props {
  reports: Report[]
  selectedId: string | null
  onSelect: (id: string | null) => void
  flyTo?: FlyTarget | null
  topLeft?: ReactNode
  overlay?: ReactNode
  className?: string
  cluster?: boolean
  /** Capas adicionales dentro del mapa (p. ej. avisos oficiales) */
  extraLayer?: ReactNode
  showAvisosLegend?: boolean
}

export function UrbiaMap({ reports, selectedId, onSelect, flyTo, topLeft, overlay, className = '', cluster = true, extraLayer, showAvisosLegend = false }: Props) {
  const [map, setMap] = useState<L.Map | null>(null)
  const [me, setMe] = useState<{ lat: number; lng: number; acc: number } | null>(null)
  const tiles = useTileState()

  const markers = reports.map((r) => (
    <Marker key={r.id} position={[r.lat, r.lng]} icon={pinIcon(r.category, r.id === selectedId)}
      title={`${CATEGORIES[r.category].label}: ${r.title}`} alt={`${CATEGORIES[r.category].label}: ${r.title}`}
      keyboard zIndexOffset={r.id === selectedId ? 1000 : 0}
      eventHandlers={{ click: () => onSelect(r.id), keypress: (e) => { if ((e.originalEvent as KeyboardEvent).key === 'Enter') onSelect(r.id) } }} />
  ))

  return (
    <div className={`relative isolate overflow-hidden ${className}`}>
      <MapContainer ref={setMap} center={CANCUN_CENTER} zoom={CANCUN_ZOOM} zoomControl={false} className="h-full w-full" attributionControl>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} eventHandlers={tiles.handlers} />
        <AutoResize />
        <FlyTo target={flyTo} />
        <BackgroundClick onClick={() => onSelect(null)} />
        {cluster
          ? <MarkerClusterGroup chunkedLoading maxClusterRadius={45} iconCreateFunction={clusterIcon} showCoverageOnHover={false}>{markers}</MarkerClusterGroup>
          : markers}
        {extraLayer}
        {me && <><Circle center={[me.lat, me.lng]} radius={Math.min(me.acc, 500)} pathOptions={{ color: '#087DD9', weight: 1, fillOpacity: 0.08 }} /><Marker position={[me.lat, me.lng]} icon={userIcon} title="Tu ubicación aproximada" /></>}
      </MapContainer>
      {topLeft && <div className="pointer-events-none absolute left-3 right-16 top-3 z-[600]"><div className="pointer-events-auto">{topLeft}</div></div>}
      <MapButtons map={map} onLocated={setMe} />
      <Legend avisos={showAvisosLegend} />
      <TileStatus state={tiles.state} />
      {overlay}
    </div>
  )
}

function Picker({ onPick }: { onPick: (p: { lat: number; lng: number }) => void }) {
  useMapEvents({ click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }) })
  return null
}

/** Mapa pequeño para elegir un punto (formulario). */
export function PickMap({ value, onChange, className = '' }: { value: { lat: number; lng: number } | null; onChange: (p: { lat: number; lng: number }) => void; className?: string }) {
  const tiles = useTileState()
  return (
    <div className={`relative isolate overflow-hidden rounded-xl border border-line ${className}`}>
      <MapContainer center={value ? [value.lat, value.lng] : CANCUN_CENTER} zoom={value ? 15 : 12} className="h-full w-full">
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} eventHandlers={tiles.handlers} />
        <AutoResize />
        <Picker onPick={onChange} />
        {value && <FlyTo target={{ lat: value.lat, lng: value.lng, zoom: 15, key: value.lat + value.lng }} />}
        {value && <Marker position={[value.lat, value.lng]} icon={draftPinIcon} draggable title="Punto del reporte (arrástralo para ajustar)"
          eventHandlers={{ dragend: (e) => { const ll = (e.target as L.Marker).getLatLng(); onChange({ lat: ll.lat, lng: ll.lng }) } }} />}
      </MapContainer>
      <TileStatus state={tiles.state} />
    </div>
  )
}

/** Mapa estático del detalle: punto aproximado con círculo de precisión. */
export function MiniMap({ report, className = '' }: { report: Report; className?: string }) {
  const tiles = useTileState()
  return (
    <div className={`relative isolate overflow-hidden rounded-xl border border-line ${className}`}>
      <MapContainer center={[report.lat, report.lng]} zoom={15} className="h-full w-full" dragging={false} scrollWheelZoom={false} doubleClickZoom={false} touchZoom={false} keyboard={false} zoomControl={false}>
        <TileLayer url={TILE_URL} attribution={TILE_ATTRIBUTION} eventHandlers={tiles.handlers} />
        <AutoResize />
        <Circle center={[report.lat, report.lng]} radius={report.accuracyM} pathOptions={{ color: CATEGORIES[report.category].color, weight: 1.5, fillOpacity: 0.12 }} />
        <Marker position={[report.lat, report.lng]} icon={pinIcon(report.category)} interactive={false} />
      </MapContainer>
      <TileStatus state={tiles.state} />
    </div>
  )
}
