import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

import { Button } from '@/components/ui/button'

import { DashboardPageHeader } from './DashboardPageHeader'

describe('DashboardPageHeader', () => {
  it('composes translated page copy and page-level actions', async () => {
    const user = userEvent.setup()
    const onCreate = vi.fn()

    const { container } = render(
      <DashboardPageHeader
        title="Access policies"
        intro="Administration"
        description="Manage access policies for the workspace."
        actions={<Button onClick={onCreate}>Create policy</Button>}
        aria-label="Access policies header"
      />
    )

    expect(screen.getByRole('heading', { level: 1, name: 'Access policies' })).toBeInTheDocument()
    expect(screen.getByText('Administration')).toBeInTheDocument()
    expect(screen.getByText('Manage access policies for the workspace.')).toHaveClass('text-start')
    expect(container.querySelector('header > div:last-child')).toHaveClass('w-full', 'md:w-auto')

    await user.click(screen.getByRole('button', { name: 'Create policy' }))
    expect(onCreate).toHaveBeenCalledOnce()
  })

  it('does not render empty optional copy or an actions container', () => {
    const { container } = render(<DashboardPageHeader title="Dashboard" />)

    expect(container.querySelectorAll('p')).toHaveLength(0)
    expect(container.querySelectorAll('header > div')).toHaveLength(1)
  })
})
