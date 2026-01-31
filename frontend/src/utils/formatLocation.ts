/**
 * Safely format location for display. API may return string or { lat, lng } or { coordinates: { lat, lng } } or { area }.
 * React cannot render objects as children.
 */
export function formatLocationDisplay(location: unknown): string {
  if (location == null) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    const o = location as Record<string, unknown>;
    if ('coordinates' in o && o.coordinates != null && typeof o.coordinates === 'object') {
      const co = o.coordinates as { lat?: number; lng?: number };
      if (typeof co.lat === 'number' && typeof co.lng === 'number') {
        return `${co.lat.toFixed(6)}, ${co.lng.toFixed(6)}`;
      }
    }
    if ('lat' in o && 'lng' in o && typeof o.lat === 'number' && typeof o.lng === 'number') {
      return `${o.lat.toFixed(6)}, ${o.lng.toFixed(6)}`;
    }
    if ('area' in o && typeof o.area === 'string') return o.area;
  }
  return '';
}
