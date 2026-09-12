import { useCallback, useRef, useState } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { QueryStateNotice } from '@/components/shared/query-state/components/QueryStateNotice'
import { BannerForm, type BannerSubmitIntent, EMPTY_BANNER_FORM_VALUES } from '@/modules/banners/components/BannerForm'
import { BannerFormSkeleton } from '@/modules/banners/components/BannerFormSkeleton'
import { useBanner } from '@/modules/banners/hooks/useBanner'
import { useCreateBanner } from '@/modules/banners/hooks/useCreateBanner'
import { useUpdateBanner } from '@/modules/banners/hooks/useUpdateBanner'
import type { BannerFormValues, BannerPayload } from '@/modules/banners/types/banner.types'
import { toDateTimeLocal } from '@/modules/banners/utils/banner.utils'

type BannerDrawerProps = {
  open: boolean
  mode: 'create' | 'edit'
  bannerId: number | null
  onOpenChange: (open: boolean) => void
}

const FORM_ID = 'banner-form'

function toPayload(values: BannerFormValues): BannerPayload {
  const replacementImage = values.image.files[0]
  return {
    title: values.title,
    placement: values.placement,
    platform: values.platform,
    link_url: values.link_url || null,
    starts_at: values.starts_at || null,
    ends_at: values.ends_at || null,
    is_active: values.is_active,
    sort_order: values.sort_order,
    ...(replacementImage ? { image: replacementImage } : {}),
  }
}

export function BannerDrawer({ open, mode, bannerId, onOpenChange }: BannerDrawerProps) {
  const { t } = useTranslation()
  const [isDirty, setIsDirty] = useState(false)
  const submissionLockRef = useRef(false)
  const detail = useBanner(bannerId, open && mode === 'edit')
  const createBanner = useCreateBanner()
  const updateBanner = useUpdateBanner(bannerId)
  const isSubmitting = createBanner.isPending || updateBanner.isPending
  const isDetailLoading = mode === 'edit' && detail.isFetching && !detail.isError
  const isDetailError = mode === 'edit' && detail.isError
  const isDetailReady = mode === 'create' || detail.isSuccess

  const handleDirtyChange = useCallback((nextIsDirty: boolean) => setIsDirty(nextIsDirty), [])
  const handleSubmit = async (
    values: BannerFormValues,
    intent: BannerSubmitIntent,
    methods: UseFormReturn<BannerFormValues>
  ) => {
    if (submissionLockRef.current || (mode === 'edit' && !isDirty)) return
    submissionLockRef.current = true
    try {
      if (mode === 'create') {
        await createBanner.mutateAsync(toPayload(values))
        methods.reset(EMPTY_BANNER_FORM_VALUES)
        if (intent === 'create-another') {
          window.requestAnimationFrame(() => methods.setFocus('title.ar'))
          return
        }
        onOpenChange(false)
        return
      }

      const response = await updateBanner.mutateAsync(toPayload(values))
      methods.reset({
        title: { ...response.data.title },
        placement: response.data.placement,
        platform: response.data.platform,
        link_url: response.data.link_url ?? '',
        starts_at: toDateTimeLocal(response.data.starts_at),
        ends_at: toDateTimeLocal(response.data.ends_at),
        is_active: response.data.is_active,
        sort_order: response.data.sort_order,
        image: { files: [], removedExistingIds: [] },
      })
      onOpenChange(false)
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode={mode}
      onOpenChange={onOpenChange}
      titles={{ create: t('banners.createBanner'), edit: t('banners.editBanner') }}
      descriptions={{ create: t('banners.form.createDescription'), edit: t('banners.form.editDescription') }}
      submitLabels={{ create: t('banners.actions.create'), edit: t('banners.actions.update') }}
      createAnotherLabel={t('banners.actions.createAnother')}
      cancelLabel={t('banners.actions.cancel')}
      closeLabel={t('banners.actions.close')}
      formId={FORM_ID}
      isLoading={isDetailLoading}
      isSubmitting={isSubmitting}
      isSubmitDisabled={mode === 'edit' && (!isDirty || !isDetailReady)}
      loadingContent={<BannerFormSkeleton />}
      errorContent={
        isDetailError ? (
          <QueryStateNotice kind="loading-error" isRetrying={detail.isFetching} onRetry={() => void detail.refetch()} />
        ) : undefined
      }
    >
      {isDetailReady ? (
        <BannerForm
          key={`${mode}-${bannerId ?? 'new'}-${open}`}
          formId={FORM_ID}
          mode={mode}
          banner={detail.data?.data}
          isSubmitting={isSubmitting}
          onDirtyChange={handleDirtyChange}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
