import { useMemo, useRef } from 'react'
import type { BaseSyntheticEvent } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { RolePermissionSelector } from '@/modules/roles/components/RolePermissionSelector'
import { createRoleSchema } from '@/modules/roles/schemas/role.schema'
import type { Role, RoleFormValues } from '@/modules/roles/types/role.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

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
  const submissionLock = useRef(false)
  const schema = useMemo(
    () =>
      createRoleSchema({
        nameRequired: t('roles.validation.nameRequired'),
        permissionsRequired: t('roles.validation.permissionsRequired'),
      }),
    [t]
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
    if (submissionLock.current) return
    submissionLock.current = true
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? (role ? 'edit' : 'create')) as RoleSubmitIntent

    const normalized = { ...values, name: values.name.trim(), permissions: [...new Set(values.permissions)] }
    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, { 'permissions.*': 'permissions' })
    } finally {
      submissionLock.current = false
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

      <RolePermissionSelector disabled={isSubmitting} />
    </FormWrapper>
  )
}
