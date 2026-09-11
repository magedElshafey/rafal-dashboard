import type { PropsWithChildren } from 'react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import { useEntityFormDrawer } from '@/components/shared/entity-form-drawer'
import AssistantFormDrawer from '@/modules/teachers/Admin/assistant/components/organism/assistant-form/AssistantFormDrawer'
import ChapterFormDrawer from '@/modules/teachers/Admin/chapters/components/organism/chapter-form/ChapterFormDrawer'
import SessionFormDrawer from '@/modules/teachers/Admin/sessions/components/organism/session-form/SessionFormDrawer'
import StaffFormDrawer from '@/modules/teachers/Teacher/staff/components/organism/staff-form/StaffFormDrawer'
import AddAssistantDialog from '@/modules/teachers/shared/assignments/components/dialogs/AddAssistantDialog'
import { getMainGroupsDdl, getSubGroupsDdl } from '@/services/ddl/groups.ddl.service'
import { getStudentsDdl } from '@/services/ddl/students.ddl.service'

vi.mock('react-circle-flags', () => ({ CircleFlag: () => <span /> }))

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { dir: () => 'ltr' },
  }),
}))

vi.mock('@/services/ddl/groups.ddl.service', () => ({
  getMainGroupsDdl: vi.fn(),
  getSubGroupsDdl: vi.fn(),
}))

vi.mock('@/services/ddl/students.ddl.service', () => ({
  getStudentsDdl: vi.fn(),
}))

beforeAll(() => {
  vi.stubGlobal(
    'ResizeObserver',
    class ResizeObserver {
      observe() {}
      unobserve() {}
      disconnect() {}
    }
  )
  HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
  HTMLElement.prototype.setPointerCapture = vi.fn()
  HTMLElement.prototype.releasePointerCapture = vi.fn()
})

function createWrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  return function Wrapper({ children }: PropsWithChildren) {
    return <QueryClientProvider client={client}>{children}</QueryClientProvider>
  }
}

function StaffDrawerOwner() {
  const drawer = useEntityFormDrawer()

  return (
    <>
      <button type="button" onClick={drawer.openCreate}>
        Open Staff Create
      </button>
      <StaffFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        staff={null}
        onOpenChange={drawer.setOpen}
        onClose={drawer.close}
        onSubmit={vi.fn()}
      />
    </>
  )
}

function AssistantDrawerOwner() {
  const drawer = useEntityFormDrawer()

  return (
    <>
      <button type="button" onClick={drawer.openCreate}>
        Open Assistant Create
      </button>
      <AssistantFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        assistant={null}
        onOpenChange={drawer.setOpen}
        onClose={drawer.close}
        onSubmit={vi.fn()}
      />
    </>
  )
}

function SessionDrawerOwner() {
  const drawer = useEntityFormDrawer()

  return (
    <>
      <button type="button" onClick={drawer.openCreate}>
        Open Session Create
      </button>
      <SessionFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        session={null}
        onOpenChange={drawer.setOpen}
        onClose={drawer.close}
        onSubmit={vi.fn()}
      />
    </>
  )
}

function ChapterDrawerOwner() {
  const drawer = useEntityFormDrawer()

  return (
    <>
      <button type="button" onClick={drawer.openCreate}>
        Open Chapter Create
      </button>
      <ChapterFormDrawer
        open={drawer.open}
        mode={drawer.mode}
        chapter={null}
        onOpenChange={drawer.setOpen}
        onRetryChapter={vi.fn()}
        onClose={drawer.close}
        onSubmit={vi.fn()}
      />
    </>
  )
}

function AssignmentDrawerOwner() {
  const drawer = useEntityFormDrawer()

  return (
    <>
      <button type="button" onClick={drawer.openCreate}>
        Open Assignment Create
      </button>
      <AddAssistantDialog open={drawer.open} mode="create" onOpenChange={drawer.setOpen} onSubmit={vi.fn()} />
    </>
  )
}

async function expectDefaultsSelected() {
  await waitFor(() => {
    expect(screen.getByText('Group A')).toBeInTheDocument()
    expect(screen.getByText('Group B')).toBeInTheDocument()
    expect(screen.getByText('Subgroup A')).toBeInTheDocument()
    expect(screen.getByText('Subgroup B')).toBeInTheDocument()
  })
}

async function closeCreate() {
  fireEvent.click(screen.getByRole('button', { name: 'common.close' }))
  await waitFor(() => expect(screen.queryByText('Group A')).not.toBeInTheDocument())
}

describe('real Create drawer hierarchy lifecycle', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(getMainGroupsDdl).mockResolvedValue([
      { value: 'group-a', label: 'Group A', sub_groups_count: 1 },
      { value: 'group-b', label: 'Group B', sub_groups_count: 1 },
    ])
    vi.mocked(getSubGroupsDdl).mockImplementation(async (groupId) => [
      {
        value: `sub-${groupId}`,
        label: groupId === 'group-a' ? 'Subgroup A' : 'Subgroup B',
      },
    ])
    vi.mocked(getStudentsDdl).mockImplementation(async ({ group }) => [
      {
        value: `student-${group}`,
        student_id: `student-${group}`,
        label: group === 'sub-group-a' ? 'Student A' : 'Student B',
      },
    ])
  })

  it.each([
    ['Staff', StaffDrawerOwner, 'Open Staff Create'],
    ['Assistant', AssistantDrawerOwner, 'Open Assistant Create'],
    ['Session', SessionDrawerOwner, 'Open Session Create'],
    ['Chapter', ChapterDrawerOwner, 'Open Chapter Create'],
  ] as const)(
    '%s applies cached defaults on the first, second, and third real drawer session',
    async (_, Owner, openLabel) => {
      render(<Owner />, { wrapper: createWrapper() })

      for (let session = 1; session <= 3; session += 1) {
        fireEvent.click(screen.getByRole('button', { name: openLabel }))
        await expectDefaultsSelected()
        await closeCreate()
      }

      expect(getMainGroupsDdl).toHaveBeenCalledTimes(1)
      expect(getSubGroupsDdl).toHaveBeenCalledTimes(2)
    }
  )

  it('Assignment reapplies complete Groups, Subgroups, and Students defaults after close and reopen', async () => {
    render(<AssignmentDrawerOwner />, { wrapper: createWrapper() })

    for (let session = 1; session <= 3; session += 1) {
      fireEvent.click(screen.getByRole('button', { name: 'Open Assignment Create' }))
      await expectDefaultsSelected()
      await waitFor(() => {
        expect(screen.getByText('Student A')).toBeInTheDocument()
        expect(screen.getByText('Student B')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByRole('button', { name: 'teachers_assignments.actions.cancel' }))
      await waitFor(() => expect(screen.queryByText('Student A')).not.toBeInTheDocument())
    }

    expect(getMainGroupsDdl).toHaveBeenCalledTimes(1)
    expect(getSubGroupsDdl).toHaveBeenCalledTimes(2)
    expect(getStudentsDdl).toHaveBeenCalledTimes(2)
  })

  it.each([
    ['Staff', StaffDrawerOwner, 'Open Staff Create', 'staff.form.fields.name.placeholder'],
    ['Session', SessionDrawerOwner, 'Open Session Create', 'sessions.form.fields.name.placeholder'],
    ['Chapter', ChapterDrawerOwner, 'Open Chapter Create', 'chapters.form.fields.name.placeholder'],
  ] as const)(
    'preserves a manual %s group deselection during the same open session',
    async (_, Owner, openLabel, placeholder) => {
      render(<Owner />, { wrapper: createWrapper() })

      fireEvent.click(screen.getByRole('button', { name: openLabel }))
      await expectDefaultsSelected()

      fireEvent.click(screen.getAllByRole('button', { name: 'label.clear_selection' })[0])
      await waitFor(() => {
        expect(screen.queryByText('Group A')).not.toBeInTheDocument()
        expect(screen.queryByText('Group B')).not.toBeInTheDocument()
      })

      fireEvent.change(screen.getByPlaceholderText(placeholder), {
        target: { value: 'Rerender without a new session' },
      })
      expect(screen.queryByText('Group A')).not.toBeInTheDocument()
      expect(screen.queryByText('Group B')).not.toBeInTheDocument()
    }
  )
})
