import { fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'

import '@/config/i18'
import { DashboardShell } from '@/modules/dashboard/layout/DashboardShell'
import { DASHBOARD_SIDEBAR_STORAGE_KEY } from '@/modules/dashboard/layout/sidebar.constants'

function renderShell() {
  return render(
    <MemoryRouter initialEntries={['/dashboard']}>
      <DashboardShell>
        <p>Dashboard content</p>
      </DashboardShell>
    </MemoryRouter>
  )
}

describe('DashboardShell', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('uses a valid persisted preference during the initial render', () => {
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, JSON.stringify({ collapsed: true, width: 320 }))

    renderShell()

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 64px')
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()
  })

  it('updates only the shell width during pointer movement and persists at pointer release', () => {
    renderShell()

    const shell = screen.getByTestId('dashboard-shell')
    const resizeHandle = screen.getByRole('separator', { name: 'Resize sidebar' })

    fireEvent.pointerDown(resizeHandle, { clientX: 256, pointerId: 1 })
    fireEvent.pointerMove(resizeHandle, { clientX: 306, pointerId: 1 })

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 306px')
    expect(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY)).toBeNull()

    fireEvent.pointerUp(resizeHandle, { clientX: 306, pointerId: 1 })

    expect(JSON.parse(localStorage.getItem(DASHBOARD_SIDEBAR_STORAGE_KEY) ?? '{}')).toEqual({
      collapsed: false,
      width: 306,
    })
  })

  it('collapses to a navigation rail and restores the expanded width', () => {
    renderShell()

    const shell = screen.getByTestId('dashboard-shell')
    fireEvent.click(screen.getByRole('button', { name: 'Collapse sidebar' }))

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 64px')
    expect(screen.getByRole('link', { name: 'Dashboard' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Expand sidebar' }))

    expect(shell).toHaveStyle('--dashboard-sidebar-width: 256px')
  })

  it('supports keyboard resizing within the configured bounds', () => {
    renderShell()

    const resizeHandle = screen.getByRole('separator', { name: 'Resize sidebar' })
    fireEvent.keyDown(resizeHandle, { key: 'End' })

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 360px')
    expect(resizeHandle).toHaveAttribute('aria-valuenow', '360')
  })

  it('recovers from malformed stored preferences', () => {
    localStorage.setItem(DASHBOARD_SIDEBAR_STORAGE_KEY, '{bad json')

    renderShell()

    expect(screen.getByTestId('dashboard-shell')).toHaveStyle('--dashboard-sidebar-width: 256px')
  })
})
