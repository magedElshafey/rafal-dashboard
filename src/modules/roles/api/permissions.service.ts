import { permissionsIndexSchema } from '@/modules/roles/schemas/permission.schema'
import type { PermissionGroup } from '@/modules/roles/types/permission.types'
import { $http } from '@/utils/http'

export const permissionsService = {
  async list(signal?: AbortSignal): Promise<PermissionGroup[]> {
    const response = await $http.get<unknown>({
      url: '/dashboard/permissions',
      signal,
      suppressErrorNotification: true,
      // Catalog labels are optional metadata; a denial must not replace a usable Roles list.
      suppressForbiddenRedirect: true,
    })
    return permissionsIndexSchema.parse(response.data).data
  },
}
