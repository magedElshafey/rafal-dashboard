import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { act, render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, beforeEach, expect, it, vi } from 'vitest'
import '@/config/i18'
import i18n from '@/config/i18'
import { RoleDrawer } from '@/modules/roles/components/RoleDrawer'
import { rolesService } from '@/modules/roles/api/roles.service'
import { permissionsService } from '@/modules/roles/api/permissions.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'
import { granularPermissionCatalog } from '@/modules/roles/fixtures/permissions.fixture'
import type { RoleResponse } from '@/modules/roles/types/role.types'

vi.stubGlobal(
  'ResizeObserver',
  class {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
)

vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

beforeEach(async () => {
  await i18n.changeLanguage('en')
  vi.spyOn(permissionsService, 'list').mockResolvedValue(granularPermissionCatalog())
  vi.spyOn(rolesService, 'show').mockResolvedValue({
    success: true,
    message: 'ok',
    data: { id: 2, name: 'Inventory', permissions: ['products.view'] },
  })
})
afterEach(() => vi.restoreAllMocks())

it.each(['success', 'failure'])(
  'preserves the Edit draft through a pending and %s background refetch',
  async (outcome) => {
    const client = new QueryClient({ defaultOptions: { queries: { retry: false, gcTime: 0 } } })
    const user = userEvent.setup()
    render(
      <QueryClientProvider client={client}>
        <RoleDrawer open mode="edit" roleId={2} onOpenChange={vi.fn()} />
      </QueryClientProvider>
    )
    const name = await screen.findByRole('textbox', { name: /Role Name/ })
    await user.clear(name)
    await user.type(name, 'Unsaved inventory')
    await user.click(await screen.findByRole('checkbox', { name: 'Manage stock' }))
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()

    let resolve!: (value: RoleResponse) => void
    let reject!: (error: unknown) => void
    vi.mocked(rolesService.show).mockImplementationOnce(
      () =>
        new Promise((done, fail) => {
          resolve = done
          reject = fail
        })
    )
    act(() => {
      void client.refetchQueries({ queryKey: rolesKeys.detail(2), exact: true })
    })
    await waitFor(() => expect(client.isFetching({ queryKey: rolesKeys.detail(2) })).toBe(1))
    expect(name).toBeInTheDocument()
    expect(name).toHaveValue('Unsaved inventory')
    expect(screen.getByRole('checkbox', { name: 'Manage stock' })).toBeChecked()
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()

    await act(async () => {
      if (outcome === 'success')
        resolve({
          success: true,
          message: 'ok',
          data: { id: 2, name: 'Server changed name', permissions: ['returns.reject'] },
        })
      else reject(new Error('Background request failed'))
    })
    await waitFor(() => expect(client.isFetching({ queryKey: rolesKeys.detail(2) })).toBe(0))
    expect(screen.getByRole('textbox', { name: /Role Name/ })).toBe(name)
    expect(name).toHaveValue('Unsaved inventory')
    expect(screen.getByRole('checkbox', { name: 'View products' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Manage stock' })).toBeChecked()
    expect(screen.getByRole('checkbox', { name: 'Reject returns' })).not.toBeChecked()
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled()
    expect(screen.queryByTestId('query-state-loading-error')).not.toBeInTheDocument()
    if (outcome === 'failure') {
      expect(screen.getByTestId('query-state-refetch-error')).toBeInTheDocument()
      await user.click(screen.getByRole('button', { name: /try again/i }))
      await waitFor(() => expect(screen.queryByTestId('query-state-refetch-error')).not.toBeInTheDocument())
      expect(name).toHaveValue('Unsaved inventory')
      expect(screen.getByRole('checkbox', { name: 'Manage stock' })).toBeChecked()
    }
  }
)
