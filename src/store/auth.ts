import { create } from 'zustand'

import type { AppRole, AuthSession, IUser, LoginPayload, LoginResponseData } from '@/modules/auth/types/auth.types'
import { $http } from '@/utils/http'

type AuthPersistence = 'session' | 'persistent'

interface StoredAuthSession extends AuthSession {
  persistence: AuthPersistence
}

interface Actions {
  login: (data: LoginPayload) => Promise<AuthSession>
  logout: () => void
  updateUserData: (userData: Partial<IUser>) => void
  syncFromStorage: () => void
}

interface State {
  token: string | null
  role: AppRole | null
  user: IUser | null
  isAuthenticated: boolean
}

export const AUTH_STORAGE_KEY = 'rafal_auth_session'
const LEGACY_AUTH_STORAGE_KEY = 'auth_session'
const SESSION_MARKER_COOKIE = 'rafal_auth_browser_session'

const emptyAuthState: State = {
  token: null,
  role: null,
  user: null,
  isAuthenticated: false,
}

function getCookie(name: string): string | null {
  const prefix = `${encodeURIComponent(name)}=`
  const cookie = document.cookie.split('; ').find((item) => item.startsWith(prefix))
  return cookie ? decodeURIComponent(cookie.slice(prefix.length)) : null
}

function hasBrowserSessionMarker(): boolean {
  return getCookie(SESSION_MARKER_COOKIE) === '1'
}

function createBrowserSessionMarker(): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SESSION_MARKER_COOKIE}=1; Path=/; SameSite=Lax${secure}`
}

function removeBrowserSessionMarker(): void {
  const secure = window.location.protocol === 'https:' ? '; Secure' : ''
  document.cookie = `${SESSION_MARKER_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`
}

function clearStoredAuth(): void {
  localStorage.removeItem(AUTH_STORAGE_KEY)
  localStorage.removeItem(LEGACY_AUTH_STORAGE_KEY)
  removeBrowserSessionMarker()
}

function isStoredSession(value: unknown): value is StoredAuthSession {
  if (typeof value !== 'object' || value === null) return false

  const session = value as Partial<StoredAuthSession>
  const hasValidToken = typeof session.token === 'string' && session.token.trim().length > 0
  const hasValidPersistence = session.persistence === 'session' || session.persistence === 'persistent'
  const hasValidUser = typeof session.user === 'object' && session.user !== null
  const hasValidRole = session.role === null || typeof session.role === 'string'

  return hasValidToken && hasValidPersistence && hasValidUser && hasValidRole
}

function readStoredAuth(): StoredAuthSession | null {
  const rawValue = localStorage.getItem(AUTH_STORAGE_KEY)
  if (!rawValue) return null

  try {
    const parsedValue: unknown = JSON.parse(rawValue)
    if (!isStoredSession(parsedValue)) {
      clearStoredAuth()
      return null
    }
    if (parsedValue.persistence === 'session' && !hasBrowserSessionMarker()) {
      clearStoredAuth()
      return null
    }
    return parsedValue
  } catch {
    clearStoredAuth()
    return null
  }
}

function toAuthState(session: StoredAuthSession | null): State {
  if (!session) return emptyAuthState
  return { token: session.token, role: session.role, user: session.user, isAuthenticated: true }
}

function persistAuthSession(session: AuthSession, persistence: AuthPersistence): void {
  if (persistence === 'session') createBrowserSessionMarker()
  else removeBrowserSessionMarker()
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...session, persistence }))
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

    const response = await $http.post<{ data: LoginResponseData }>({
      url: '/auth/login',
      data: {
        phone: data.phone,
        password: data.password,
        remember_me: data.rememberMe ? 1 : 0,
        country_code: data.countryCode,
      },
      isFormData: false,
    })
    const responseData = response.data?.data
    if (!responseData || typeof responseData.token !== 'string' || !responseData.token.trim()) {
      throw new Error('Invalid login response')
    }

    const rawRole = responseData.user?.role ?? responseData.user?.type
    const role = typeof rawRole === 'string' ? rawRole : null
    const session: AuthSession = {
      token: responseData.token,
      role,
      user: role ? { ...responseData.user, role, type: role } : responseData.user,
    }
    persistAuthSession(session, data.rememberMe ? 'persistent' : 'session')
    set({ ...session, isAuthenticated: true })
    return session
  },

  logout() {
    clearStoredAuth()
    set(emptyAuthState)
  },

  updateUserData(userData) {
    const storedSession = readStoredAuth()
    if (!storedSession) {
      set(emptyAuthState)
      return
    }
    const user = { ...storedSession.user, ...userData }
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify({ ...storedSession, user }))
    set({ user })
  },

  syncFromStorage() {
    set(toAuthState(readStoredAuth()))
  },
}))
