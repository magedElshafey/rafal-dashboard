import { afterEach, beforeEach, describe, expect, it } from 'vitest'

import {
  consumeMeetingStartIntent,
  storeMeetingStartIntent,
} from '@/modules/shared/meeting/coordination/meeting-start-intent-vault'
import { ZOOM_MEETING_LOCAL_STORAGE_KEYS } from '@/modules/shared/meeting/credentials/meeting-storage-cleanup'
import { AUTH_STORAGE_KEY, useAuth } from '@/store/auth'

const emptyAuthState = {
  token: null,
  role: null,
  portal: null,
  user: null,
  isAuthenticated: false,
} as const

describe('auth meeting credential cleanup', () => {
  beforeEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuth.setState(emptyAuthState)
  })

  afterEach(() => {
    localStorage.clear()
    sessionStorage.clear()
    useAuth.setState(emptyAuthState)
  })

  it('clears stale Zoom meeting storage on logout', () => {
    localStorage.setItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0], 'obsolete-sdk-meeting-state')

    useAuth.getState().logout()

    expect(localStorage.getItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0])).toBeNull()
    expect(useAuth.getState()).toMatchObject(emptyAuthState)
  })

  it('restores the exact persistent WebView auth shape without disturbing shared Zoom storage', () => {
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: 'bearer-token',
        role: 'student',
        portal: 'user',
        persistence: 'persistent',
        user: { id: 'student-1', name: 'Student', role: 'student' },
      })
    )
    localStorage.setItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0], 'active-sdk-meeting-state')
    sessionStorage.setItem('ZWFzeS0xMjM0', 'stale-tab-meeting-state')
    storeMeetingStartIntent('session-1', 'subject-1')

    useAuth.getState().syncFromStorage()

    expect(useAuth.getState()).toMatchObject({
      token: 'bearer-token',
      role: 'student',
      portal: 'user',
      isAuthenticated: true,
    })
    expect(localStorage.getItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0])).toBe('active-sdk-meeting-state')
    expect(sessionStorage.getItem('ZWFzeS0xMjM0')).toBeNull()
    expect(consumeMeetingStartIntent('session-1', 'subject-1')).toBe(false)
  })

  it('clears Zoom meeting storage when synchronized auth changes identity', () => {
    useAuth.setState({
      token: 'old-token',
      role: 'student',
      portal: 'user',
      user: {
        id: 'student-1',
        name: 'Student One',
        role: 'student',
        phone: null,
        group: { id: 'group-1', name: 'A', parent: { id: 'parent-1', name: 'Grade 1' } },
      },
      isAuthenticated: true,
    })
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: 'new-token',
        role: 'student',
        portal: 'user',
        persistence: 'persistent',
        user: { id: 'student-2', name: 'Student Two', role: 'student' },
      })
    )
    localStorage.setItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0], 'obsolete-sdk-meeting-state')
    sessionStorage.setItem('em9vbS1zdG9yYWdlLTEyMzQ=', 'obsolete-tab-meeting-state')

    useAuth.getState().syncFromStorage()

    expect(useAuth.getState().user?.id).toBe('student-2')
    expect(localStorage.getItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0])).toBeNull()
    expect(sessionStorage.getItem('em9vbS1zdG9yYWdlLTEyMzQ=')).toBeNull()
  })

  it('preserves shared Zoom storage for a same-identity profile synchronization', () => {
    const currentUser = {
      id: 'student-1',
      name: 'Student One',
      role: 'student' as const,
      phone: null,
      group: { id: 'group-1', name: 'A', parent: { id: 'parent-1', name: 'Grade 1' } },
    }
    useAuth.setState({
      token: 'old-token',
      role: 'student',
      portal: 'user',
      user: currentUser,
      isAuthenticated: true,
    })
    localStorage.setItem(
      AUTH_STORAGE_KEY,
      JSON.stringify({
        token: 'refreshed-token',
        role: 'student',
        portal: 'user',
        persistence: 'persistent',
        user: { ...currentUser, name: 'Updated Student' },
      })
    )
    localStorage.setItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0], 'active-sdk-meeting-state')
    sessionStorage.setItem('ZWFzeS0xMjM0', 'active-tab-meeting-state')

    useAuth.getState().syncFromStorage()

    expect(useAuth.getState().user?.name).toBe('Updated Student')
    expect(localStorage.getItem(ZOOM_MEETING_LOCAL_STORAGE_KEYS[0])).toBe('active-sdk-meeting-state')
    expect(sessionStorage.getItem('ZWFzeS0xMjM0')).toBe('active-tab-meeting-state')
  })
})
