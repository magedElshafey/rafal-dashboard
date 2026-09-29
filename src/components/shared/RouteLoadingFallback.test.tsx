import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import i18n from '@/config/i18'

import { RouteLoadingFallback } from './RouteLoadingFallback'

describe('RouteLoadingFallback', () => {
  it.each([
    ['en', 'Loading page…'],
    ['ar', 'جارٍ تحميل الصفحة…'],
  ])('announces page loading once in %s and hides decorative skeletons', async (language, label) => {
    await i18n.changeLanguage(language)
    render(<RouteLoadingFallback />)

    expect(screen.getAllByRole('status')).toHaveLength(1)
    const status = screen.getByRole('status')
    expect(status).toHaveAttribute('aria-live', 'polite')
    expect(status).toHaveTextContent(label)
    expect(screen.getByText(label).closest('[aria-hidden="true"]')).toBeNull()

    const skeletons = status.querySelectorAll('[data-slot="skeleton"]')
    expect(skeletons.length).toBeGreaterThan(0)
    skeletons.forEach((skeleton) => {
      expect(skeleton.closest('[aria-hidden="true"]')).toBeInTheDocument()
    })
  })

  it('uses a content surface without a blank fixed or full-screen layer', () => {
    const { container } = render(<RouteLoadingFallback />)

    expect(screen.getByRole('main')).toHaveClass('min-w-0', 'bg-background')
    expect(container.querySelector('.bg-card')).toHaveClass('border-border')
    expect(container.querySelector('.fixed, .inset-0, .h-screen, .min-h-screen, .bg-white, .bg-black')).toBeNull()
  })
})
