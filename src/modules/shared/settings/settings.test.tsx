import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, describe, expect, it, vi } from 'vitest'
import i18n from 'i18next'

import '@/config/i18'

import env from '@/config/env'
import { USER_DROPDOWN_ITEMS_BY_ROLE } from '@/modules/users/constants/users-nav.constants'
import { UsersRoutes } from '@/modules/users/routes/routes'
import { TeachersRoutes } from '@/modules/teachers/routes/routes'
import { PrivateRoutes } from '@/routes/privateRoutes'
import DashboardContent from '@/modules/teachers/layout/sidebar/components/organism/DashboardContent'
import { useAuth } from '@/store/auth'
import { useAppLanguage } from './hooks/useAppLanguage'
import SettingsPage from './pages/SettingsPage'

function LanguageHarness() {
  const { changeLanguage } = useAppLanguage()
  return <button onClick={() => void changeLanguage('ar')}>Arabic</button>
}

function renderWithProviders(ui: React.ReactNode, queryClient = new QueryClient()) {
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={['/user/settings']}>{ui}</MemoryRouter>
    </QueryClientProvider>
  )
}

describe('shared portal settings', () => {
  afterEach(async () => {
    await i18n.changeLanguage('en')
    document.documentElement.lang = 'en'
    document.documentElement.dir = 'ltr'
    localStorage.removeItem(env.LOCALE_KEY)
    vi.restoreAllMocks()
  })

  it('registers one settings route in both portal route trees and both user roles', () => {
    expect(UsersRoutes[0].children?.some((route) => route.path === 'settings')).toBe(true)
    expect(TeachersRoutes[0].children?.some((route) => route.path === 'settings')).toBe(true)
    expect(USER_DROPDOWN_ITEMS_BY_ROLE.student.at(-1)?.path).toBe('/settings')
    expect(USER_DROPDOWN_ITEMS_BY_ROLE.parent.at(-1)?.path).toBe('/settings')
    expect((PrivateRoutes[1].element as React.ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'student',
      'parent',
    ])
    expect((PrivateRoutes[2].element as React.ReactElement<{ allowedRoles: string[] }>).props.allowedRoles).toEqual([
      'teacher',
      'admin',
      'assistant',
    ])
  })

  it('places Teacher Settings immediately before Logout', () => {
    render(
      <MemoryRouter initialEntries={['/teacher/home']}>
        <DashboardContent sidebarItems={[]} />
      </MemoryRouter>
    )

    const settings = screen.getByRole('link', { name: 'Settings' })
    const logout = screen.getByRole('button', { name: 'logout' })
    expect(settings.nextElementSibling).toBe(logout)
    expect(settings).toHaveAttribute('href', '/teacher/settings')
  })

  it('renders the shared language control and translated Arabic copy', async () => {
    useAuth.setState({ role: 'student', portal: 'user' })
    renderWithProviders(<SettingsPage />)

    expect(screen.getByRole('heading', { name: 'Settings' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'Select language' })).toHaveTextContent('English')

    await act(() => i18n.changeLanguage('ar'))
    expect(screen.getByRole('heading', { name: 'الإعدادات' })).toBeInTheDocument()
    expect(screen.getByRole('combobox', { name: 'اختر اللغة' })).toHaveTextContent('العربية')
  })

  it.each(['admin', 'assistant', 'teacher'] as const)('uses the canonical Teacher page shell for %s', (role) => {
    useAuth.setState({ role, portal: 'teacher' })
    renderWithProviders(<SettingsPage />)

    const page = screen.getByRole('region', { name: 'Settings' })
    expect(page).toHaveClass('space-y-6')
    expect(page.firstElementChild?.tagName).toBe('HEADER')
    expect(page.querySelector('[class*="max-w-"]')).not.toBeInTheDocument()
    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })

  it('persists direction and refetches only active queries without reloading', async () => {
    const queryClient = new QueryClient()
    const invalidate = vi.spyOn(queryClient, 'invalidateQueries').mockResolvedValue()
    renderWithProviders(<LanguageHarness />, queryClient)

    await userEvent.click(screen.getByRole('button', { name: 'Arabic' }))

    expect(localStorage.getItem(env.LOCALE_KEY)).toBe('ar')
    expect(document.documentElement).toHaveAttribute('lang', 'ar')
    expect(document.documentElement).toHaveAttribute('dir', 'rtl')
    expect(invalidate).toHaveBeenCalledWith({ type: 'active', refetchType: 'active' })
  })
})
