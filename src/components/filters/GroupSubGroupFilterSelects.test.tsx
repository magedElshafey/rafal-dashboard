import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  forwardAddQuery: vi.fn(),
  forwardDeleteQuery: vi.fn(),
}))

vi.mock('@/store/queryContext/useQueryContext', () => ({
  useQuery: () => ({
    forwardQuery: { main_group: 'main-1', sub_group: 'sub-1' },
    forwardAddQuery: mocks.forwardAddQuery,
    forwardDeleteQuery: mocks.forwardDeleteQuery,
  }),
}))
vi.mock('@/hooks/ddl/groups/useGroupSubGroupDdl', () => ({
  useGroupSubGroupDdl: () => ({
    groupId: 'main-1',
    groups: [
      { value: 'main-1', label: 'Schools' },
      { value: 'main-2', label: 'Centers' },
    ],
    subGroups: [],
    isGroupsLoading: false,
    isSubGroupsLoading: false,
  }),
}))
vi.mock('@/hooks/useRtl', () => ({ useRtl: () => ({ isRtl: false }) }))
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { dir: () => 'ltr' } }),
}))

import { GroupSubGroupFilterSelects } from './GroupSubGroupFilterSelects'
import FilterSelect from './FilterSelect'

beforeAll(() => {
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  Element.prototype.scrollIntoView = vi.fn()
})

beforeEach(() => {
  mocks.forwardAddQuery.mockReset()
  mocks.forwardDeleteQuery.mockReset()
})

describe('FilterSelect dependent reset', () => {
  it('can atomically reset opt-in dependent query params when cleared', async () => {
    const user = userEvent.setup()

    render(
      <FilterSelect
        name="main_group"
        data={[{ value: 'main-1', label: 'Schools' }]}
        valueKey="value"
        labelKey="label"
        resetQueryNamesOnChange={['sub_group']}
        resetQueryNamesOnClear
        clearLabel="Clear Main Group"
      />
    )

    await user.click(screen.getByRole('button', { name: 'Clear Main Group' }))

    expect(mocks.forwardDeleteQuery).toHaveBeenCalledTimes(1)
    expect(mocks.forwardDeleteQuery).toHaveBeenCalledWith('main_group', {
      resetQueryNames: ['sub_group'],
    })
  })
})

describe('GroupSubGroupFilterSelects initial options', () => {
  it('clears the selected subgroup when the main group changes', async () => {
    const user = userEvent.setup()
    render(
      <GroupSubGroupFilterSelects
        groupName="main_group"
        subGroupName="sub_group"
        groupLabel="Main Group"
        subGroupLabel="Subgroup"
      />
    )

    await user.click(screen.getByRole('combobox', { name: 'Main Group' }))
    await user.click(screen.getByRole('option', { name: 'Centers' }))

    expect(mocks.forwardAddQuery).toHaveBeenCalledWith({ main_group: 'main-2' }, undefined)
    expect(mocks.forwardDeleteQuery).toHaveBeenCalledWith('sub_group')
  })

  it('shows hydrated prefilter labels even before DDL responses and clears stale subgroup with Main Group', async () => {
    const user = userEvent.setup()
    render(
      <GroupSubGroupFilterSelects
        groupName="main_group"
        subGroupName="sub_group"
        groupLabel="Main Group"
        subGroupLabel="Subgroup"
        initialGroupOption={{ value: 'main-1', label: 'Schools' }}
        initialSubGroupOption={{ value: 'sub-1', label: 'Noor Schools' }}
        groupClearLabel="Clear Main Group"
        subGroupClearLabel="Clear Subgroup"
      />
    )

    expect(screen.getByRole('combobox', { name: 'Main Group' })).toHaveTextContent('Schools')
    expect(screen.getByRole('combobox', { name: 'Subgroup' })).toHaveTextContent('Noor Schools')

    await user.click(screen.getByRole('button', { name: 'Clear Main Group' }))
    expect(mocks.forwardDeleteQuery).toHaveBeenCalledWith('main_group')
    expect(mocks.forwardDeleteQuery).toHaveBeenCalledWith('sub_group')
  })
})
