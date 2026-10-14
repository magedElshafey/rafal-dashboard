import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { rolesService } from '@/modules/roles/api/roles.service'
import RolesPage from '@/modules/roles/pages/RolesPage'
import { granularPermissionCatalog, syntheticPermissionCatalog } from '@/modules/roles/fixtures/permissions.fixture'
import type { PermissionGroup } from '@/modules/roles/types/permission.types'
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
let permissions: PermissionGroup[] = []

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
  vi.spyOn(permissionsService, 'list').mockImplementation(async () => permissions)
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
  await user.click(await screen.findByRole('checkbox', { name: permission }))
}

describe('RolesPage', () => {
  beforeEach(async () => {
    roles = [
      { id: 1, name: 'Super Admin', permissions: ['manage admins', 'manage banners', 'manage roles'] },
      { id: 2, name: 'Content Manager', permissions: ['manage banners'] },
      { id: 3, name: 'Marketing Manager', permissions: ['manage banners'] },
    ]
    permissions = [
      {
        group: 'administration',
        label: { en: 'Administration', ar: 'الإدارة' },
        permissions: [
          {
            id: 2,
            name: 'manage admins',
            group: 'administration',
            label: { en: 'manage admins', ar: 'إدارة المسؤولين' },
          },
          {
            id: 1,
            name: 'manage banners',
            group: 'administration',
            label: { en: 'manage banners', ar: 'إدارة اللافتات' },
          },
          { id: 3, name: 'manage roles', group: 'administration', label: { en: 'manage roles', ar: 'إدارة الأدوار' } },
        ],
      },
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
    expect(await screen.findByRole('checkbox', { name: 'manage admins' })).toHaveAttribute('aria-checked', 'false')
  })

  it('loads permissions in the field, supports selection and deselection, and submits permission names', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(rolesService, 'create')
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))

    await user.click(await screen.findByRole('checkbox', { name: 'manage roles' }))
    expect(screen.getByRole('checkbox', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('checkbox', { name: 'manage roles' }))
    expect(screen.getByRole('checkbox', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('checkbox', { name: 'manage admins' }))

    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Auditor')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Auditor', permissions: ['manage admins'] }))
  })

  it('blocks Create with an empty permission selection and focuses the first nonempty group', async () => {
    permissions.unshift({ group: 'empty', label: { en: 'Empty group' }, permissions: [] })
    const user = userEvent.setup()
    const create = vi.spyOn(rolesService, 'create')
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'No Access')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    expect(await screen.findByText('Select at least one permission.')).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'Select all in Empty group' })).toBeDisabled()
    await waitFor(() => expect(screen.getByRole('checkbox', { name: 'manage admins' })).toHaveFocus())
    expect(create).not.toHaveBeenCalled()
  })

  it.each(['permissions', 'permissions.0', 'permissions[0]'])(
    'keeps backend %s validation mapped to the field',
    async (errorField) => {
      const error = Object.assign(new Error('unsafe client detail'), {
        isAxiosError: true,
        response: {
          data: {
            message: 'The role could not be saved.',
            errors: { [errorField]: ['The selected permission is unavailable.'] },
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
      await user.click(screen.getByRole('button', { name: /^Create$/ }))

      expect(await screen.findByText('The selected permission is unavailable.')).toBeInTheDocument()
      expect(toastMocks.error).toHaveBeenCalledWith('The role could not be saved.')
      expect(screen.getByRole('dialog')).toBeInTheDocument()
    }
  )

  it('loads every group and all 65 synthetic permissions in one request without a sentinel', async () => {
    permissions = syntheticPermissionCatalog()
    const list = vi.mocked(permissionsService.list)
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    expect(await screen.findByRole('checkbox', { name: 'Action 18.2' })).toBeInTheDocument()
    expect(within(screen.getByRole('dialog')).getAllByRole('checkbox')).toHaveLength(65 + 19)
    expect(list).toHaveBeenCalledExactlyOnceWith(expect.any(AbortSignal))
  })

  it('keeps the role form usable when permissions fail and retries within the field', async () => {
    const list = vi.mocked(permissionsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValueOnce(new Error('unsafe permissions error'))
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))

    expect(await screen.findByText('Permissions could not be loaded.')).toBeInTheDocument()
    expect(screen.queryByText('unsafe permissions error')).not.toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(1)
    list.mockImplementation(implementation!)
    await user.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByRole('checkbox', { name: 'manage roles' })).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('textbox', { name: /role name/i })).toBeEnabled()
  })

  it('keeps the permissions picker operable in RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'إضافة دور' }))
    expect(screen.getByRole('group', { name: 'الصلاحيات' })).toHaveAttribute('dir', 'rtl')
    expect(await screen.findByRole('group', { name: 'الإدارة' })).toBeInTheDocument()
    const checkbox = screen.getByRole('checkbox', { name: 'إدارة الأدوار' })
    checkbox.focus()
    await user.keyboard(' ')
    expect(checkbox).toBeChecked()
    expect(screen.getByText('تم تحديد 1 من 3')).toHaveClass('sr-only')
  })

  it('loads edit detail, guards pristine updates, and closes after a changed update', async () => {
    const user = userEvent.setup()
    const show = vi.spyOn(rolesService, 'show')
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')

    const name = await screen.findByRole('textbox', { name: /role name/i })
    expect(show).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(name).toHaveValue('Content Manager')
    expect(await screen.findByRole('checkbox', { name: 'manage banners' })).toHaveAttribute('aria-checked', 'true')
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
    await user.click(await screen.findByRole('checkbox', { name: 'manage banners' }))
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
  it('keeps group actions isolated, exposes mixed state, and submits exact granular names', async () => {
    permissions = granularPermissionCatalog()
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Inventory')
    await user.click(await screen.findByRole('checkbox', { name: 'Reject returns' }))
    await user.click(screen.getByRole('checkbox', { name: 'View products' }))
    expect(screen.getByRole('checkbox', { name: 'Select all in Products' })).toBePartiallyChecked()
    expect(within(screen.getByRole('group', { name: 'Products' })).getByText('1 of 2 selected')).toHaveClass('sr-only')
    expect(screen.getByRole('checkbox', { name: 'Manage stock' })).not.toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Select all in Products' }))
    expect(screen.getByRole('checkbox', { name: 'Manage stock' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Deselect all in Products' })).toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Deselect all in Products' }))
    expect(screen.getByRole('checkbox', { name: 'View products' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Manage stock' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Reject returns' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Approve returns' })).not.toBeChecked()
    await user.click(screen.getByRole('checkbox', { name: 'Assign staff' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() =>
      expect(rolesService.create).toHaveBeenCalledWith({
        name: 'Inventory',
        permissions: ['returns.reject', 'warehouse-staff.assign'],
      })
    )
    expect(permissionsService.list).toHaveBeenCalledTimes(1)
  })

  it('hydrates exact assigned names and preserves unknown assignments through unrelated edits and group toggles', async () => {
    permissions = granularPermissionCatalog()
    roles[1].permissions = ['products.manage-stock', 'Legacy.Exact-Permission', 'returns.reject']
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')
    const stock = await screen.findByRole('checkbox', { name: 'Manage stock' })
    expect(stock).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'View products' })).not.toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Reject returns' })).toBeChecked()
    expect(
      within(screen.getByRole('region', { name: 'Other assigned permissions' })).getByText('Legacy.Exact-Permission')
    ).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /role name/i }), ' revised')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(rolesService.update).toHaveBeenLastCalledWith(2, {
        name: 'Content Manager revised',
        permissions: ['products.manage-stock', 'Legacy.Exact-Permission', 'returns.reject'],
      })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    await openRoleAction(user, 'Content Manager revised', 'Edit')
    await screen.findByRole('checkbox', { name: 'Manage stock' })
    await user.click(screen.getByRole('checkbox', { name: 'Select all in Products' }))
    await user.click(screen.getByRole('checkbox', { name: 'Deselect all in Products' }))
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(rolesService.update).toHaveBeenLastCalledWith(2, {
        name: 'Content Manager revised',
        permissions: ['Legacy.Exact-Permission', 'returns.reject'],
      })
    )
  })

  it('shows empty catalog feedback and retains existing assignments when editing the name', async () => {
    permissions = []
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')
    expect(await screen.findByText('No permissions available.')).toBeInTheDocument()
    const retained = screen.getByRole('region', { name: 'Other assigned permissions' })
    expect(within(retained).getByText('manage banners')).toBeInTheDocument()
    await user.type(screen.getByRole('textbox', { name: /role name/i }), ' revised')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(rolesService.update).toHaveBeenCalledWith(2, {
        name: 'Content Manager revised',
        permissions: ['manage banners'],
      })
    )
  })

  it('preserves assigned permissions when catalog loading fails during an unrelated name edit', async () => {
    vi.mocked(permissionsService.list).mockRejectedValue(new Error('catalog unavailable'))
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Content Manager', 'Edit')
    await screen.findByText('Permissions could not be loaded.')
    await user.type(screen.getByRole('textbox', { name: /role name/i }), ' revised')
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() =>
      expect(rolesService.update).toHaveBeenCalledWith(2, {
        name: 'Content Manager revised',
        permissions: ['manage banners'],
      })
    )
  })

  it('announces pending catalog loading and preserves the role name when it finishes', async () => {
    let resolve!: (value: PermissionGroup[]) => void
    vi.mocked(permissionsService.list).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    expect(screen.getByRole('status')).toHaveTextContent('Loading permissions')
    expect(screen.getByRole('status')).toHaveAttribute('aria-busy', 'true')
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Draft role')
    await act(async () => resolve(granularPermissionCatalog()))
    expect(await screen.findByRole('checkbox', { name: 'Manage stock' })).toBeInTheDocument()
    expect(screen.getByRole('textbox', { name: /role name/i })).toHaveValue('Draft role')
  })

  it('uses preferred labels, translation fallback and exact identifiers when labels are absent', async () => {
    permissions = [
      {
        group: 'custom',
        label: { ar: 'مجموعة مخصصة' },
        permissions: [
          { id: 7, name: 'Exact.Mixed-Action', group: 'custom', label: { en: '', ar: 'إجراء مخصص' } },
          { id: 8, name: 'exact-no-label', group: 'custom' },
        ],
      },
    ]
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    expect(await screen.findByRole('group', { name: 'مجموعة مخصصة' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'إجراء مخصص' })).toBeInTheDocument()
    expect(screen.getByRole('checkbox', { name: 'exact-no-label' })).toBeInTheDocument()
  })

  it('blocks duplicate creation and selection changes while saving', async () => {
    let resolve!: (value: Awaited<ReturnType<typeof rolesService.create>>) => void
    vi.mocked(rolesService.create).mockImplementationOnce(
      () =>
        new Promise((done) => {
          resolve = done
        })
    )
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Draft')
    await selectPermission(user, 'manage roles')
    const submit = screen.getByRole('button', { name: /^Create$/ })
    await user.dblClick(submit)
    expect(rolesService.create).toHaveBeenCalledTimes(1)
    expect(submit).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'manage roles' })).toBeDisabled()
    expect(screen.getByRole('checkbox', { name: 'Select all in Administration' })).toBeDisabled()
    await act(async () =>
      resolve({ success: true, message: 'ok', data: { id: 9, name: 'Draft', permissions: ['manage roles'] } })
    )
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('retains the selected names and draft after a forbidden create response', async () => {
    const error = { isAxiosError: true, response: { status: 403, data: { message: 'You cannot create roles.' } } }
    vi.mocked(rolesService.create).mockRejectedValueOnce(error)
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Draft')
    await selectPermission(user, 'manage roles')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('You cannot create roles.'))
    expect(screen.getByRole('textbox', { name: /role name/i })).toHaveValue('Draft')
    expect(screen.getByRole('checkbox', { name: 'manage roles' })).toBeChecked()
    expect(toastMocks.success).not.toHaveBeenCalled()
  })
})
