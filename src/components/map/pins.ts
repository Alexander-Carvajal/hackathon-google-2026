import L from 'leaflet'
import { CATEGORIES } from '../../data/categories'
import type { CategoryId } from '../../types'

// Trazos simplificados de los iconos Lucide para usarlos dentro de un divIcon de Leaflet
const GLYPH: Record<CategoryId, string> = {
  bache: '<path d="M12 3 4.5 20h15z"/><path d="M7.6 14h8.8"/><path d="M9.7 9h4.6"/>',
  agua: '<path d="M18.7 13.2C18.3 11.9 17.4 10.6 16 9.5c-2-1.6-3.5-4-4-6.5a10.7 10.7 0 0 1-.9 2.6"/><path d="m2 2 20 20"/><path d="M8.8 8.8A11 11 0 0 1 8 9.5C6 11.1 5 13 5 15a7 7 0 0 0 13.2 3.2"/>',
  inundacion: '<path d="M2 6c.6.5 1.2 1 2.5 1C7 7 7 5 9.5 5c2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 12c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/><path d="M2 18c.6.5 1.2 1 2.5 1 2.5 0 2.5-2 5-2 2.6 0 2.4 2 5 2 2.5 0 2.5-2 5-2 1.3 0 1.9.5 2.5 1"/>',
}

export function pinSvg(category: CategoryId, size = 34): string {
  const c = CATEGORIES[category].color
  return `<svg width="${size}" height="${Math.round(size * 1.2)}" viewBox="0 0 34 41" aria-hidden="true">
    <path d="M17 40s14-12.6 14-24A14 14 0 0 0 3 16c0 11.4 14 24 14 24z" fill="${c}" stroke="#fff" stroke-width="2.5"/>
    <g transform="translate(9 8) scale(0.667)" fill="none" stroke="#fff" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${GLYPH[category]}</g>
  </svg>`
}

const cache = new Map<string, L.DivIcon>()
export function pinIcon(category: CategoryId, selected = false): L.DivIcon {
  const key = category + selected
  const hit = cache.get(key)
  if (hit) return hit
  const icon = L.divIcon({ className: `urbia-pin${selected ? ' is-selected' : ''}`, html: pinSvg(category), iconSize: [34, 41], iconAnchor: [17, 40] })
  cache.set(key, icon)
  return icon
}

export const draftPinIcon = L.divIcon({
  className: 'urbia-pin',
  html: `<svg width="38" height="46" viewBox="0 0 34 41" aria-hidden="true"><path d="M17 40s14-12.6 14-24A14 14 0 0 0 3 16c0 11.4 14 24 14 24z" fill="#0C3159" stroke="#fff" stroke-width="2.5"/><circle cx="17" cy="16" r="5" fill="#24B7EE"/></svg>`,
  iconSize: [38, 46], iconAnchor: [19, 45],
})

export const userIcon = L.divIcon({ className: 'urbia-user', html: '<span></span>', iconSize: [18, 18], iconAnchor: [9, 9] })

export function clusterIcon(cluster: { getChildCount: () => number }): L.DivIcon {
  return L.divIcon({ className: 'urbia-cluster', html: `<span>${cluster.getChildCount()}</span>`, iconSize: [40, 40] })
}
