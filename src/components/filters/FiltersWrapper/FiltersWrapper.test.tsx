import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'

import FiltersWrapper from './index'

const queryMocks = vi.hoisted(() => ({ forwardReplaceQueries: vi.fn() }))

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({
    forwardQuery: null,
    forwardReplaceQueries: queryMocks.forwardReplaceQueries,
  }),
}))

describe('FiltersWrapper', () => {
  beforeEach(async () => {
    vi.clearAllMocks()
    await i18n.changeLanguage('en')
  })

  it('uses the translated default filter label', async () => {
    const view = render(<FiltersWrapper showSearch={false} />)

    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()

    await i18n.changeLanguage('ar')
    view.rerender(<FiltersWrapper showSearch={false} />)

    expect(screen.getByRole('button', { name: 'تصفية' })).toBeInTheDocument()
  })

  it('keeps the draft dialog open and skips commit when Apply is vetoed', async () => {
    const user = userEvent.setup()

    render(
      <MemoryRouter>
        <FiltersWrapper showSearch={false} filterNames={['status']} dialogTitle="Filters" onApply={() => false}>
          <p>Draft filters</p>
        </FiltersWrapper>
      </MemoryRouter>
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    await user.click(screen.getByRole('button', { name: 'Apply' }))

    expect(screen.getByText('Draft filters')).toBeVisible()
    expect(queryMocks.forwardReplaceQueries).not.toHaveBeenCalled()
  })
})
