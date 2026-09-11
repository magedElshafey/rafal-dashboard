import { fireEvent, render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it } from 'vitest'

import env from '@/config/env'
import { ThemeProvider, useTheme } from '@/components/theme/ThemeProvider'

function ThemeProbe() {
  const { theme, toggleTheme } = useTheme()
  return <button onClick={toggleTheme}>{theme}</button>
}

describe('ThemeProvider', () => {
  beforeEach(() => {
    localStorage.clear()
    document.documentElement.classList.remove('dark')
  })

  it('defaults to dark and persists a light preference when toggled', () => {
    render(
      <ThemeProvider>
        <ThemeProbe />
      </ThemeProvider>
    )

    expect(screen.getByRole('button', { name: 'dark' })).toBeInTheDocument()
    expect(document.documentElement).toHaveClass('dark')

    fireEvent.click(screen.getByRole('button', { name: 'dark' }))

    expect(screen.getByRole('button', { name: 'light' })).toBeInTheDocument()
    expect(document.documentElement).not.toHaveClass('dark')
    expect(localStorage.getItem(env.THEME_KEY)).toBe('light')
  })
})
