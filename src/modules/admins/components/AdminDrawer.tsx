import { useCallback, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { AdminForm, type AdminSubmitIntent, EMPTY_ADMIN_FORM_VALUES } from '@/modules/admins/components/AdminForm'
import { AdminFormSkeleton } from '@/modules/admins/components/AdminFormSkeleton'
import { useAdmin } from '@/modules/admins/hooks/useAdmin'
import { useCreateAdmin } from '@/modules/admins/hooks/useCreateAdmin'
import { useUpdateAdmin } from '@/modules/admins/hooks/useUpdateAdmin'
import type { AdminFormValues } from '@/modules/admins/types/admin.types'

type AdminDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  adminId: number | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'admin-form'

export function AdminDrawer({ open, mode, adminId, onOpenChange }: AdminDrawerProps) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const submissionLockRef = useRef(false)
  const detail = useAdmin(adminId, open && mode === 'edit')
  const createAdmin = useCreateAdmin()
  const updateAdmin = useUpdateAdmin(adminId)
  const isSubmitting = createAdmin.isPending || updateAdmin.isPending
  const isDetailLoading = mode === 'edit' && detail.isFetching && !detail.isError
  const isDetailError = mode === 'edit' && detail.isError
  const isDetailReady = mode === 'create' || detail.isSuccess

  const handleDirtyChange = useCallback((nextIsDirty: boolean) => setIsDirty(nextIsDirty), [])

  const handleSubmit = async (
    values: AdminFormValues,
    intent: AdminSubmitIntent,
    methods: UseFormReturn<AdminFormValues>
  ) => {
    if (submissionLockRef.current || (mode === 'edit' && !isDirty)) return
    submissionLockRef.current = true

    try {
      if (mode === 'create') {
        await createAdmin.mutateAsync({
          name: values.name,
          email: values.email,
          password: values.password,
          passwordConfirmation: values.passwordConfirmation,
          roles: values.roles,
        })
        methods.reset(EMPTY_ADMIN_FORM_VALUES)
        if (intent === 'create-another') {
          window.requestAnimationFrame(() => methods.setFocus('name'))
          return
        }
        onOpenChange(false)
        return
      }

      const response = await updateAdmin.mutateAsync({ name: values.name, email: values.email, roles: values.roles })
      methods.reset({
        name: response.data.name,
        email: response.data.email,
        roles: response.data.roles,
        password: '',
        passwordConfirmation: '',
      })
      onOpenChange(false)
    } finally {
      submissionLockRef.current = false
    }
  }

  const errorContent = isDetailError ? (
    <QueryStateNotice kind="loading-error" isRetrying={detail.isFetching} onRetry={() => void detail.refetch()} />
  ) : undefined

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('admins.createAdmin'), edit: t('admins.editAdmin') }}
      descriptions={{ create: t('admins.form.createDescription'), edit: t('admins.form.editDescription') }}
      submitLabels={{ create: t('admins.actions.create'), edit: t('admins.actions.update') }}
      createAnotherLabel={t('admins.actions.createAnother')}
      cancelLabel={t('admins.actions.cancel')}
      closeLabel={t('admins.actions.close')}
      formId={FORM_ID}
      isLoading={isDetailLoading}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isDetailReady)}
      loadingContent={<AdminFormSkeleton />}
      errorContent={errorContent}
    >
      {isDetailReady ? (
        <AdminForm
          key={`${mode}-${adminId ?? 'new'}-${open}`}
          formId={FORM_ID}
          mode={mode}
          admin={detail.data?.data}
          isSubmitting={isSubmitting}
          onDirtyChange={handleDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
