export const OPENFREEMAP_LIBERTY_STYLE_URL = 'https://tiles.openfreemap.org/styles/liberty'

export const SAUDI_ARABIA_MAP_BOUNDS = [
  [32, 14],
  [58, 34],
] as const

export const SAUDI_ARABIA_DEFAULT_VIEW = {
  center: [45.0792, 23.8859] as const,
  zoom: 4,
} as const

export const SAUDI_ARABIA_MIN_ZOOM = 4

export function getSaudiArabiaMapOptions() {
  return {
    center: [...SAUDI_ARABIA_DEFAULT_VIEW.center] as [number, number],
    zoom: SAUDI_ARABIA_DEFAULT_VIEW.zoom,
    minZoom: SAUDI_ARABIA_MIN_ZOOM,
    maxBounds: SAUDI_ARABIA_MAP_BOUNDS.map((coordinate) => [...coordinate]) as [[number, number], [number, number]],
    renderWorldCopies: false,
  }
}

export function resolveMapStyleUrl(configuredUrl: string | undefined, isDevelopment: boolean) {
  const normalizedUrl = configuredUrl?.trim()
  if (normalizedUrl) return normalizedUrl
  return isDevelopment ? OPENFREEMAP_LIBERTY_STYLE_URL : ''
}
