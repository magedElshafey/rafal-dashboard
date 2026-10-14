import type { PermissionGroup } from '@/modules/roles/types/permission.types'

export function permissionLabel(label: PermissionGroup['label'], language: string, identifier: string) {
  const arabic = language.startsWith('ar')
  return (
    (arabic ? label?.ar?.trim() : label?.en?.trim()) || (arabic ? label?.en?.trim() : label?.ar?.trim()) || identifier
  )
}
