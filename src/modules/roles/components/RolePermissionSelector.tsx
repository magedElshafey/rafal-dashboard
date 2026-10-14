import { useId } from 'react'
import { Minus } from 'lucide-react'
import { useController, useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'
import { Checkbox } from '@/components/ui/checkbox'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { usePermissions } from '@/modules/roles/hooks/usePermissions'
import type { RoleFormValues } from '@/modules/roles/types/role.types'
import { permissionLabel } from '@/modules/roles/utils/permission-label'

export function RolePermissionSelector({ disabled }: { disabled: boolean }) {
  const { t, i18n } = useTranslation()
  const id = useId()
  const { control } = useFormContext<RoleFormValues>()
  const { field, fieldState } = useController({ control, name: 'permissions' })
  const query = usePermissions()
  const groups = query.data ?? []
  const firstPermissionName = groups.find((group) => group.permissions.length > 0)?.permissions[0].name
  const selected = new Set(field.value)
  const catalogNames = new Set(groups.flatMap((group) => group.permissions.map((permission) => permission.name)))
  const unavailable = field.value.filter((name) => !catalogNames.has(name))
  const errorId = `${id}-error`
  const changeGroup = (names: string[], checked: boolean) => {
    const groupNames = new Set(names)
    field.onChange(
      checked ? [...new Set([...field.value, ...names])] : field.value.filter((name) => !groupNames.has(name))
    )
  }

  return (
    <fieldset className="min-w-0 space-y-4" dir={i18n.dir()} aria-describedby={fieldState.error ? errorId : undefined}>
      <legend className="mb-3 text-sm font-medium">{t('roles.permissions')}</legend>
      {query.isLoading ? (
        <div role="status" aria-busy="true" className="space-y-3">
          <span className="sr-only">{t('roles.form.permissionsLoading')}</span>
          {[0, 1, 2].map((index) => (
            <Skeleton key={index} className="h-24 w-full rounded-lg" />
          ))}
        </div>
      ) : null}
      {query.isError ? (
        <div role="alert" className="space-y-2 text-sm">
          <p>{t('roles.form.permissionsError')}</p>
          <Button
            type="button"
            variant="outline"
            disabled={query.isFetching || disabled}
            onClick={() => void query.refetch()}
          >
            {t('roles.form.permissionsRetry')}
          </Button>
        </div>
      ) : null}
      {query.isSuccess && groups.every((group) => group.permissions.length === 0) ? (
        <p role="status" className="text-sm text-muted-foreground">
          {t('roles.form.permissionsEmpty')}
        </p>
      ) : null}
      {groups.map((group, groupIndex) => {
        const label = permissionLabel(group.label, i18n.language, group.group)
        const names = group.permissions.map((permission) => permission.name)
        const count = names.filter((name) => selected.has(name)).length
        const all = names.length > 0 && count === names.length
        const checked = all ? true : count > 0 ? 'indeterminate' : false
        const groupId = `${id}-group-${groupIndex}`
        return (
          <fieldset key={group.group} className="min-w-0 rounded-lg border border-border p-3">
            <legend className="max-w-full px-1 text-sm font-semibold break-words">
              <bdi>{label}</bdi>
            </legend>
            <div className="mb-3 flex items-center gap-2">
              <span className="relative inline-flex shrink-0">
                <Checkbox
                  id={groupId}
                  checked={checked}
                  className="data-[state=indeterminate]:bg-primary/20 [&[data-state=indeterminate]_svg]:invisible"
                  disabled={disabled || query.isError || names.length === 0}
                  onBlur={field.onBlur}
                  onCheckedChange={(value) => changeGroup(names, value === true)}
                  aria-describedby={fieldState.error ? errorId : undefined}
                  aria-invalid={!!fieldState.error}
                />
                {checked === 'indeterminate' ? (
                  <Minus aria-hidden="true" className="pointer-events-none absolute inset-0 m-auto size-3" />
                ) : null}
              </span>
              <label htmlFor={groupId} className="min-w-0 cursor-pointer text-sm break-words">
                {t(all ? 'roles.form.deselectGroup' : 'roles.form.selectGroup', { group: label })}
              </label>
              <span className="ms-auto shrink-0 text-xs text-muted-foreground">
                <span aria-hidden="true">
                  {count} / {names.length}
                </span>
                <span className="sr-only">{t('roles.form.selectedCount', { count, total: names.length })}</span>
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {group.permissions.map((permission) => {
                const permissionId = `${groupId}-${permission.id}`
                return (
                  <div key={permission.name} className="flex min-w-0 items-start gap-2">
                    <Checkbox
                      id={permissionId}
                      ref={permission.name === firstPermissionName ? field.ref : undefined}
                      className="mt-0.5"
                      checked={selected.has(permission.name)}
                      disabled={disabled || query.isError}
                      onBlur={field.onBlur}
                      aria-describedby={fieldState.error ? errorId : undefined}
                      aria-invalid={!!fieldState.error}
                      onCheckedChange={(value) => changeGroup([permission.name], value === true)}
                    />
                    <label htmlFor={permissionId} className="min-w-0 cursor-pointer text-sm break-words">
                      <bdi>{permissionLabel(permission.label, i18n.language, permission.name)}</bdi>
                    </label>
                  </div>
                )
              })}
            </div>
          </fieldset>
        )
      })}
      {unavailable.length > 0 ? (
        <section
          aria-label={t('roles.form.retainedPermissions')}
          className="space-y-2 rounded-lg border border-border p-3 text-sm"
        >
          <h3 className="font-medium">{t('roles.form.retainedPermissions')}</h3>
          <p className="text-muted-foreground">{t('roles.form.retainedDescription')}</p>
          <ul className="space-y-1">
            {unavailable.map((name) => (
              <li key={name} className="break-words">
                <bdi>{name}</bdi>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      {fieldState.error ? (
        <p id={errorId} role="alert" className="text-sm text-destructive">
          {fieldState.error.message}
        </p>
      ) : null}
    </fieldset>
  )
}
