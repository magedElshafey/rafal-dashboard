import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'

import AppLogo from './AppLogo'

describe('AppLogo', () => {
  it('links the Rafal brand to the application root', () => {
    render(<AppLogo />, { wrapper: MemoryRouter })

    expect(screen.getByRole('link', { name: 'Rafal Dashboard' })).toHaveAttribute('href', '/')
  })
})
