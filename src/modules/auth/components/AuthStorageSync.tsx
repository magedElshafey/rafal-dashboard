import { useEffect } from 'react'

import { clearQueryClientAtAuthBoundary } from '@/lib/react-query/query-client'
import { AUTH_STORAGE_KEY, useAuth } from '@/store/auth'

type AuthState = ReturnType<typeof useAuth.getState>

function crossesAuthQueryBoundary(previous: AuthState, next: AuthState): boolean {
  if (previous.isAuthenticated !== next.isAuthenticated) {
    return true
  }

  if (!previous.isAuthenticated) {
    return false
  }

  return (
    previous.role !== next.role ||
    previous.portal !== next.portal ||
    String(previous.user?.id ?? '') !== String(next.user?.id ?? '')
  )
}

export function AuthStorageSync() {
  useEffect(() => {
    function handleStorageChange(event: StorageEvent) {
      if (event.storageArea !== localStorage) {
        return
      }

      if (event.key !== AUTH_STORAGE_KEY && event.key !== null) {
        return
      }

      const previousAuth = useAuth.getState()
      useAuth.getState().syncFromStorage()
      const nextAuth = useAuth.getState()

      if (crossesAuthQueryBoundary(previousAuth, nextAuth)) {
        clearQueryClientAtAuthBoundary()
      }
    }

    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  return null
}
