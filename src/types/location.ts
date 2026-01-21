export interface LocationData {
  formatted: string | null
  lat: number | null
  lon: number | null
  city: string | null
  country: string | null
  placeId: string | null
}

export interface GeoapifyFeature {
  type: 'Feature'
  properties: {
    formatted: string
    lat: number
    lon: number
    city?: string
    country?: string
    place_id: string
    category?: string
  }
  geometry: { type: 'Point'; coordinates: [number, number] }
}

export function buildGoogleMapsUrl(formatted: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formatted)}`
}

export function extractLocationData(feature: GeoapifyFeature | null): LocationData {
  if (!feature) {
    return { formatted: null, lat: null, lon: null, city: null, country: null, placeId: null }
  }
  return {
    formatted: feature.properties.formatted,
    lat: feature.properties.lat,
    lon: feature.properties.lon,
    city: feature.properties.city || null,
    country: feature.properties.country || null,
    placeId: feature.properties.place_id,
  }
}
