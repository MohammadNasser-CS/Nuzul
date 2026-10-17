import type { Property, Room } from '@/types'

/** Join class names, skipping falsy values. */
export function cn(...classes: (string | false | null | undefined)[]): string {
  return classes.filter(Boolean).join(' ')
}

export function formatPrice(value: number | string): string {
  const n = typeof value === 'string' ? parseFloat(value) : value
  return `₪${Math.round(n).toLocaleString()}`
}

export function getPriceRange(rooms: Room[] | undefined): { min: number; max: number } | null {
  const prices = (rooms ?? []).map((r) => parseFloat(r.price_per_bed)).filter((p) => !isNaN(p))
  if (!prices.length) return null
  return { min: Math.min(...prices), max: Math.max(...prices) }
}

export function formatDate(value: string, locale?: string): string {
  return new Date(value).toLocaleDateString(locale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function coverImageOf(property: Pick<Property, 'cover_image' | 'images'>): string | undefined {
  return (
    property.cover_image ??
    property.images?.find((i) => i.is_primary)?.image_url ??
    property.images?.[0]?.image_url
  )
}

export function initialOf(name?: string | null): string {
  return (name?.trim()?.[0] ?? '?').toUpperCase()
}
