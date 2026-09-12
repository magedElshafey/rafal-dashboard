import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { rolesService } from '@/modules/roles/api/roles.service'
import { resetPermissionsMock, seedPermissionsMock } from '@/modules/roles/mocks/permissions.mock'
import { resetRolesMock, seedRolesMock } from '@/modules/roles/mocks/roles.mock'
import RolesPage from '@/modules/roles/pages/RolesPage'

const toastMocks = vi.hoisted(() => ({ success: vi.fn(), error: vi.fn() }))
vi.mock('sonner', () => ({ toast: toastMocks }))

class ResizeObserverMock {
  observe() {}
  unobserve() {}
  disconnect() {}
}

vi.stubGlobal('ResizeObserver', ResizeObserverMock)
Element.prototype.scrollIntoView = vi.fn()

function renderRolesPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return render(
    <QueryClientProvider client={queryClient}>
      <RolesPage />
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
    resetRolesMock()
    resetPermissionsMock()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders a mirrored loading state, then one query in desktop table and mobile cards without search', async () => {
    renderRolesPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(5)
    expect(await screen.findAllByText('Content Manager')).toHaveLength(2)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('uses the standard empty state and create action', async () => {
    seedRolesMock([])
    renderRolesPage()

    expect(await screen.findByText('No roles yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Role' })).toHaveLength(2)
  })

  it('shows a safe retry state after a list error and retries only the roles query', async () => {
    const originalList = rolesService.list
    const list = vi.spyOn(rolesService, 'list').mockRejectedValue(new Error('database internals'))
    const user = userEvent.setup()
    renderRolesPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('database internals')).not.toBeInTheDocument()
    list.mockImplementation(originalList)
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
    expect(screen.getByText('Loading permissions…')).toBeInTheDocument()
    await user.click(await screen.findByRole('option', { name: 'manage roles' }))
    expect(screen.getByRole('option', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'true')
    await user.click(screen.getByRole('option', { name: 'manage roles' }))
    expect(screen.getByRole('option', { name: 'manage roles' })).toHaveAttribute('aria-checked', 'false')
    await user.click(screen.getByRole('option', { name: 'manage admins' }))

    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'Auditor')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'Auditor', permissions: ['manage admins'] }))
  })

  it('accepts an empty permission selection', async () => {
    const user = userEvent.setup()
    const create = vi.spyOn(rolesService, 'create')
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.type(screen.getByRole('textbox', { name: /role name/i }), 'No Access')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledWith({ name: 'No Access', permissions: undefined }))
  })

  it('loads the next permissions page once the picker reaches its sentinel', async () => {
    seedPermissionsMock(Array.from({ length: 16 }, (_, index) => ({ id: index + 1, name: `permission ${index + 1}` })))
    const list = vi.spyOn(permissionsService, 'list')
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.click(screen.getByRole('button', { name: 'Permissions' }))

    expect(await screen.findByRole('option', { name: 'permission 16' })).toBeInTheDocument()
    expect(list).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(list).toHaveBeenCalledWith(2, expect.any(AbortSignal))
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('keeps the role form usable when permissions fail and retries within the field', async () => {
    const originalList = permissionsService.list
    const list = vi.spyOn(permissionsService, 'list').mockRejectedValueOnce(new Error('unsafe permissions error'))
    const user = userEvent.setup()
    renderRolesPage()
    await screen.findAllByText('Content Manager')
    await user.click(screen.getByRole('button', { name: 'Create Role' }))
    await user.click(screen.getByRole('button', { name: 'Permissions' }))

    expect(await screen.findByText('Permissions could not be loaded.')).toBeInTheDocument()
    expect(screen.queryByText('unsafe permissions error')).not.toBeInTheDocument()
    list.mockImplementation(originalList)
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

    expect(screen.getByRole('dialog').querySelector('[aria-busy="true"]')).toBeInTheDocument()
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

  it('shows drawer error with retry when role detail cannot load', async () => {
    const originalShow = rolesService.show
    const show = vi.spyOn(rolesService, 'show').mockRejectedValueOnce(new Error('unsafe detail'))
    show.mockImplementation(originalShow)
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
    renderRolesPage()
    await openRoleAction(user, 'Marketing Manager', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    expect(screen.getAllByText('Marketing Manager').length).toBeGreaterThan(0)
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })
    await user.dblClick(confirm)
    await waitFor(() => expect(confirm).toBeDisabled())
    expect(remove).toHaveBeenCalledTimes(1)
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('Marketing Manager')).not.toBeInTheDocument()
  })

  it('keeps the dialog open and localizes the known self-role 403 rejection', async () => {
    const user = userEvent.setup()
    renderRolesPage()
    await openRoleAction(user, 'Super Admin', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() =>
      expect(toastMocks.error).toHaveBeenCalledWith('You cannot delete a role assigned to your own account.')
    )
    expect(dialog).toBeInTheDocument()
    expect(window.location.pathname).not.toBe('/403')
  })
})
