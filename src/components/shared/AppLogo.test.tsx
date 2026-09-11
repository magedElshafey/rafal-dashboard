import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import { useAuth } from '@/store/auth'
import AppLogo from './AppLogo'

describe('AppLogo', () => {
  it('keeps portal-aware navigation, stable aspect ratio, and accessible branding', () => {
    useAuth.setState({ portal: 'teacher', role: 'teacher' })
    render(
      <MemoryRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppLogo size="sm" priority />
      </MemoryRouter>
    )

    const link = screen.getByRole('link', { name: 'Smart Hub' })
    const image = screen.getByRole('img', { name: 'Smart Hub' })

    expect(link).toHaveAttribute('href', '/teacher/home')
    expect(image).toHaveAttribute('width', '135')
    expect(image).toHaveAttribute('height', '33')
    expect(image).toHaveAttribute('loading', 'eager')
    expect(image).toHaveAttribute('fetchpriority', 'high')
    expect(image).toHaveClass('h-auto', 'max-w-full', 'object-contain', 'w-[90px]')
    expect(image).not.toHaveClass('size-30')
  })

  it('assigns the intended size to every real layout consumer', () => {
    const read = (path: string) => readFileSync(resolve(process.cwd(), path), 'utf8')

    expect(read('src/modules/users/layout/navbar/UserNavbar/UserNavbar.tsx')).toContain(
      '<AppLogo size="md" priority />'
    )
    expect(read('src/modules/users/layout/footer/components/UserFooter.tsx')).toContain('<AppLogo size="lg" />')
    expect(read('src/modules/teachers/layout/sidebar/components/organism/DashboardContent.tsx')).toContain(
      '<AppLogo size="md" priority />'
    )
    expect(
      existsSync(resolve(process.cwd(), 'src/modules/users/layout/navbar/sidebar/components/UserMobileSidebar.tsx'))
    ).toBe(false)
  })
})
