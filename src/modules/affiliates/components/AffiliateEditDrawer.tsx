import { useCallback, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { AffiliateProfileForm } from '@/modules/affiliates/components/AffiliateProfileForm'
import { useUpdateAffiliate } from '@/modules/affiliates/hooks/useUpdateAffiliate'
import type {
  Affiliate,
  AffiliateProfileFormValues,
  UpdateAffiliatePayload,
} from '@/modules/affiliates/types/affiliate.types'

const FORM_ID = 'affiliate-edit-form'

export function AffiliateEditDrawer({
  affiliate,
  open,
  onOpenChange,
}: {
  affiliate: Affiliate
  open: boolean
  onOpenChange: (open: boolean) => void
}) {
  const { t } = useTranslation()
  const [dirty, setDirty] = useState(false)
  const lockRef = useRef(false)
  const mutation = useUpdateAffiliate(affiliate.id)
  const onDirtyChange = useCallback((value: boolean) => setDirty(value), [])
  const handleOpenChange = useCallback(
    (nextOpen: boolean) => {
      if (!nextOpen) setDirty(false)
      onOpenChange(nextOpen)
    },
    [onOpenChange]
  )

  const handleSubmit = async (
    values: AffiliateProfileFormValues,
    methods: UseFormReturn<AffiliateProfileFormValues>
  ) => {
    if (lockRef.current || mutation.isPending || !dirty) return
    const dirtyFields = methods.formState.dirtyFields
    const payload = Object.fromEntries(
      (Object.keys(values) as (keyof AffiliateProfileFormValues)[])
        .filter((key) => dirtyFields[key])
        .map((key) => [key, values[key]])
    ) as UpdateAffiliatePayload
    if (!Object.keys(payload).length) return

    lockRef.current = true
    try {
      const updated = await mutation.mutateAsync(payload)
      methods.reset({
        name: updated.name,
        mobile: updated.mobile,
        email: updated.email,
        platform: updated.platform,
        username: updated.username,
      })
      handleOpenChange(false)
    } finally {
      lockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode="edit"
      onOpenChange={handleOpenChange}
      titles={{ edit: t('affiliates.edit.title') }}
      descriptions={{ edit: t('affiliates.edit.description') }}
      submitLabels={{ edit: t('affiliates.actions.save') }}
      cancelLabel={t('affiliates.actions.cancel')}
      closeLabel={t('affiliates.actions.closeEdit')}
      formId={FORM_ID}
      isSubmitting={mutation.isPending}
      isSubmitDisabled={!dirty}
    >
      {open ? (
        <AffiliateProfileForm
          key={`${affiliate.id}-${open}`}
          affiliate={affiliate}
          formId={FORM_ID}
          isSubmitting={mutation.isPending}
          onDirtyChange={onDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
