import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ logout: vi.fn() }))

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (key: string) => key }) }))
vi.mock('@/modules/auth/hooks/useLogout', () => ({ useLogout: () => mocks.logout }))

import { LogoutDialog } from './LogoutDialog'

describe('LogoutDialog', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('does not logout before confirmation and cancel keeps the session', async () => {
    const user = userEvent.setup()
    render(<LogoutDialog trigger={<button type="button">button.logout</button>} />)

    await user.click(screen.getByRole('button', { name: 'button.logout' }))
    expect(await screen.findByRole('alertdialog')).toBeInTheDocument()
    expect(mocks.logout).not.toHaveBeenCalled()

    await user.click(screen.getByRole('button', { name: 'auth.logout.cancel' }))
    expect(mocks.logout).not.toHaveBeenCalled()
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('calls logout exactly once and blocks duplicate confirmation while pending', async () => {
    const user = userEvent.setup()
    let resolveLogout: (() => void) | undefined
    mocks.logout.mockReturnValue(
      new Promise<void>((resolve) => {
        resolveLogout = resolve
      })
    )

    render(<LogoutDialog trigger={<button type="button">button.logout</button>} />)

    await user.click(screen.getByRole('button', { name: 'button.logout' }))
    const confirm = screen.getByRole('button', { name: 'auth.logout.confirm' })
    await user.dblClick(confirm)

    expect(mocks.logout).toHaveBeenCalledOnce()
    expect(screen.getByRole('button', { name: 'auth.logout.pending' })).toBeDisabled()
    expect(screen.getByRole('button', { name: 'auth.logout.cancel' })).toBeDisabled()

    resolveLogout?.()
  })
})
