import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { rolesService } from '@/modules/roles/api/roles.service'
import RolesPage from '@/modules/roles/pages/RolesPage'
import type { Permission } from '@/modules/roles/types/permission.types'
import type { Role } from '@/modules/roles/types/role.types'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()
HTMLElement.prototype.hasPointerCapture = vi.fn(() => false)
HTMLElement.prototype.setPointerCapture = vi.fn()
HTMLElement.prototype.releasePointerCapture = vi.fn()

let roles: Role[] = []
let permissions: Permission[] = []

function paginated<T>(items: T[], page: number) {
  const perPage = 15
  const start = (page - 1) * perPage
  const pageItems = items.slice(start, start + perPage)
  const totalPages = Math.max(1, Math.ceil(items.length / perPage))
  return {
    items: pageItems,
    paginate: {
      current_page: page,
      total_pages: totalPages,
      per_page: perPage,
      total: items.length,
      count: pageItems.length,
      next_page_url: page < totalPages ? String(page + 1) : null,
      prev_page_url: page > 1 ? String(page - 1) : null,
    },
    extra: null,
  }
}

function installServiceFixtures() {
  vi.spyOn(rolesService, 'list').mockImplementation(async (page) => paginated(roles, page))
  vi.spyOn(rolesService, 'show').mockImplementation(async (id) => {
    const role = roles.find((item) => item.id === id)
    if (!role) throw new Error('Role not found')
    return { success: true, message: 'ok', data: role }
  })
  vi.spyOn(rolesService, 'create').mockImplementation(async (payload) => {
    const role: Role = {
      id: Math.max(0, ...roles.map((item) => item.id)) + 1,
      name: payload.name,
      permissions: payload.permissions ?? [],
    }
    roles.unshift(role)
    return { success: true, message: 'created', data: role }
  })
  vi.spyOn(rolesService, 'update').mockImplementation(async (id, payload) => {
    const index = roles.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Role not found')
    roles[index] = { id, name: payload.name, permissions: payload.permissions ?? [] }
    return { success: true, message: 'updated', data: roles[index] }
  })
  vi.spyOn(rolesService, 'delete').mockImplementation(async (id) => {
    if (id === 1) {
      throw Object.assign(new Error('You cannot delete a role assigned to your own account'), {
        isAxiosError: true,
        response: { status: 403, data: { message: 'You cannot delete a role assigned to your own account' } },
      })
    }
    roles = roles.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
  vi.spyOn(permissionsService, 'list').mockImplementation(async (page) => paginated(permissions, page))
}

function renderRolesPage(initialEntry = '/dashboard/roles') {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <RolesPage />
      </MemoryRouter>
    </QueryClientProvider>
  )
}

async function openRoleAction(user: ReturnType<typeof userEvent.setup>, role: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${role}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${role}` }))
}

async function selectPermission(user: ReturnType<typeof userEvent.setup>, permission: string) {
  if (!screen.queryByRole('listbox')) {
    await user.click(screen.getByRole('button', { name: 'Permissions' }))
  }
  await user.click(await screen.findByRole('option', { name: permission }))
}

describe('RolesPage', () => {
  beforeEach(async () => {
    roles = [
      { id: 1, name: 'Super Admin', permissions: ['manage admins', 'manage banners', 'manage roles'] },
      { id: 2, name: 'Content Manager', permissions: ['manage banners'] },
      { id: 3, name: 'Marketing Manager', permissions: ['manage banners'] },
    ]
    permissions = [
      { id: 2, name: 'manage admins' },
      { id: 1, name: 'manage banners' },
      { id: 3, name: 'manage roles' },
    ]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders a mirrored loading state, then one query in desktop table and mobile cards with shared search', async () => {
    renderRolesPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(5)
    expect(await screen.findAllByText('Content Manager')).toHaveLength(2)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: 'Search roles' })).toBeInTheDocument()
  })

  it('resets pagination for search and Apply, retains filters on next pages, and resets all filters', async () => {
    roles = Array.from({ length: 16 }, (_, index) => ({
      id: index + 1,
      name: `Role ${index + 1}`,
      permissions: [],
    }))
    const list = vi.mocked(rolesService.list)
    const user = userEvent.setup()
    renderRolesPage('/dashboard/roles?page=4&search=Manager&sort_by=name&sort_dir=asc')

    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) =>
            page === 2 && filters?.search === 'Manager' && filters.sortBy === 'name' && filters.sortDir === 'asc'
        )
      ).toBe(true)
    )

    const search = screen.getByRole('textbox', { name: 'Search roles' })
    await user.clear(search)
    await user.type(search, 'Auditor')
    await waitFor(
      () =>
        expect(
          list.mock.calls.some(
            ([page, , filters]) =>
              page === 1 && filters?.search === 'Auditor' && filters.sortBy === 'name' && filters.sortDir === 'asc'
          )
        ).toBe(true),
      { timeout: 2000 }
    )
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) =>
            page === 2 && filters?.search === 'Auditor' && filters.sortBy === 'name' && filters.sortDir === 'asc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const appliedRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('combobox', { name: 'Sort direction' }))
    await user.click(await screen.findByRole('option', { name: 'Descending' }))
    expect(list).toHaveBeenCalledTimes(appliedRequestCount)
    await user.click(screen.getByRole('button', { name: 'Apply' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) =>
            page === 1 && filters?.search === 'Auditor' && filters.sortBy === 'name' && filters.sortDir === 'desc'
        )
      ).toBe(true)
    )
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) =>
            page === 2 && filters?.search === 'Auditor' && filters.sortBy === 'name' && filters.sortDir === 'desc'
        )
      ).toBe(true)
    )

    await user.click(screen.getByRole('button', { name: 'Filter' }))
    const resetRequestCount = list.mock.calls.length
    await user.click(screen.getByRole('button', { name: 'Reset' }))
    await waitFor(() =>
      expect(
        list.mock.calls.some(
          ([page, , filters]) =>
            page === 1 && filters?.search === '' && filters.sortBy === null && filters.sortDir === null
        )
      ).toBe(true)
    )
    expect(
      list.mock.calls
        .slice(resetRequestCount)
        .filter(
          ([page, , filters]) =>
            page === 1 && filters?.search === '' && filters.sortBy === null && filters.sortDir === null
        )
    ).toHaveLength(1)
    expect(screen.getByPlaceholderText('Search roles')).toHaveValue('')
  })

  it('uses the standard empty state and create action', async () => {
    roles = []
    renderRolesPage()

    expect(await screen.findByText('No roles yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Role' })).toHaveLength(2)
  })

  it('shows a safe retry state after a list error and retries only the roles query', async () => {
    const list = vi.mocked(rolesService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValue(new Error('database internals'))
    const user = userEvent.setup()
    renderRolesPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('database internals')).not.toBeInTheDocument()
    list.mockImplementation(implementation!)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findAllByText('Content Manager')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('validates create, closes after success, and renders the new role', async () => {
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Role name is required.')).toBeInTheDocument()
    expect(screen.getByText('Select at least one permission.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /role name/i }), '  Auditor  ')
    await selectPermission(user, 'manage roles')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findAllByText('Auditor')).toHaveLength(2)
    expect(toastMocks.success).toHaveBeenCalledWith('Role created successfully.')
  })

  it('create another keeps the drawer open and resets all fields', async () => {
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    const name = screen.getByRole('textbox', { name: /role name/i })
    await user.type(name, 'Auditor')
    await selectPermission(user, 'manage admins')
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))

    await waitFor(() => expect(name).toHaveValue(''))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    if (!screen.queryByRole('listbox')) await user.click(screen.getByRole('button', { name: 'Permissions' }))
    expect(await screen.findByRole('option', { name: 'manage admins' })).toHaveAttribute('aria-checked', 'false')
  })

  it('loads permissions in the field, supports selection and deselection, and submits permission names', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(rolesService, 'create')
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))

    await user.click(screen.getByRole('button', { name: 'Permissions' }))
    await user.click(await screen.findByRole('option', { name: 'manage roles' }))
    expect(screen.getByRole('option', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('option', { name: 'manage roles' }))
    expect(screen.getByRole('option', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('option', { name: 'manage admins' }))

    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Auditor')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Auditor', permissions: ['manage admins'] }))
  })

  it('blocks Create with an empty permission selection', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(rolesService, 'create')
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'No Access')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    expect(await screen.findByText('Select at least one permission.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('keeps backend permission validation mapped to the field', async () => {
    const error = Object.assign(new Error('unsafe client detail'), {
      isAxiosError: true,
      response: {
        data: {
          message: 'The role could not be saved.',
          errors: { permissions: ['The selected permission is unavailable.'] },
        },
      },
    })
    vi.spyOn(rolesService, 'create').mockRejectedValueOnce(error)
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Auditor')
    await selectPermission(user, 'manage admins')
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    expect(await screen.findByText('The selected permission is unavailable.')).toBeInTheDocument()
    expect(toastMocks.error).toHaveBeenCalledWith('The role could not be saved.')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
  })

  it('loads the next permissions page once the picker reaches its sentinel', async () => {
    permissions = Array.from({ length: 16 }, (_, index) => ({ id: index + 1, name: `permission ${index + 1}` }))
    const list = vi.mocked(permissionsService.list)
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.click(screen.getByRole('button', { name: 'Permissions' }))
    fireEvent.scroll(screen.getByRole('listbox'))

    expect(await screen.findByRole('option', { name: 'permission 16' })).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(list).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('keeps the role form usable when permissions fail and retries within the field', async () => {
    const list = vi.mocked(permissionsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe permissions error'))
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.click(screen.getByRole('button', { name: 'Permissions' }))

    expect(await screen.findByText('Permissions could not be loaded.')).toBeInTheDocument()
    expect(screen.queryByText('unsafe permissions error')).not.toBeInTheDocument()
    list.mockImplementation(implementation!)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('option', { name: 'manage roles' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /role name/i })).toBeEnabled()
  })

  it('keeps the permissions picker operable in RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'إضافة دور' }))
    const trigger = screen.getByRole('button', { name: 'الصلاحيات' })
    expect(trigger).toHaveAttribute('dir', 'rtl')
    await user.click(trigger)
    await user.click(await screen.findByRole('option', { name: 'manage roles' }))
    expect(trigger).toHaveTextContent('manage roles')
  })

  it('loads edit detail, guards pristine updates, and closes after a changed update', async () => {
    const user = userEvent.setup()
    const show = vi.spyOn(rolesService, 'show')
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')

    const name = await screen.findByRole('textbox', { name: /role name/i })
    expect(show).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(name).toHaveValue('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Permissions' }))
    expect(await screen.findByRole('option', { name: 'manage banners' })).toHaveAttribute('aria-checked', 'true')
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()

    await user.clear(name)
    await user.type(name, 'Editorial Manager')
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(await screen.findAllByText('Editorial Manager')).toHaveLength(2)
  })

  it('blocks Edit after removing the final permission', async () => {
    const update = vi.spyOn(rolesService, 'update')
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')

    await screen.findByRole('textbox', { name: /role name/i })
    await user.click(screen.getByRole('button', { name: 'Permissions' }))
    await user.click(await screen.findByRole('option', { name: 'manage banners' }))
    await user.keyboard('{Escape}')
    await user.click(screen.getByRole('button', { name: 'Update' }))

    expect(await screen.findByText('Select at least one permission.')).toBeInTheDocument()
    expect(update).not.toHaveBeenCalled()
  })

  it('shows drawer error with retry when role detail cannot load', async () => {
    vi.mocked(rolesService.show).mockRejectedValueOnce(new Error('unsafe detail'))
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(within(dialog).queryByText('unsafe detail')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /try again/i }))
    expect(await within(dialog).findByRole('textbox', { name: /role name/i })).toHaveValue('Content Manager')
  })

  it('requires delete confirmation, prevents duplicate pending deletion, and removes the role', async () => {
    const user = userEvent.setup()
    const remove = vi.spyOn(rolesService, 'delete')
    let resolveDelete!: () => void
    remove.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = () => {
            roles = roles.filter((role) => role.id !== 3)
            resolve({ success: true, message: 'deleted' })
          }
        })
    )
    renderRolesPage()
    await openRoleAction(user, 'Marketing Manager', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    expect(screen.getAllByText('Marketing Manager').length).toBeGreaterThan(0)
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })
    await user.dblClick(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(remove).toHaveBeenCalledTimes(1)
    resolveDelete()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Marketing Manager')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and shows the backend self-role 403 message', async () => {
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Super Admin', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('You cannot delete a role assigned to your own account')
    )
    expect(dialog).toBeInTheDocument()
    expect(window.location.pathname).not.toBe('/403')
  })
})
