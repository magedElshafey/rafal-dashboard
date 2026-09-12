import { useMemo } from 'react'
import type { BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { FormMultiSelect } from '@/components/form/FormMultiSelect'
import { usePermissions } from '@/modules/roles/hooks/usePermissions'
import { createRoleSchema } from '@/modules/roles/schemas/role.schema'
import type { Permission } from '@/modules/roles/types/permission.types'
import type { Role, RoleFormValues } from '@/modules/roles/types/role.types'
import { applyApiValidationErrors } from '@/modules/roles/utils/role-form-error'

export type RoleSubmitIntent = 'create' | 'create-another' | 'edit'

type RoleFormProps = {
  formId: string
  role?: Role
  isSubmitting: boolean
  onDirtyChange: (isDirty: boolean) => void
  onSubmit: (values: RoleFormValues, intent: RoleSubmitIntent, methods: UseFormReturn<RoleFormValues>) => Promise<void>
}

const EMPTY_VALUES: RoleFormValues = { name: '', permissions: [] }

export function RoleForm({ formId, role, isSubmitting, onDirtyChange, onSubmit }: RoleFormProps) {
  const { t } = useTranslation()
  const schema = useMemo(() => createRoleSchema(t('roles.validation.nameRequired')), [t])
  const permissionsQuery = usePermissions()
  const permissions = useMemo(
    () => permissionsQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [permissionsQuery.data]
  )
  const resetValues = useMemo<RoleFormValues>(
    () => (role ? { name: role.name, permissions: role.permissions } : EMPTY_VALUES),
    [role]
  )

  const handleSubmit = async (
    values: RoleFormValues,
    methods: UseFormReturn<RoleFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? (role ? 'edit' : 'create')) as RoleSubmitIntent

    const normalized = { ...values, name: values.name.trim(), permissions: [...new Set(values.permissions)] }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError)
    }
  }

  return (
    <FormWrapper<RoleFormValues>
      schema={schema}
      defaultValues={EMPTY_VALUES}
      resetValues={resetValues}
      resetValuesKey={role?.id ?? 'create'}
      formId={formId}
      className="space-y-7"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      <FormInput
        name="name"
        label={t('roles.roleName')}
        placeholder={t('roles.form.namePlaceholder')}
        required
        autoComplete="off"
        autoFocus
      />

      <FormMultiSelect<Permission, RoleFormValues>
        name="permissions"
        label={t('roles.permissions')}
        data={permissions}
        valueKey="name"
        labelKey="name"
        placeholder={t('roles.form.permissionsPlaceholder')}
        searchable={false}
        showSelectAll={false}
        maxCount={2}
        disabled={isSubmitting}
        isLoading={permissionsQuery.isLoading}
        isFetchingNextPage={permissionsQuery.isFetchingNextPage}
        isError={permissionsQuery.isError}
        isRetrying={permissionsQuery.isFetching}
        hasNextPage={permissionsQuery.hasNextPage}
        onLoadMore={permissionsQuery.fetchNextPage}
        onRetry={permissionsQuery.refetch}
        emptyMessage={t('roles.form.permissionsEmpty')}
        loadingMessage={t('roles.form.permissionsLoading')}
        loadMoreMessage={t('roles.form.permissionsLoadMore')}
        errorMessage={t('roles.form.permissionsError')}
        retryLabel={t('roles.form.permissionsRetry')}
        clearLabel={t('roles.form.permissionsClear')}
      />
    </FormWrapper>
  )
}
