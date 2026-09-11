import { useSyncExternalStore } from 'react'

const DESKTOP_QUERY = '(min-width: 768px)'

function subscribe(callback: () => void) {
  if (typeof window.matchMedia !== 'function') return () => undefined

  const mediaQuery = window.matchMedia(DESKTOP_QUERY)
  mediaQuery.addEventListener('change', callback)
  return () => mediaQuery.removeEventListener('change', callback)
}

function getSnapshot() {
  return typeof window.matchMedia !== 'function' || window.matchMedia(DESKTOP_QUERY).matches
}

export function useIsDesktop() {
  return useSyncExternalStore(subscribe, getSnapshot, () => true)
}
