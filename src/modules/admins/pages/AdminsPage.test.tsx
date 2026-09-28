import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/config/i18'
import i18n from '@/config/i18'
import { adminsService } from '@/modules/admins/api/admins.service'
import AdminsPage from '@/modules/admins/pages/AdminsPage'
import type { Admin } from '@/modules/admins/types/admin.types'
import { rolesService } from '@/modules/roles/api/roles.service'
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

let admins: Admin[] = []
let roles: Role[] = []

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
  vi.spyOn(adminsService, 'list').mockImplementation(async (page) => paginated(admins, page))
  vi.spyOn(adminsService, 'show').mockImplementation(async (id) => {
    const admin = admins.find((item) => item.id === id)
    if (!admin) throw new Error('Admin not found')
    return { success: true, message: 'ok', data: admin }
  })
  vi.spyOn(adminsService, 'create').mockImplementation(async (payload) => {
    const admin: Admin = {
      id: Math.max(0, ...admins.map((item) => item.id)) + 1,
      name: payload.name,
      email: payload.email,
      roles: payload.roles,
    }
    admins.unshift(admin)
    return { success: true, message: 'created', data: admin }
  })
  vi.spyOn(adminsService, 'update').mockImplementation(async (id, payload) => {
    const index = admins.findIndex((item) => item.id === id)
    if (index < 0) throw new Error('Admin not found')
    admins[index] = { id, ...payload }
    return { success: true, message: 'updated', data: admins[index] }
  })
  vi.spyOn(adminsService, 'delete').mockImplementation(async (id) => {
    if (id === 1) {
      throw Object.assign(new Error('You cannot delete your own account'), {
        isAxiosError: true,
        response: { status: 403, data: { message: 'You cannot delete your own account' } },
      })
    }
    admins = admins.filter((item) => item.id !== id)
    return { success: true, message: 'deleted' }
  })
  vi.spyOn(rolesService, 'list').mockImplementation(async (page) => paginated(roles, page))
}

function renderAdminsPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 }, mutations: { retry: false } },
  })
  return {
    queryClient,
    ...render(
      <QueryClientProvider client={queryClient}>
        <AdminsPage />
      </QueryClientProvider>
    ),
  }
}

async function openAdminAction(user: ReturnType<typeof userEvent.setup>, admin: string, action: string) {
  await user.click((await screen.findAllByRole('button', { name: `Actions for ${admin}` }))[0])
  await user.click(await screen.findByRole('menuitem', { name: `${action} ${admin}` }))
}

async function fillCreateFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByRole('textbox', { name: /^Name$/ }), '  New Admin  ')
  await user.type(screen.getByRole('textbox', { name: /^Email$/ }), 'new-admin@example.com')
  await user.type(screen.getByLabelText(/^Password/), 'secret')
  await user.type(screen.getByLabelText(/^Confirm Password/), 'secret')
}

describe('AdminsPage', () => {
  beforeEach(async () => {
    admins = [{ id: 1, name: 'Super Admin', email: 'admin@admin.com', roles: ['Super Admin'] }]
    roles = [
      { id: 1, name: 'Super Admin', permissions: [] },
      { id: 2, name: 'Content Manager', permissions: [] },
    ]
    installServiceFixtures()
    toastMocks.success.mockReset()
    toastMocks.error.mockReset()
    await i18n.changeLanguage('en')
  })

  afterEach(() => vi.restoreAllMocks())

  it('renders a mirrored loading state and one responsive data source without search', async () => {
    renderAdminsPage()

    expect(screen.getByTestId('query-loading-state')).toBeInTheDocument()
    expect(document.querySelectorAll('[data-slot="skeleton"]').length).toBeGreaterThan(8)
    expect(await screen.findAllByText('admin@admin.com')).toHaveLength(2)
    expect(document.querySelector('[data-slot="responsive-data-desktop"]')).toBeInTheDocument()
    expect(document.querySelector('[data-slot="responsive-data-mobile-cards"]')).toBeInTheDocument()
    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument()
  })

  it('uses the shared empty state and create action', async () => {
    admins = []
    renderAdminsPage()

    expect(await screen.findByText('No admins yet')).toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Create Admin' })).toHaveLength(2)
  })

  it('shows a safe list error and retries only the admins query', async () => {
    const list = vi.mocked(adminsService.list)
    const implementation = list.getMockImplementation()
    list.mockRejectedValue(new Error('database internals'))
    const user = userEvent.setup()
    renderAdminsPage()

    expect(await screen.findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(screen.queryByText('database internals')).not.toBeInTheDocument()
    list.mockImplementation(implementation!)
    await user.click(screen.getByRole('button', { name: /try again/i }))
    expect(await screen.findAllByText('admin@admin.com')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
  })

  it('loads later admin pages once and stops at the final page', async () => {
    admins = Array.from({ length: 16 }, (_, index) => ({
        id: index + 1,
        name: `Admin ${index + 1}`,
        email: `admin${index + 1}@example.com`,
        roles: [],
      }))
    const list = vi.spyOn(adminsService, 'list')
    renderAdminsPage()

    expect(await screen.findAllByText('Admin 16')).toHaveLength(2)
    expect(list).toHaveBeenCalledTimes(2)
    expect(list).toHaveBeenCalledWith(2, expect.any(AbortSignal))
  })

  it('blocks missing, invalid-email, and mismatched-password create submissions', async () => {
    const create = vi.spyOn(adminsService, 'create')
    const user = userEvent.setup()
    renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'Create Admin' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    expect(await screen.findByText('Admin name is required.')).toBeInTheDocument()
    expect(screen.getByText('Email is required.')).toBeInTheDocument()
    expect(screen.getByText('Password is required.')).toBeInTheDocument()
    expect(screen.getByText('Password confirmation is required.')).toBeInTheDocument()

    await user.type(screen.getByRole('textbox', { name: /^Name$/ }), 'Admin')
    await user.type(screen.getByRole('textbox', { name: /^Email$/ }), 'not-an-email')
    await user.type(screen.getByLabelText(/^Password/), 'one')
    await user.type(screen.getByLabelText(/^Confirm Password/), 'two')
    await user.click(screen.getByRole('button', { name: /^Create$/ }))
    expect(await screen.findByText('Enter a valid email address.')).toBeInTheDocument()
    expect(screen.getByText('Passwords must match.')).toBeInTheDocument()
    expect(create).not.toHaveBeenCalled()
  })

  it('creates with multiple remote role names and closes the drawer', async () => {
    const create = vi.spyOn(adminsService, 'create')
    const user = userEvent.setup()
    const { queryClient } = renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'Create Admin' }))
    await fillCreateFields(user)
    await user.click(screen.getByRole('button', { name: 'Roles' }))
    await user.click(await screen.findByRole('option', { name: 'Super Admin' }))
    await user.click(screen.getByRole('option', { name: 'Content Manager' }))
    await user.click(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(create).toHaveBeenCalledWith({
      name: 'New Admin',
      email: 'new-admin@example.com',
      password: 'secret',
      passwordConfirmation: 'secret',
      roles: ['Super Admin', 'Content Manager'],
    })
    expect(await screen.findAllByText('new-admin@example.com')).toHaveLength(2)
    expect(JSON.stringify(queryClient.getQueryData(['admins', 'list']))).not.toContain('password')
    expect(toastMocks.success).toHaveBeenCalledWith('Admin created successfully.')
  })

  it('create another keeps the drawer open and clears identity, passwords, roles, and errors', async () => {
    const user = userEvent.setup()
    renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'Create Admin' }))
    await fillCreateFields(user)
    await user.click(screen.getByRole('button', { name: 'Roles' }))
    await user.click(await screen.findByRole('option', { name: 'Super Admin' }))
    await user.click(screen.getByRole('button', { name: 'Create & Create Another' }))

    await waitFor(() => expect(screen.getByRole('textbox', { name: /^Name$/ })).toHaveValue(''))
    expect(screen.getByRole('textbox', { name: /^Email$/ })).toHaveValue('')
    expect(screen.getByLabelText(/^Password/)).toHaveValue('')
    expect(screen.getByLabelText(/^Confirm Password/)).toHaveValue('')
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    if (!screen.queryByRole('listbox')) await user.click(screen.getByRole('button', { name: 'Roles' }))
    expect(await screen.findByRole('option', { name: 'Super Admin' })).toHaveAttribute('aria-checked', 'false')
  })

  it('prevents duplicate create submissions while pending', async () => {
    let resolveCreate!: (value: Awaited<ReturnType<typeof adminsService.create>>) => void
    const create = vi.spyOn(adminsService, 'create').mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveCreate = resolve
        })
    )
    const user = userEvent.setup()
    renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'Create Admin' }))
    await fillCreateFields(user)
    await user.dblClick(screen.getByRole('button', { name: /^Create$/ }))

    await waitFor(() => expect(create).toHaveBeenCalledTimes(1))
    resolveCreate({
      success: true,
      message: 'Admin created successfully',
      data: { id: 7, name: 'New Admin', email: 'new-admin@example.com', roles: [] },
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('loads additional remote role options without adding search', async () => {
    roles = Array.from({ length: 16 }, (_, index) => ({
      id: index + 1,
      name: `Role ${index + 1}`,
      permissions: [],
    }))
    const list = vi.spyOn(rolesService, 'list')
    const user = userEvent.setup()
    renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'Create Admin' }))
    await user.click(screen.getByRole('button', { name: 'Roles' }))
    fireEvent.scroll(screen.getByRole('listbox'))

    expect(await screen.findByRole('option', { name: 'Role 16' })).toBeInTheDocument()
    expect(list).toHaveBeenCalledTimes(2)
    expect(within(screen.getByRole('listbox')).queryByRole('combobox')).not.toBeInTheDocument()
  })

  it('uses show data for edit, omits password fields, and guards pristine updates', async () => {
    const show = vi.spyOn(adminsService, 'show')
    const update = vi.spyOn(adminsService, 'update')
    const user = userEvent.setup()
    renderAdminsPage()
    await openAdminAction(user, 'Super Admin', 'Edit')

    const name = await screen.findByRole('textbox', { name: /^Name$/ })
    expect(show).toHaveBeenCalledWith(1, expect.any(AbortSignal))
    expect(name).toHaveValue('Super Admin')
    expect(screen.getByRole('textbox', { name: /^Email$/ })).toHaveValue('admin@admin.com')
    expect(screen.queryByLabelText(/^Password/)).not.toBeInTheDocument()
    expect(screen.queryByLabelText(/^Confirm Password/)).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled()
    expect(update).not.toHaveBeenCalled()

    await user.clear(name)
    await user.type(name, 'Platform Admin')
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    await user.click(screen.getByRole('button', { name: 'Update' }))
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    expect(update).toHaveBeenCalledWith(1, {
      name: 'Platform Admin',
      email: 'admin@admin.com',
      roles: ['Super Admin'],
    })
  })

  it('shows a safe retry state when edit detail fails', async () => {
    vi.mocked(adminsService.show).mockRejectedValueOnce(new Error('unsafe detail'))
    const user = userEvent.setup()
    renderAdminsPage()
    await openAdminAction(user, 'Super Admin', 'Edit')

    const dialog = await screen.findByRole('dialog')
    expect(await within(dialog).findByTestId('query-state-loading-error')).toBeInTheDocument()
    expect(within(dialog).queryByText('unsafe detail')).not.toBeInTheDocument()
    await user.click(within(dialog).getByRole('button', { name: /try again/i }))
    expect(await within(dialog).findByRole('textbox', { name: /^Name$/ })).toHaveValue('Super Admin')
  })

  it('requires confirmation, prevents duplicate deletion, and removes the admin', async () => {
    admins = [{ id: 9, name: 'Disposable Admin', email: 'delete@example.com', roles: [] }]
    const remove = vi.spyOn(adminsService, 'delete')
    let resolveDelete!: () => void
    remove.mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveDelete = () => {
            admins = []
            resolve({ success: true, message: 'deleted' })
          }
        })
    )
    const user = userEvent.setup()
    renderAdminsPage()
    await openAdminAction(user, 'Disposable Admin', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    const confirm = within(dialog).getByRole('button', { name: 'Delete' })
    await user.dblClick(confirm)

    await waitFor(() => expect(confirm).toBeDisabled())
    expect(remove).toHaveBeenCalledTimes(1)
    resolveDelete()
    await waitFor(() => expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument())
    expect(screen.queryByText('delete@example.com')).not.toBeInTheDocument()
  })

  it('keeps self-delete rejection local and does not log out or redirect', async () => {
    const user = userEvent.setup()
    renderAdminsPage()
    await openAdminAction(user, 'Super Admin', 'Delete')
    const dialog = await screen.findByRole('alertdialog')
    await user.click(within(dialog).getByRole('button', { name: 'Delete' }))

    await waitFor(() => expect(toastMocks.error).toHaveBeenCalledWith('You cannot delete your own account.'))
    expect(dialog).toBeInTheDocument()
    expect(window.location.pathname).not.toBe('/403')
  })

  it('keeps email and role selection usable in Arabic RTL', async () => {
    await i18n.changeLanguage('ar')
    const user = userEvent.setup()
    renderAdminsPage()
    await screen.findAllByText('admin@admin.com')
    await user.click(screen.getByRole('button', { name: 'إضافة مشرف' }))

    expect(screen.getByRole('textbox', { name: 'البريد الإلكتروني' })).toHaveAttribute('dir', 'ltr')
    const roles = screen.getByRole('button', { name: 'الأدوار' })
    expect(roles).toHaveAttribute('dir', 'rtl')
    await user.click(roles)
    await user.click(await screen.findByRole('option', { name: 'Super Admin' }))
    expect(roles).toHaveTextContent('Super Admin')
  })
})
