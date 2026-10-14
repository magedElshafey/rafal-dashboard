import { beforeEach, describe, expect, it, vi } from 'vitest'
import { syntheticPermissionCatalog } from '@/modules/roles/fixtures/permissions.fixture'
const httpMocks = vi.hoisted(() => ({ get: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: httpMocks }))
import { permissionsService } from '@/modules/roles/api/permissions.service'

describe('grouped permissions service', () => {
  beforeEach(() => vi.clearAllMocks())
  it('preserves every group, exact identifier, localized label and backend order without pagination', async () => {
    const groups = syntheticPermissionCatalog()
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: groups } })
    const signal = new AbortController().signal
    const result = await permissionsService.list(signal)
    expect(result).toEqual(groups)
    expect(result).toHaveLength(19)
    expect(result.flatMap((group) => group.permissions)).toHaveLength(65)
    expect(httpMocks.get).toHaveBeenCalledExactlyOnceWith({
      url: '/dashboard/permissions',
      signal,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
  })
  it('accepts missing translations and empty groups without inventing labels or permissions', async () => {
    const data = [
      { group: 'empty', permissions: [] },
      {
        group: 'custom',
        label: { ar: null },
        permissions: [{ id: 100, name: 'Exact.Mixed-Operation', group: 'custom', label: { en: 'Custom action' } }],
      },
    ]
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data } })
    await expect(permissionsService.list()).resolves.toEqual(data)
  })
  it.each([
    { success: false, message: 'failed', data: [] },
    { success: true, message: 'ok', data: [{ id: 1, name: 'legacy flat item' }] },
    { success: true, message: 'ok', data: [{ group: 'products', permissions: 'invalid' }] },
    {
      success: true,
      message: 'ok',
      data: [{ group: 'products', permissions: [{ id: 0, name: 'products.view', group: 'products' }] }],
    },
    {
      success: true,
      message: 'ok',
      data: [{ group: 'products', permissions: [{ id: 1, name: 'products.view', group: 'orders' }] }],
    },
    { success: true, message: 'ok', data: [{ group: 'products', label: { en: 123 }, permissions: [] }] },
  ])('rejects malformed catalogs instead of fabricating assignments (%#)', async (data) => {
    httpMocks.get.mockResolvedValue({ data })
    await expect(permissionsService.list()).rejects.toThrow()
  })
  it.each(['id', 'name', 'group'])('rejects duplicate %s identifiers', async (key) => {
    const groups = syntheticPermissionCatalog()
    if (key === 'group') groups[1].group = groups[0].group
    else if (key === 'id') groups[1].permissions[0].id = groups[0].permissions[0].id
    else groups[1].permissions[0].name = groups[0].permissions[0].name
    httpMocks.get.mockResolvedValue({ data: { success: true, message: 'ok', data: groups } })
    await expect(permissionsService.list()).rejects.toThrow()
  })
  it('propagates authorization failure without inventing an empty catalog', async () => {
    const error = { response: { status: 403 } }
    httpMocks.get.mockRejectedValue(error)
    await expect(permissionsService.list()).rejects.toBe(error)
  })
})
