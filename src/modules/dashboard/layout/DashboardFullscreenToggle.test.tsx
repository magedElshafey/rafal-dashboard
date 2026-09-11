import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'
import { DashboardFullscreenToggle } from '@/modules/dashboard/layout/DashboardFullscreenToggle'

const requestDescriptor = Object.getOwnPropertyDescriptor(document.documentElement, 'requestFullscreen')
const exitDescriptor = Object.getOwnPropertyDescriptor(document, 'exitFullscreen')
const elementDescriptor = Object.getOwnPropertyDescriptor(document, 'fullscreenElement')

let fullscreenElement: Element | null = null

function installFullscreenApi() {
  Object.defineProperty(document, 'fullscreenElement', {
    configurable: true,
    get: () => fullscreenElement,
  })
  Object.defineProperty(document.documentElement, 'requestFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      fullscreenElement = document.documentElement
      document.dispatchEvent(new Event('fullscreenchange'))
    }),
  })
  Object.defineProperty(document, 'exitFullscreen', {
    configurable: true,
    value: vi.fn(async () => {
      fullscreenElement = null
      document.dispatchEvent(new Event('fullscreenchange'))
    }),
  })
}

function restoreProperty(target: object, property: string, descriptor?: PropertyDescriptor) {
  if (descriptor) Object.defineProperty(target, property, descriptor)
  else Reflect.deleteProperty(target, property)
}

describe('DashboardFullscreenToggle', () => {
  beforeEach(async () => {
    fullscreenElement = null
    installFullscreenApi()
    await i18n.changeLanguage('en')
  })

  afterEach(() => {
    restoreProperty(document.documentElement, 'requestFullscreen', requestDescriptor)
    restoreProperty(document, 'exitFullscreen', exitDescriptor)
    restoreProperty(document, 'fullscreenElement', elementDescriptor)
  })

  it('enters, exits, and follows an external ESC fullscreen change', async () => {
    render(<DashboardFullscreenToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    expect(await screen.findByRole('button', { name: 'Exit fullscreen' })).toBeInTheDocument()

    fullscreenElement = null
    document.dispatchEvent(new Event('fullscreenchange'))
    expect(await screen.findByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))
    await screen.findByRole('button', { name: 'Exit fullscreen' })
    fireEvent.click(screen.getByRole('button', { name: 'Exit fullscreen' }))
    expect(await screen.findByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument()
  })

  it('recovers when requesting fullscreen is rejected', async () => {
    vi.mocked(document.documentElement.requestFullscreen).mockRejectedValueOnce(new Error('Denied'))
    render(<DashboardFullscreenToggle />)

    fireEvent.click(screen.getByRole('button', { name: 'Enter fullscreen' }))

    await waitFor(() => expect(screen.getByRole('button', { name: 'Enter fullscreen' })).toBeInTheDocument())
  })

  it('does not render a control when the API is unsupported', () => {
    Reflect.deleteProperty(document.documentElement, 'requestFullscreen')
    render(<DashboardFullscreenToggle />)

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })
})
