import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import '@/config/i18'
import i18n from '@/config/i18'
import { RolesList } from '@/modules/roles/components/RolesList'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { permissionsKeys } from '@/modules/roles/queries/permissions.keys'
import { granularPermissionCatalog } from '@/modules/roles/fixtures/permissions.fixture'
import type { Role } from '@/modules/roles/types/role.types'
import type { PermissionGroup } from '@/modules/roles/types/permission.types'

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)
let catalog: PermissionGroup[]
const role: Role = {
  id: 9,
  name: 'Warehouse Reviewer / مشرف',
  permissions: ['products.create', 'products.view', 'returns.reject', 'Legacy.Mixed-Permission'],
}

beforeEach(async () => {
  await i18n.changeLanguage('en')
  catalog = granularPermissionCatalog()
  catalog[0].permissions.push({
    id: 203,
    name: 'products.create',
    group: 'products',
    label: { en: 'Create products', ar: 'إضافة المنتجات' },
  })
  vi.spyOn(permissionsService, 'list').mockImplementation(async () => catalog)
})
afterEach(() => vi.restoreAllMocks())

function renderList(roles: Role[] = [role]) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
  const view = render(
    <QueryClientProvider client={client}>
      <RolesList roles={roles} onEdit={vi.fn()} onDelete={vi.fn()} />
    </QueryClientProvider>
  )
  return { ...view, client }
}

it.each(['en', 'ar'])(
  'uses backend %s labels in the same order on desktop and mobile without translating role names',
  async (language) => {
    await i18n.changeLanguage(language)
    const { container } = renderList()
    const labels = language === 'ar' ? ['إضافة المنتجات', 'عرض المنتجات'] : ['Create products', 'View products']
    expect(await screen.findAllByText(labels[0])).toHaveLength(2)
    expect(screen.getAllByText(role.name)).toHaveLength(2)
    for (const slot of ['responsive-data-desktop', 'responsive-data-mobile-cards']) {
      const layout = container.querySelector('[data-slot="' + slot + '"]') as HTMLElement
      const badges = layout.querySelectorAll('[data-slot="badge"]')
      expect([...badges].map((badge) => badge.textContent)).toEqual(labels)
      expect(
        within(layout).getByRole('button', { name: i18n.t('roles.morePermissions', { count: 2 }) })
      ).toHaveTextContent('+2')
      expect(badges[0].parentElement).toHaveAttribute('dir', language === 'ar' ? 'rtl' : 'ltr')
    }
    expect(permissionsService.list).toHaveBeenCalledExactlyOnceWith(expect.any(AbortSignal))
  }
)

it('exposes remaining labels through the shared keyboard-accessible popover and restores focus', async () => {
  const user = userEvent.setup()
  renderList()
  await screen.findAllByText('Create products')
  expect(screen.queryByText('Reject returns')).not.toBeInTheDocument()
  const trigger = screen.getAllByRole('button', { name: '2 more permissions' })[0]
  trigger.focus()
  await user.keyboard('{Enter}')
  const popup = await screen.findByRole('dialog', { name: 'Permissions' })
  expect(
    within(popup)
      .getAllByRole('listitem')
      .map((item) => item.textContent)
  ).toEqual(['Reject returns', 'Legacy.Mixed-Permission'])
  expect(within(popup).getByText('Legacy.Mixed-Permission').tagName).toBe('BDI')
  await user.keyboard('{Escape}')
  await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  expect(trigger).toHaveFocus()
  expect(permissionsService.list).toHaveBeenCalledTimes(1)
})

it('uses exact identifier fallback, including casing, and isolates mixed-direction text', async () => {
  renderList([{ ...role, permissions: ['Products.Create', 'unknown.حساسة'] }])
  await waitFor(() => expect(permissionsService.list).toHaveBeenCalledTimes(1))
  expect(screen.getAllByText('Products.Create')).toHaveLength(2)
  expect(screen.getAllByText('unknown.حساسة')).toHaveLength(2)
  for (const node of screen.getAllByText('Products.Create')) expect(node.tagName).toBe('BDI')
  expect(screen.queryByText('Create products')).not.toBeInTheDocument()
  expect(screen.queryByRole('button', { name: /more permission/ })).not.toBeInTheDocument()
})

it('keeps long labels available as text and title without changing the compact summary', async () => {
  const label = 'A very long backend permission label '.repeat(10)
  catalog[0].permissions.find((permission) => permission.name === 'products.create')!.label = { en: label }
  renderList()
  await waitFor(() => expect(screen.getAllByTitle(label.trim())).toHaveLength(2))
  expect(screen.getAllByTitle(label.trim())[0].textContent).toBe(label.trim())
  expect(screen.getAllByRole('button', { name: '2 more permissions' })).toHaveLength(2)
})

it('keeps rows and exact fallbacks available while the catalog loads, then replaces only display labels', async () => {
  let resolve!: (groups: PermissionGroup[]) => void
  vi.mocked(permissionsService.list).mockImplementationOnce(
    () =>
      new Promise((done) => {
        resolve = done
      })
  )
  renderList()
  expect(screen.getAllByText(role.name)).toHaveLength(2)
  expect(screen.getAllByText('products.create')).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: 'Actions for ' + role.name })[0]).toBeEnabled()
  await act(async () => resolve(catalog))
  expect(await screen.findAllByText('Create products')).toHaveLength(2)
  expect(role.permissions).toEqual(['products.create', 'products.view', 'returns.reject', 'Legacy.Mixed-Permission'])
})

it.each([403, 500])('keeps the list usable when optional catalog metadata fails with %s', async (status) => {
  vi.mocked(permissionsService.list).mockRejectedValueOnce({ isAxiosError: true, response: { status } })
  const { client } = renderList()
  await waitFor(() => expect(client.getQueryState(permissionsKeys.list())?.status).toBe('error'))
  expect(screen.getAllByText(role.name)).toHaveLength(2)
  expect(screen.getAllByText('products.create')).toHaveLength(2)
  expect(screen.getAllByRole('button', { name: 'Actions for ' + role.name })[0]).toBeEnabled()
  expect(permissionsService.list).toHaveBeenCalledTimes(1)
})

it('handles an empty catalog without losing role assignments or an empty-role summary', async () => {
  catalog = []
  const { client } = renderList([role, { id: 10, name: 'Empty role', permissions: [] }])
  await waitFor(() => expect(client.getQueryState(permissionsKeys.list())?.status).toBe('success'))
  expect(screen.getAllByText('products.create')).toHaveLength(2)
  expect(screen.getAllByText('No permissions')).toHaveLength(2)
})

it('shares one catalog request across many rows and reuses it when the UI language changes', async () => {
  renderList(Array.from({ length: 20 }, (_, id) => ({ ...role, id: id + 1, name: 'Role ' + id })))
  expect(await screen.findAllByText('Create products')).toHaveLength(40)
  await act(async () => {
    await i18n.changeLanguage('ar')
  })
  expect(screen.getAllByText('إضافة المنتجات')).toHaveLength(40)
  expect(permissionsService.list).toHaveBeenCalledTimes(1)
})
