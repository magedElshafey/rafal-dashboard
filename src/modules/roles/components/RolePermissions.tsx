import { useTranslation } from 'react-i18next'
import { Badge } from '@/components/ui/badge'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'

type RolePermissionsProps = {
  permissions: readonly string[]
  labels: ReadonlyMap<string, string>
}

export function RolePermissions({ permissions, labels }: RolePermissionsProps) {
  const { t, i18n } = useTranslation()
  const visible = permissions.slice(0, 2)
  const hidden = permissions.slice(2)
  const displayLabel = (name: string) => labels.get(name) ?? name

  if (permissions.length === 0) {
    return <span className="text-sm text-muted-foreground">{t('roles.noPermissions')}</span>
  }

  return (
    <div className="flex min-w-0 flex-wrap gap-1.5 normal-case" dir={i18n.dir()}>
      {visible.map((permission) => (
        <Badge
          key={permission}
          variant="secondary"
          className="min-w-0 max-w-44 shrink"
          title={displayLabel(permission)}
        >
          <bdi className="truncate">{displayLabel(permission)}</bdi>
        </Badge>
      ))}
      {hidden.length > 0 ? (
        <Popover>
          <PopoverTrigger asChild>
            <Badge asChild variant="outline" className="cursor-pointer hover:bg-accent hover:text-accent-foreground">
              <button type="button" aria-label={t('roles.morePermissions', { count: hidden.length })}>
                <bdi>+{hidden.length}</bdi>
              </button>
            </Badge>
          </PopoverTrigger>
          <PopoverContent
            align="start"
            dir={i18n.dir()}
            aria-label={t('roles.permissions')}
            className="max-w-[calc(100vw-2rem)]"
          >
            <ul
              tabIndex={0}
              className="max-h-60 space-y-2 overflow-y-auto rounded-sm text-sm normal-case focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {hidden.map((permission) => (
                <li key={permission} className="break-words">
                  <bdi>{displayLabel(permission)}</bdi>
                </li>
              ))}
            </ul>
          </PopoverContent>
        </Popover>
      ) : null}
    </div>
  )
}
