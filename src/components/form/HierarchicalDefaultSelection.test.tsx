import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { FormProvider, useForm, useFormContext, useWatch } from 'react-hook-form'
import { beforeEach, describe, expect, it, vi } from 'vitest'

import { GroupSubGroupMultiSelects } from './GroupSubGroupMultiSelects'
import { StudentsBySubGroupsMultiSelect } from './StudentsBySubGroupsMultiSelect'
import { useHierarchicalDefaultSelection } from './useHierarchicalDefaultSelection'

const ddlState = vi.hoisted(() => ({
  isGroupsFetching: false,
  isSubGroupsFetching: false,
  isStudentsFetching: false,
}))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}))

const groups = [
  { value: 'a', label: 'A' },
  { value: 'b', label: 'B' },
]
const subGroupsByGroup = {
  a: [
    { value: 'a1', label: 'A1' },
    { value: 'a2', label: 'A2' },
  ],
  b: [{ value: 'b1', label: 'B1' }],
}
const studentsBySubGroup = {
  a1: [
    { value: 's1', label: 'S1' },
    { value: 's2', label: 'S2' },
  ],
  a2: [{ value: 's3', label: 'S3' }],
  b1: [
    { value: 's4', label: 'S4' },
    { value: 's5', label: 'S5' },
  ],
}

vi.mock('@/hooks/ddl/groups/useGroupSubGroupMultiDdl', () => ({
  useGroupSubGroupMultiDdl: ({ groupIds }: { groupIds: string[] }) => {
    const normalizedGroupIds = [...new Set(groupIds.map(String))].sort()
    const subGroups = normalizedGroupIds.flatMap(
      (groupId) => subGroupsByGroup[groupId as keyof typeof subGroupsByGroup] ?? []
    )

    return {
      groupIds: normalizedGroupIds,
      groups,
      subGroups,
      isGroupsLoading: false,
      isGroupsFetching: ddlState.isGroupsFetching,
      isGroupsError: false,
      refetchGroups: vi.fn(),
      isSubGroupsLoading: false,
      isSubGroupsFetching: ddlState.isSubGroupsFetching,
      isSubGroupsError: false,
      refetchSubGroups: vi.fn(),
      isSubGroupDisabled: normalizedGroupIds.length === 0,
    }
  },
}))

vi.mock('@/hooks/ddl/students/useStudentsMultiDdl', () => ({
  normalizeStudentSubGroupIds: (ids: string[]) => [...new Set(ids.map(String))].sort(),
  useStudentsMultiDdl: ({ subGroupIds }: { subGroupIds: string[] }) => ({
    students: subGroupIds.flatMap(
      (subGroupId) => studentsBySubGroup[subGroupId as keyof typeof studentsBySubGroup] ?? []
    ),
    isLoading: false,
    isFetching: ddlState.isStudentsFetching,
    isError: false,
    isPartialError: false,
    retry: vi.fn(),
  }),
}))

vi.mock('@/components/form/FormMultiSelect', () => ({
  FormMultiSelect: ({ name, data }: { name: keyof Values; data: IDDl[] }) => {
    const { control, setValue } = useFormContext<Values>()
    const value = useWatch({ control, name }) ?? []

    return (
      <div>
        {data.map((option) => {
          const id = String(option.value)
          const selected = value.includes(id)
          return (
            <button
              key={id}
              type="button"
              aria-label={`${name}-${id}`}
              aria-pressed={selected}
              onClick={() =>
                setValue(name, selected ? value.filter((item) => item !== id) : [...value, id], {
                  shouldDirty: true,
                })
              }
            >
              {String(option.label)}
            </button>
          )
        })}
      </div>
    )
  },
}))

type Values = {
  main_groups: string[]
  sub_groups: string[]
  students: string[]
}

const emptyValues: Values = { main_groups: [], sub_groups: [], students: [] }

function HierarchyHarness({
  defaultSelectAll = true,
  includeStudents = true,
  initialValues = emptyValues,
  onSubmit = vi.fn(),
}: {
  defaultSelectAll?: boolean
  includeStudents?: boolean
  initialValues?: Values
  onSubmit?: (values: Values) => void
}) {
  const methods = useForm<Values>({ defaultValues: initialValues })
  const values = useWatch({ control: methods.control })
  const defaultSelection = useHierarchicalDefaultSelection(defaultSelectAll)
  const [, refresh] = useState(0)

  return (
    <FormProvider {...methods}>
      <form onSubmit={methods.handleSubmit(onSubmit)}>
        <GroupSubGroupMultiSelects<Values>
          groupName="main_groups"
          subGroupName="sub_groups"
          defaultSelection={defaultSelection}
        />
        {includeStudents && (
          <StudentsBySubGroupsMultiSelect<Values>
            name="students"
            subGroupName="sub_groups"
            defaultSelection={defaultSelection}
          />
        )}
        <button type="button" onClick={() => refresh((value) => value + 1)}>
          Refresh options
        </button>
        <button
          type="button"
          onClick={() => {
            defaultSelection.reset()
            methods.reset(emptyValues)
          }}
        >
          Reset form
        </button>
        <button type="submit">Submit</button>
      </form>
      <output data-testid="values">{JSON.stringify(values)}</output>
    </FormProvider>
  )
}

const readValues = () => JSON.parse(screen.getByTestId('values').textContent ?? '{}') as Values

describe('hierarchical create defaults', () => {
  beforeEach(() => {
    Object.assign(ddlState, {
      isGroupsFetching: false,
      isSubGroupsFetching: false,
      isStudentsFetching: false,
    })
  })

  it('waits for background hierarchy fetches before applying complete Create defaults', async () => {
    ddlState.isGroupsFetching = true
    ddlState.isSubGroupsFetching = true
    const { rerender } = render(<HierarchyHarness includeStudents={false} />)

    expect(readValues()).toEqual(emptyValues)

    ddlState.isGroupsFetching = false
    rerender(<HierarchyHarness includeStudents={false} />)
    await waitFor(() => expect(readValues().main_groups).toEqual(['a', 'b']))
    expect(readValues().sub_groups).toEqual([])

    ddlState.isSubGroupsFetching = false
    rerender(<HierarchyHarness includeStudents={false} />)
    await waitFor(() =>
      expect(readValues()).toEqual({ main_groups: ['a', 'b'], sub_groups: ['a1', 'a2', 'b1'], students: [] })
    )
  })

  it('does not overwrite a manual Main Group choice made while the initial fetch settles', async () => {
    ddlState.isGroupsFetching = true
    const { rerender } = render(<HierarchyHarness includeStudents={false} />)

    fireEvent.click(screen.getByRole('button', { name: 'main_groups-b' }))
    expect(readValues().main_groups).toEqual(['b'])

    ddlState.isGroupsFetching = false
    rerender(<HierarchyHarness includeStudents={false} />)

    await waitFor(() => expect(readValues()).toEqual({ main_groups: ['b'], sub_groups: ['b1'], students: [] }))
  })

  it('selects every available Main Group, Subgroup, and Student once and submits the hydrated values', async () => {
    const onSubmit = vi.fn()
    render(<HierarchyHarness onSubmit={onSubmit} />)

    await waitFor(() =>
      expect(readValues()).toEqual({
        main_groups: ['a', 'b'],
        sub_groups: ['a1', 'a2', 'b1'],
        students: ['s1', 's2', 's3', 's4', 's5'],
      })
    )

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(readValues(), expect.anything()))
  })

  it('removes every descendant when a Main Group is deselected and keeps that choice after refresh', async () => {
    const onSubmit = vi.fn()
    render(<HierarchyHarness onSubmit={onSubmit} />)
    await waitFor(() => expect(readValues().students).toHaveLength(5))

    fireEvent.click(screen.getByRole('button', { name: 'main_groups-a' }))

    await waitFor(() =>
      expect(readValues()).toEqual({ main_groups: ['b'], sub_groups: ['b1'], students: ['s4', 's5'] })
    )
    fireEvent.click(screen.getByRole('button', { name: 'Refresh options' }))
    expect(readValues()).toEqual({ main_groups: ['b'], sub_groups: ['b1'], students: ['s4', 's5'] })

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))
    await waitFor(() => expect(onSubmit).toHaveBeenCalledWith(readValues(), expect.anything()))
  })

  it('cascades Subgroup removal while preserving individual Student deselection across refresh', async () => {
    render(<HierarchyHarness />)
    await waitFor(() => expect(readValues().students).toHaveLength(5))

    fireEvent.click(screen.getByRole('button', { name: 'students-s1' }))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh options' }))
    expect(readValues().students).toEqual(['s2', 's3', 's4', 's5'])

    fireEvent.click(screen.getByRole('button', { name: 'sub_groups-a1' }))
    await waitFor(() => {
      expect(readValues().main_groups).toEqual(['a', 'b'])
      expect(readValues().sub_groups).toEqual(['a2', 'b1'])
      expect(readValues().students).toEqual(['s3', 's4', 's5'])
    })

    fireEvent.click(screen.getByRole('button', { name: 'Refresh options' }))
    expect(readValues()).toEqual({
      main_groups: ['a', 'b'],
      sub_groups: ['a2', 'b1'],
      students: ['s3', 's4', 's5'],
    })
  })

  it('preserves backend-hydrated Edit selections when default initialization is disabled', async () => {
    render(
      <HierarchyHarness
        defaultSelectAll={false}
        initialValues={{ main_groups: ['a'], sub_groups: ['a1'], students: ['s1'] }}
      />
    )

    await waitFor(() => expect(readValues()).toEqual({ main_groups: ['a'], sub_groups: ['a1'], students: ['s1'] }))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh options' }))
    expect(readValues()).toEqual({ main_groups: ['a'], sub_groups: ['a1'], students: ['s1'] })
  })

  it('runs Create defaults again after an intentional form reset', async () => {
    render(<HierarchyHarness />)
    await waitFor(() => expect(readValues().students).toHaveLength(5))

    fireEvent.click(screen.getByRole('button', { name: 'main_groups-a' }))
    await waitFor(() => expect(readValues().main_groups).toEqual(['b']))

    fireEvent.click(screen.getByRole('button', { name: 'Reset form' }))
    await waitFor(() =>
      expect(readValues()).toEqual({
        main_groups: ['a', 'b'],
        sub_groups: ['a1', 'a2', 'b1'],
        students: ['s1', 's2', 's3', 's4', 's5'],
      })
    )
  })
})
