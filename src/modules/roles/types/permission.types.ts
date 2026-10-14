import type { z } from 'zod'
import type {
  permissionSchema,
  permissionGroupSchema,
  permissionsIndexSchema,
} from '@/modules/roles/schemas/permission.schema'

export type Permission = z.infer<typeof permissionSchema>
export type PermissionGroup = z.infer<typeof permissionGroupSchema>
export type PermissionsIndexResponse = z.infer<typeof permissionsIndexSchema>
