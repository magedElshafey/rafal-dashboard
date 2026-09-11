import { render, screen } from '@testing-library/react'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import i18n from '@/config/i18'

import FiltersWrapper from './index'

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({
    forwardQuery: null,
    forwardReplaceQueries: vi.fn(),
  }),
}))

describe('FiltersWrapper', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('en')
  })

  it('uses the translated default filter label', async () => {
    const view = render(<FiltersWrapper showSearch={false} />)

    expect(screen.getByRole('button', { name: 'Filter' })).toBeInTheDocument()

    await i18n.changeLanguage('ar')
    view.rerender(<FiltersWrapper showSearch={false} />)

    expect(screen.getByRole('button', { name: 'تصفية' })).toBeInTheDocument()
  })
})
