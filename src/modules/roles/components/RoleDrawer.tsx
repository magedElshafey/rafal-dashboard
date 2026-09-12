import { useCallback, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { RoleForm, type RoleSubmitIntent } from '@/modules/roles/components/RoleForm'
import { RoleFormSkeleton } from '@/modules/roles/components/RoleFormSkeleton'
import { useCreateRole } from '@/modules/roles/hooks/useCreateRole'
import { useRole } from '@/modules/roles/hooks/useRole'
import { useUpdateRole } from '@/modules/roles/hooks/useUpdateRole'
import type { RoleFormValues } from '@/modules/roles/types/role.types'

type RoleDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  roleId: number | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'role-form'

export function RoleDrawer({ open, mode, roleId, onOpenChange }: RoleDrawerProps) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const detail = useRole(roleId, open && mode === 'edit')
  const createRole = useCreateRole()
  const updateRole = useUpdateRole(roleId)
  const isSubmitting = createRole.isPending || updateRole.isPending
  const isDetailLoading = mode === 'edit' && detail.isFetching && !detail.isError
  const isDetailError = mode === 'edit' && detail.isError
  const isDetailReady = mode === 'create' || detail.isSuccess

  const handleDirtyChange = useCallback((nextIsDirty: boolean) => setIsDirty(nextIsDirty), [])

  const handleSubmit = async (
    values: RoleFormValues,
    intent: RoleSubmitIntent,
    methods: UseFormReturn<RoleFormValues>
  ) => {
    const payload = { name: values.name, permissions: values.permissions.length ? values.permissions : undefined }

    if (mode === 'create') {
      await createRole.mutateAsync(payload)
      methods.reset({ name: '', permissions: [] })
      if (intent === 'create-another') {
        window.requestAnimationFrame(() => methods.setFocus('name'))
        return
      }
      onOpenChange(false)
      return
    }

    const response = await updateRole.mutateAsync(payload)
    methods.reset({ name: response.data.name, permissions: response.data.permissions })
    onOpenChange(false)
  }

  const errorContent = isDetailError ? (
    <QueryStateNotice kind="loading-error" isRetrying={detail.isFetching} onRetry={() => void detail.refetch()} />
  ) : undefined

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('roles.createRole'), edit: t('roles.editRole') }}
      descriptions={{ create: t('roles.form.createDescription'), edit: t('roles.form.editDescription') }}
      submitLabels={{ create: t('roles.actions.create'), edit: t('roles.actions.update') }}
      createAnotherLabel={t('roles.actions.createAnother')}
      cancelLabel={t('roles.actions.cancel')}
      closeLabel={t('roles.actions.close')}
      formId={FORM_ID}
      isLoading={isDetailLoading}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isDetailReady)}
      loadingContent={<RoleFormSkeleton />}
      errorContent={errorContent}
    >
      {isDetailReady ? (
        <RoleForm
          key={`${mode}-${roleId ?? 'new'}-${open}`}
          formId={FORM_ID}
          role={detail.data?.data}
          isSubmitting={isSubmitting}
          onDirtyChange={handleDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
