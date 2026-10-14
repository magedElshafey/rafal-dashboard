// Native import errors have no standardized code. Keep browser signatures narrow.
export function isChunkLoadError(error: unknown): error is Error {
  return (
    error instanceof Error &&
    ((error.name === 'TypeError' &&
      (error.message.startsWith('Failed to fetch dynamically imported module:') ||
        error.message.startsWith('error loading dynamically imported module:') ||
        error.message === 'Importing a module script failed.')) ||
      error.message.startsWith('Unable to preload CSS for '))
  )
}

const reported = new WeakSet<Error>()

export function reportChunkLoadError(error: unknown) {
  if (!isChunkLoadError(error) || reported.has(error)) return
  reported.add(error)
  // Never report full URLs, search parameters, route IDs, or error payloads.
  const asset = error.message.match(/\/assets\/([\w.-]+\.(?:js|css))(?:[?#\s]|$)/)?.[1]
  console.warn('Application chunk unavailable', {
    area: window.location.pathname.startsWith('/dashboard') ? 'dashboard' : 'public',
    asset,
    connectivity: navigator.onLine ? 'online-or-unknown' : 'offline',
  })
}

export function installChunkErrorListener() {
  const onPreloadError = (event: Event) => {
    if ('payload' in event) reportChunkLoadError(event.payload)
    // Do not preventDefault: React.lazy needs the rejection to reach the boundary.
  }
  window.addEventListener('vite:preloadError', onPreloadError)
  return () => window.removeEventListener('vite:preloadError', onPreloadError)
}

export function refreshApplication() {
  window.location.reload()
}
