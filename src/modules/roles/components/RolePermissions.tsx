import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

type RolePermissionsProps = {
  permissions: readonly string[]
}

export function RolePermissions({ permissions }: RolePermissionsProps) {
  const { t } = useTranslation()
  const visible = permissions.slice(0, 2)
  const remaining = permissions.length - visible.length

  if (permissions.length === 0) {
    return <span className="text-sm text-muted-foreground">{t('roles.noPermissions')}</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5" aria-label={t('roles.permissions')}>
      {visible.map((permission) => (
        <Badge key={permission} variant="secondary" className="max-w-44 truncate">
          {permission}
        </Badge>
      ))}
      {remaining > 0 ? (
        <Badge variant="outline" aria-label={t('roles.morePermissions', { count: remaining })}>
          +{remaining}
        </Badge>
      ) : null}
    </div>
  )
}
