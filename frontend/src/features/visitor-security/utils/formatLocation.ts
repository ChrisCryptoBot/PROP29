/**
 * Safely format location for display. API may return string or { lat, lng }.
 * React cannot render objects as children.
 */
export function formatLocationDisplay(
  location: string | { lat?: number; lng?: number; area?: string } | null | undefined
): string {
  if (location == null) return '';
  if (typeof location === 'string') return location;
  if (typeof location === 'object') {
    if ('lat' in location && 'lng' in location && typeof location.lat === 'number' && typeof location.lng === 'number') {
      return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
    }
    if ('area' in location && typeof location.area === 'string') return location.area;
  }
  return '';
}
