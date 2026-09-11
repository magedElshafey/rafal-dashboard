import { useEffect, useState } from 'react'

function isFullscreenSupported() {
  return (
    typeof document !== 'undefined' &&
    typeof document.documentElement.requestFullscreen === 'function' &&
    typeof document.exitFullscreen === 'function'
  )
}

function readFullscreenState() {
  return typeof document !== 'undefined' && document.fullscreenElement !== null
}

export function useFullscreen() {
  const isSupported = isFullscreenSupported()
  const [isFullscreen, setIsFullscreen] = useState(readFullscreenState)

  useEffect(() => {
    if (!isSupported) return

    const syncFullscreenState = () => setIsFullscreen(readFullscreenState())
    document.addEventListener('fullscreenchange', syncFullscreenState)
    syncFullscreenState()

    return () => document.removeEventListener('fullscreenchange', syncFullscreenState)
  }, [isSupported])

  const toggleFullscreen = async () => {
    if (!isSupported) return

    try {
      if (document.fullscreenElement) await document.exitFullscreen()
      else await document.documentElement.requestFullscreen()
    } catch {
      setIsFullscreen(readFullscreenState())
    }
  }

  return { isFullscreen, isSupported, toggleFullscreen }
}
