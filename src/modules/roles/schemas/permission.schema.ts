import { z } from 'zod'

// Missing translations fall back at display time; identifiers are never transformed.
const labelSchema = z.object({ ar: z.string().nullish(), en: z.string().nullish() }).nullish()
const identifierSchema = z
  .string()
  .min(1)
  .refine((value) => value.trim().length > 0)
export const permissionSchema = z.object({
  id: z.number().int().positive().safe(),
  name: identifierSchema,
  group: identifierSchema,
  label: labelSchema,
})
export const permissionGroupSchema = z.object({
  group: identifierSchema,
  label: labelSchema,
  permissions: z.array(permissionSchema),
})
export const permissionsIndexSchema = z
  .object({
    success: z.literal(true),
    message: z.string(),
    data: z.array(permissionGroupSchema),
  })
  .superRefine(({ data }, context) => {
    const groups = new Set<string>()
    const names = new Set<string>()
    const ids = new Set<number>()
    data.forEach((group, groupIndex) => {
      if (groups.has(group.group)) {
        context.addIssue({ code: 'custom', path: ['data', groupIndex, 'group'], message: 'Duplicate permission group' })
      }
      groups.add(group.group)
      group.permissions.forEach((permission, index) => {
        if (permission.group !== group.group || names.has(permission.name) || ids.has(permission.id)) {
          context.addIssue({
            code: 'custom',
            path: ['data', groupIndex, 'permissions', index],
            message: 'Inconsistent permission catalog',
          })
        }
        names.add(permission.name)
        ids.add(permission.id)
      })
    })
  })
