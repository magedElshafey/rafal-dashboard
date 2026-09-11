import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  forwardAddQuery: vi.fn(),
  forwardDeleteQuery: vi.fn(),
}))

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({
    forwardQuery: { sub_group_id: 'sub-1' },
    forwardAddQuery: mocks.forwardAddQuery,
    forwardDeleteQuery: mocks.forwardDeleteQuery,
  }),
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('../ui/multi-select', () => ({
  MultiSelect: ({ onClear }: { onClear: () => void }) => (
    <button type="button" onClick={onClear}>
      Clear
    </button>
  ),
}))

import FilterMultiSelect from './FilterMultiSelect'

describe('FilterMultiSelect', () => {
  it('supports an explicit atomic reset list for clear without changing non-empty selection resets', async () => {
    const user = userEvent.setup()

    render(
      <FilterMultiSelect
        name="sub_group_id"
        data={[]}
        valueKey="value"
        labelKey="label"
        resetQueryNamesOnChange={['page']}
        resetQueryNamesOnClear={['page', 'selected_student_id']}
      />
    )

    await user.click(screen.getByRole('button', { name: 'Clear' }))

    expect(mocks.forwardDeleteQuery).toHaveBeenCalledWith('sub_group_id', {
      resetQueryNames: ['page', 'selected_student_id'],
    })
    expect(mocks.forwardAddQuery).not.toHaveBeenCalled()
  })
})
