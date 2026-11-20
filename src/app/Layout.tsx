import { Bell, Check, ChevronDown, Cloud, CloudOff, Database, Loader2, RefreshCw, Droplets, House, Map as MapIcon, List, Network, PanelLeftClose, PanelLeftOpen, Plus, Search, User, X, MapPin } from 'lucide-react'
import { useEffect, useMemo, useRef, useState, type FormEvent } from 'react'
import { Link, NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import { DemoTag } from '../components/ui'
import { useReports } from '../features/reports/store'
import { LevelPill, RewardWatcher } from '../features/rewards/RewardsUI'
import { relativeTime } from '../lib/format'

export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 rounded-xl" aria-label="URBIA Cancún, ir al inicio">
      <svg width="36" height="36" viewBox="0 0 36 36" aria-hidden="true">
        <rect width="36" height="36" rx="11" fill="#087DD9" />
        <path d="M18 27s-7-6-7-11.5a7 7 0 0 1 14 0C25 21 18 27 18 27z" fill="none" stroke="#fff" strokeWidth="2.2" />
        <circle cx="18" cy="15.5" r="2.4" fill="#fff" />
        <path d="M7 29.5c2 0 2-1.4 4-1.4s2 1.4 4 1.4 2-1.4 4-1.4 2 1.4 4 1.4 2-1.4 4-1.4" fill="none" stroke="#24B7EE" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
      {!compact && (
        <span className="flex flex-col leading-none">
          <span className="font-display text-[17px] font-extrabold tracking-[0.04em] text-navy">URBIA <span className="font-bold text-primary-strong">Cancún</span></span>
          <span className="mt-1 hidden text-[11px] font-medium text-muted sm:block">Inteligencia urbana colaborativa</span>
        </span>
      )}
    </Link>
  )
}

function useOutside(open: boolean, close: () => void) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) close() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    document.addEventListener('mousedown', onDown); document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, close])
  return ref
}

function Notifications() {
  const { reports, user } = useReports()
  const [open, setOpen] = useState(false)
  const [seen, setSeen] = useState<string[]>([])
  const ref = useOutside(open, () => setOpen(false))
  const items = useMemo(() => {
    const mine = reports.filter((r) => r.authorId === user.id).map((r) => ({ id: 'm' + r.id + r.history.length, to: `/reportes/${r.id}`, text: `Tu reporte «${r.title}» está ${r.status === 'pendiente' ? 'pendiente de confirmaciones' : 'en estado ' + r.status}`, at: r.history[r.history.length - 1].at }))
    const recent = [...reports].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 4).map((r) => ({ id: 'n' + r.id, to: `/reportes/${r.id}`, text: `Nuevo reporte cerca: ${r.title}`, at: r.createdAt }))
    return [...mine, ...recent].sort((a, b) => b.at.localeCompare(a.at)).slice(0, 5)
  }, [reports, user.id])
  const unread = items.filter((i) => !seen.includes(i.id)).length
  return (
    <div className="relative" ref={ref}>
      <button type="button" className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-line bg-white hover:bg-soft" aria-label={`Notificaciones de demostración, ${unread} sin leer`} aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <Bell size={19} />
        {unread > 0 && <span className="absolute right-2 top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary-strong px-1 text-[10px] font-bold text-white">{unread}</span>}
      </button>
      {open && (
        <div className="animate-fade absolute right-0 top-12 z-[1500] w-[min(340px,calc(100vw-24px))] rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-float)]">
          <div className="flex items-center justify-between px-2 py-1.5">
            <span className="text-sm font-bold">Notificaciones <span className="font-normal text-muted">(demo)</span></span>
            <button type="button" className="rounded-lg px-2 py-1 text-xs font-semibold text-primary-strong hover:bg-soft" onClick={() => setSeen(items.map((i) => i.id))}>Marcar como leídas</button>
          </div>
          <ul className="flex flex-col">
            {items.map((i) => (
              <li key={i.id}>
                <Link to={i.to} onClick={() => { setOpen(false); setSeen((s) => [...s, i.id]) }} className="flex gap-2.5 rounded-xl px-2 py-2.5 hover:bg-bg">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${seen.includes(i.id) ? 'bg-transparent' : 'bg-primary'}`} aria-hidden="true" />
                  <span className="flex flex-col gap-0.5"><span className="text-[13px] leading-snug">{i.text}</span><span className="text-xs text-muted">{relativeTime(i.at)}</span></span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

function CitySelector() {
  const [open, setOpen] = useState(false)
  const ref = useOutside(open, () => setOpen(false))
  return (
    <div className="relative hidden lg:block" ref={ref}>
      <button type="button" className="flex h-11 items-center gap-2 whitespace-nowrap rounded-xl border border-line bg-white px-3 text-sm font-semibold hover:bg-soft" aria-expanded={open} aria-haspopup="listbox" onClick={() => setOpen((v) => !v)}>
        <MapPin size={16} className="text-primary" aria-hidden="true" /> Cancún, Q. Roo <ChevronDown size={15} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label="Ciudad" className="animate-fade absolute right-0 top-12 z-[1500] w-64 rounded-2xl border border-line bg-white p-2 shadow-[var(--shadow-float)]">
          <li role="option" aria-selected="true" className="flex items-center justify-between rounded-xl bg-soft px-3 py-2.5 text-sm font-semibold">Cancún, Q. Roo <Check size={16} className="text-primary-strong" /></li>
          <li role="option" aria-selected="false" aria-disabled="true" className="px-3 py-2.5 text-sm text-muted">Otras ciudades: próximamente</li>
        </ul>
      )}
    </div>
  )
}

function SearchBox({ autoFocus = false, onDone }: { autoFocus?: boolean; onDone?: () => void }) {
  const nav = useNavigate()
  const [q, setQ] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (!q.trim()) return
    nav(`/mapa?q=${encodeURIComponent(q.trim())}`)
    setQ(''); onDone?.()
  }
  return (
    <form role="search" onSubmit={submit} className="relative w-full">
      <label htmlFor="global-search" className="sr-only">Buscar colonia, zona o referencia</label>
      <Search size={17} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" aria-hidden="true" />
      <input id="global-search" autoFocus={autoFocus} value={q} onChange={(e) => setQ(e.target.value)} type="search" placeholder="Buscar zona o referencia…" className="input !min-h-11 !rounded-xl !bg-bg !pl-10" />
    </form>
  )
}

const NAV = [
  { to: '/', label: 'Inicio', icon: House, end: true },
  { to: '/mapa', label: 'Mapa urbano', icon: MapIcon },
  { to: '/reportes', label: 'Reportes', icon: List },
  { to: '/avisos', label: 'Avisos', icon: Droplets },
  { to: '/datos', label: 'Datos', icon: Database },
  { to: '/analisis', label: 'Análisis', icon: Network },
]

function SideNav({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const cls = ({ isActive }: { isActive: boolean }) =>
    `flex min-h-11 items-center gap-3 rounded-xl px-3 text-[14px] font-semibold transition-colors ${isActive ? 'bg-soft text-primary-strong' : 'text-[#33506C] hover:bg-bg'} ${collapsed ? 'justify-center' : ''}`
  return (
    <nav aria-label="Navegación principal" className={`sticky top-[72px] hidden h-[calc(100vh-72px)] shrink-0 flex-col gap-1 border-r border-line bg-white p-3 md:flex ${collapsed ? 'w-[76px]' : 'w-[200px]'}`}>
      {NAV.map((n) => (
        <NavLink key={n.to} to={n.to} end={n.end} className={cls} title={collapsed ? n.label : undefined}>
          <n.icon size={19} aria-hidden="true" />{collapsed ? <span className="sr-only">{n.label}</span> : n.label}
        </NavLink>
      ))}
      <div className="mt-auto flex flex-col gap-1 border-t border-line pt-3">
        <NavLink to="/perfil" className={cls} title={collapsed ? 'Mi perfil' : undefined}><User size={19} aria-hidden="true" />{collapsed ? <span className="sr-only">Mi perfil</span> : 'Mi perfil'}</NavLink>
        <button type="button" onClick={onToggle} className={`flex min-h-11 items-center gap-3 rounded-xl px-3 text-[13px] font-medium text-muted hover:bg-bg ${collapsed ? 'justify-center' : ''}`} aria-label={collapsed ? 'Expandir navegación' : 'Contraer navegación'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <><PanelLeftClose size={18} /> Contraer</>}
        </button>
      </div>
    </nav>
  )
}

function BottomNav() {
  const { pathname } = useLocation()
  const item = (active: boolean) => `flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold ${active ? 'text-primary-strong' : 'text-[#4D6780]'}`
  return (
    <nav aria-label="Navegación inferior" className="fixed inset-x-0 bottom-0 z-[1200] flex items-end border-t border-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur md:hidden">
      <Link to="/" className={item(pathname === '/' || pathname === '/mapa')} aria-current={pathname === '/' || pathname === '/mapa' ? 'page' : undefined}><MapIcon size={22} aria-hidden="true" />Mapa</Link>
      <Link to="/reportes" className={item(pathname.startsWith('/reportes'))} aria-current={pathname.startsWith('/reportes') ? 'page' : undefined}><List size={22} aria-hidden="true" />Reportes</Link>
      <Link to="/reportar" className="flex flex-1 flex-col items-center gap-0.5 pb-1.5 text-[11px] font-bold text-primary-strong" aria-label="Crear reporte">
        <span className="-mt-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary-strong text-white shadow-[0_8px_20px_rgb(6_112_196/0.35)]"><Plus size={28} strokeWidth={2.6} aria-hidden="true" /></span>Crear
      </Link>
      <Link to="/avisos" className={item(pathname.startsWith('/avisos'))} aria-current={pathname.startsWith('/avisos') ? 'page' : undefined}><Droplets size={22} aria-hidden="true" />Avisos</Link>
      <Link to="/perfil" className={item(pathname.startsWith('/perfil'))} aria-current={pathname.startsWith('/perfil') ? 'page' : undefined}><User size={22} aria-hidden="true" />Perfil</Link>
    </nav>
  )
}

function SyncStatus() {
  const { backend, reload } = useReports()
  if (backend.kind === 'local') return null
  if (backend.status === 'connecting') return <span className="hidden items-center gap-1.5 whitespace-nowrap text-xs font-semibold text-muted lg:flex"><Loader2 size={14} className="animate-spin" aria-hidden="true" />Conectando…</span>
  if (backend.status === 'online') return <span className="hidden items-center gap-1.5 whitespace-nowrap rounded-full bg-[#E7F7EE] px-2.5 py-1 text-xs font-semibold text-[#17663A] lg:flex" title="Datos compartidos en Supabase, actualizados en tiempo real"><Cloud size={14} aria-hidden="true" />En línea</span>
  return <button type="button" onClick={reload} className="flex items-center gap-1.5 whitespace-nowrap rounded-full bg-[#FDECEC] px-2.5 py-1 text-xs font-semibold text-[#9B1C1C]" title={backend.error}><CloudOff size={14} aria-hidden="true" />Sin conexión <RefreshCw size={12} aria-hidden="true" /></button>
}

export function Footer() {
  return (
    <footer className="mt-auto border-t border-line px-4 py-4 text-xs text-muted md:px-8">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <DemoTag />
        <span>Reportes, zonas y conteos ficticios. URBIA no representa a una autoridad ni certifica incidencias.</span>
        <span>Mapa base © colaboradores de OpenStreetMap.</span>
      </div>
    </footer>
  )
}

export function Layout() {
  const { user, persistent, backend } = useReports()
  const [collapsed, setCollapsed] = useState(() => typeof window !== 'undefined' && window.innerWidth < 1280)
  const [mobileSearch, setMobileSearch] = useState(false)
  const { pathname } = useLocation()
  useEffect(() => { setMobileSearch(false) }, [pathname])
  const initials = user.alias.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#contenido" className="sr-only focus:not-sr-only focus:fixed focus:left-3 focus:top-3 focus:z-[5000] focus:rounded-lg focus:bg-white focus:px-4 focus:py-2">Saltar al contenido</a>
      <header className="sticky top-0 z-[1300] flex h-[60px] items-center gap-3 border-b border-line bg-white/95 px-4 backdrop-blur md:h-[72px] md:px-6">
        <Logo />
        <div className="ml-auto hidden w-full max-w-[340px] md:block"><SearchBox /></div>
        <CitySelector />
        <div className="hidden 2xl:block"><DemoTag /></div>
        <button type="button" className="ml-auto flex h-11 w-11 items-center justify-center rounded-xl hover:bg-soft md:hidden" aria-label="Buscar" onClick={() => setMobileSearch(true)}><Search size={20} /></button>
        <SyncStatus />
        <LevelPill />
        <Notifications />
        <Link to="/reportar" className="btn btn-primary hidden md:inline-flex"><Plus size={18} strokeWidth={2.6} aria-hidden="true" /> Crear reporte</Link>
        <Link to="/perfil" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-soft text-sm font-bold text-primary-strong" aria-label={`Perfil de ${user.alias}`}>{initials}</Link>
        {mobileSearch && (
          <div className="animate-fade absolute inset-x-0 top-0 z-10 flex h-[60px] items-center gap-2 bg-white px-3 md:hidden">
            <SearchBox autoFocus onDone={() => setMobileSearch(false)} />
            <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl hover:bg-soft" aria-label="Cerrar búsqueda" onClick={() => setMobileSearch(false)}><X size={20} /></button>
          </div>
        )}
      </header>
      {backend.kind === 'supabase' && backend.status === 'error' && <div role="alert" className="bg-[#FDECEC] px-4 py-2 text-center text-sm text-[#9B1C1C]">No se pudo conectar con la base de datos compartida: {backend.error}</div>}
      {!persistent && <div role="alert" className="bg-[#FFF6EC] px-4 py-2 text-center text-sm text-[#7A3E0E]">Tu navegador no permite guardar datos locales: los cambios se perderán al recargar.</div>}
      <div className="flex flex-1">
        <SideNav collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
        <main id="contenido" className="flex min-w-0 flex-1 flex-col pb-[calc(64px+env(safe-area-inset-bottom))] md:pb-0">
          <Outlet />
          <Footer />
        </main>
      </div>
      <BottomNav />
      <RewardWatcher />
    </div>
  )
}

