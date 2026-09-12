import type { BaseSyntheticEvent } from 'react'
import { useMemo } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormWrapper } from '@/components/core/FormWrapper'
import { FormInput } from '@/components/form/FormInput'
import { FormMultiSelect } from '@/components/form/FormMultiSelect'
import { FormPasswordInput } from '@/components/form/FormPasswordInput'
import { useRoles } from '@/modules/roles/hooks/useRoles'
import type { Role } from '@/modules/roles/types/role.types'
import { createAdminSchema } from '@/modules/admins/schemas/admin.schema'
import type { Admin, AdminFormValues } from '@/modules/admins/types/admin.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

export type AdminSubmitIntent = 'create' | 'create-another' | 'edit'

type AdminFormProps = {
  formId: string
  mode: 'create' | 'edit'
  admin?: Admin
  isSubmitting: boolean
  onDirtyChange: (isDirty: boolean) => void
  onSubmit: (
    values: AdminFormValues,
    intent: AdminSubmitIntent,
    methods: UseFormReturn<AdminFormValues>
  ) => Promise<void>
}

export const EMPTY_ADMIN_FORM_VALUES: AdminFormValues = {
  name: '',
  email: '',
  password: '',
  passwordConfirmation: '',
  roles: [],
}

export function AdminForm({ formId, mode, admin, isSubmitting, onDirtyChange, onSubmit }: AdminFormProps) {
  const { t } = useTranslation()
  const rolesQuery = useRoles()
  const roles = useMemo(() => rolesQuery.data?.pages.flatMap((page) => page.items) ?? [], [rolesQuery.data])
  const schema = useMemo(
    () =>
      createAdminSchema(mode, {
        nameRequired: t('admins.validation.nameRequired'),
        emailRequired: t('admins.validation.emailRequired'),
        emailInvalid: t('admins.validation.emailInvalid'),
        passwordRequired: t('admins.validation.passwordRequired'),
        passwordConfirmationRequired: t('admins.validation.passwordConfirmationRequired'),
        passwordMismatch: t('admins.validation.passwordMismatch'),
      }),
    [mode, t]
  )
  const resetValues = useMemo<AdminFormValues>(
    () =>
      admin
        ? { name: admin.name, email: admin.email, roles: admin.roles, password: '', passwordConfirmation: '' }
        : EMPTY_ADMIN_FORM_VALUES,
    [admin]
  )

  const handleSubmit = async (
    values: AdminFormValues,
    methods: UseFormReturn<AdminFormValues>,
    event?: BaseSyntheticEvent
  ) => {
    const submitter = (event?.nativeEvent as SubmitEvent | undefined)?.submitter as HTMLButtonElement | null
    const intent = (submitter?.dataset.submitIntent ?? mode) as AdminSubmitIntent
    const normalized: AdminFormValues = {
      ...values,
      name: values.name.trim(),
      email: values.email.trim(),
      roles: [...new Set(values.roles)],
    }

    try {
      await onSubmit(normalized, intent, methods)
    } catch (error) {
      applyApiValidationErrors(error, methods.setError, { password_confirmation: 'passwordConfirmation' })
    }
  }

  return (
    <FormWrapper<AdminFormValues>
      schema={schema}
      defaultValues={EMPTY_ADMIN_FORM_VALUES}
      resetValues={resetValues}
      resetValuesKey={admin?.id ?? 'create'}
      formId={formId}
      className="space-y-7"
      submissionDisabled={isSubmitting}
      onFormStateChange={({ isDirty }) => onDirtyChange(isDirty)}
      onSubmit={handleSubmit}
    >
      <FormInput
        name="name"
        label={t('admins.name')}
        placeholder={t('admins.form.namePlaceholder')}
        autoComplete="name"
        required
        autoFocus
      />
      <FormInput
        name="email"
        label={t('admins.email')}
        placeholder={t('admins.form.emailPlaceholder')}
        type="email"
        autoComplete="email"
        inputMode="email"
        dir="ltr"
        className="normal-case"
        required
      />

      {mode === 'create' ? (
        <>
          <FormPasswordInput name="password" label={t('admins.password')} autoComplete="new-password" required />
          <FormPasswordInput
            name="passwordConfirmation"
            label={t('admins.passwordConfirmation')}
            autoComplete="new-password"
            required
          />
        </>
      ) : null}

      <FormMultiSelect<Role, AdminFormValues>
        name="roles"
        label={t('admins.roles')}
        data={roles}
        valueKey="name"
        labelKey="name"
        placeholder={t('admins.form.rolesPlaceholder')}
        searchable={false}
        showSelectAll={false}
        maxCount={2}
        disabled={isSubmitting}
        isLoading={rolesQuery.isLoading}
        isFetchingNextPage={rolesQuery.isFetchingNextPage}
        isError={rolesQuery.isError}
        isRetrying={rolesQuery.isFetching}
        hasNextPage={rolesQuery.hasNextPage}
        onLoadMore={rolesQuery.fetchNextPage}
        onRetry={rolesQuery.refetch}
        emptyMessage={t('admins.form.rolesEmpty')}
        loadingMessage={t('admins.form.rolesLoading')}
        loadMoreMessage={t('admins.form.rolesLoadMore')}
        errorMessage={t('admins.form.rolesError')}
        retryLabel={t('admins.form.rolesRetry')}
        clearLabel={t('admins.form.rolesClear')}
      />
    </FormWrapper>
  )
}
