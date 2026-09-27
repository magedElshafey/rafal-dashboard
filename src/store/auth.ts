import { create } from 'zustand'

import { loginRequest } from '@/modules/auth/service/login.service'
import type { AuthAdmin, AuthSession, LoginPayload } from '@/modules/auth/types/auth.types'

interface Actions {
  login: (data: LoginPayload) => Promise<AuthSession>
  logout: () => void
  syncFromStorage: () => void
}

interface State {
  token: string | null
  admin: AuthAdmin | null
  isAuthenticated: boolean
}

export const AUTH_STORAGE_KEY = 'rafal_auth_session'
const LEGACY_AUTH_STORAGE_KEY = 'auth_session'

const emptyAuthState: State = {
  token: null,
  admin: null,
  isAuthenticated: false,
}

function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
}

function isStoredSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false

  const session = value as Partial<AuthSession>
  const hasValidToken = typeof session.token === 'string' && session.token.trim().length > 0
  const admin = session.admin as Partial<AuthAdmin> | undefined
  const hasValidAdmin =
    typeof admin?.id === 'number' &&
    typeof admin.name === 'string' &&
    typeof admin.email === 'string' &&
    Array.isArray(admin.roles) &&
    admin.roles.every((role) => typeof role === 'string')

  return hasValidToken && hasValidAdmin
}

function readStoredAuth(): AuthSession | null {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return null

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    if (!isStoredSession(parsedValue)) {
      clearStoredAuth()
      return null
    }
    return parsedValue
  } catch {
    clearStoredAuth()
    return null
  }
}

function toAuthState(session: AuthSession | null): State {
  if (!session) return emptyAuthState
  return { token: session.token, admin: session.admin, isAuthenticated: true }
}

function persistAuthSession(session: AuthSession): void {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session))
}

function getInitialAuthState(): State {
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
  return toAuthState(readStoredAuth())
}

export const useAuth = create<State & Actions>((set, get) => ({
  ...getInitialAuthState(),

  async login(data) {
    if (get().isAuthenticated || readStoredAuth()) {
      throw new Error('You are already logged in. Please log out before signing in with another account.')
    }

    const responseData = await loginRequest(data)
    if (!responseData || typeof responseData.token !== 'string' || !responseData.token.trim()) {
      throw new Error('Invalid login response')
    }

    const session: AuthSession = {
      token: responseData.token,
      admin: {
        id: responseData.admin.id,
        name: responseData.admin.name,
        email: responseData.admin.email,
        roles: responseData.admin.roles,
      },
    }
    persistAuthSession(session)
    set({ ...session, isAuthenticated: true })
    return session
  },

  logout() {
    clearStoredAuth()
    set(emptyAuthState)
  },

  syncFromStorage() {
    set(toAuthState(readStoredAuth()))
  },
}))
