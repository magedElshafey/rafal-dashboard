import { useTranslation } from 'react-i18next'

import { Badge } from '@/components/ui/badge'

type AdminRolesProps = {
  roles: readonly string[]
}

export function AdminRoles({ roles }: AdminRolesProps) {
  const { t } = useTranslation()
  const visible = roles.slice(0, 2)
  const remaining = roles.length - visible.length

  if (roles.length === 0) return <span className="text-sm text-muted-foreground">{t('admins.noRoles')}</span>

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5" aria-label={t('admins.roles')}>
      {visible.map((role) => (
        <Badge key={role} variant="secondary" className="max-w-44 truncate">
          {role}
        </Badge>
      ))}
      {remaining > 0 ? (
        <Badge variant="outline" aria-label={t('admins.moreRoles', { count: remaining })}>
          +{remaining}
        </Badge>
      ) : null}
    </div>
  )
}
