import { render, screen } from '@testing-library/react'
import { FormProvider, useForm } from 'react-hook-form'
import { describe, expect, it, vi } from 'vitest'

import { GroupSubGroupMultiSelects } from './GroupSubGroupMultiSelects'

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

vi.mock('@/hooks/ddl/groups/useGroupSubGroupMultiDdl', () => ({
  useGroupSubGroupMultiDdl: () => ({
    groupIds: [],
    groups: [],
    subGroups: [],
    isGroupsLoading: false,
    isGroupsError: false,
    refetchGroups: vi.fn(),
    isSubGroupsLoading: false,
    isSubGroupsError: false,
    refetchSubGroups: vi.fn(),
    isSubGroupDisabled: true,
  }),
}))

vi.mock('@/components/form/FormMultiSelect', () => ({
  FormMultiSelect: ({ name, required }: { name: string; required?: boolean }) => (
    <div data-testid={name} data-required={String(required)} />
  ),
}))

type Values = { main_groups: string[]; sub_groups: string[] }

function FieldsHarness() {
  const form = useForm<Values>({ defaultValues: { main_groups: [], sub_groups: [] } })

  return (
    <FormProvider {...form}>
      <GroupSubGroupMultiSelects<Values>
        groupName="main_groups"
        subGroupName="sub_groups"
        groupRequired
        subGroupRequired={false}
      />
    </FormProvider>
  )
}

describe('GroupSubGroupMultiSelects', () => {
  it('supports independent required indicators for group and subgroup fields', () => {
    render(<FieldsHarness />)

    expect(screen.getByTestId('main_groups')).toHaveAttribute('data-required', 'true')
    expect(screen.getByTestId('sub_groups')).toHaveAttribute('data-required', 'false')
  })
})
