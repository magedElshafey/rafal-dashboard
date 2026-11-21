import { useRef } from 'react'
import type { UseFormReturn } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { EntityFormDrawer } from '@/components/shared/entity-form-drawer'
import { AffiliateForm, EMPTY_AFFILIATE_FORM_VALUES } from '@/modules/affiliates/components/AffiliateForm'
import { useAffiliateCodeSuggestion } from '@/modules/affiliates/hooks/useAffiliateCodeSuggestion'
import { useCreateAffiliate } from '@/modules/affiliates/hooks/useCreateAffiliate'
import type { AffiliateFormValues } from '@/modules/affiliates/types/affiliate.types'

type Props = { open: boolean; onOpenChange: (open: boolean) => void }

const FORM_ID = 'affiliate-create-form'

export function AffiliateCreateDrawer({ open, onOpenChange }: Props) {
  const { t } = useTranslation()
  const submissionLockRef = useRef(false)
  const createAffiliate = useCreateAffiliate()
  const suggestion = useAffiliateCodeSuggestion(open)

  const handleSubmit = async (values: AffiliateFormValues, methods: UseFormReturn<AffiliateFormValues>) => {
    if (submissionLockRef.current || createAffiliate.isPending) return
    submissionLockRef.current = true
    try {
      await createAffiliate.mutateAsync(values)
      methods.reset(EMPTY_AFFILIATE_FORM_VALUES)
      onOpenChange(false)
    } finally {
      submissionLockRef.current = false
    }
  }

  return (
    <EntityFormDrawer
      open={open}
      mode="create"
      onOpenChange={onOpenChange}
      titles={{ create: t('affiliates.create.title') }}
      descriptions={{ create: t('affiliates.create.description') }}
      submitLabels={{ create: t('affiliates.actions.create') }}
      cancelLabel={t('affiliates.actions.cancel')}
      closeLabel={t('affiliates.actions.close')}
      formId={FORM_ID}
      isSubmitting={createAffiliate.isPending}
    >
      {open ? (
        <AffiliateForm
          key={`create-${open}`}
          formId={FORM_ID}
          suggestion={suggestion.data}
          suggestionError={suggestion.isError}
          suggestionLoading={suggestion.isFetching && !suggestion.data}
          isSubmitting={createAffiliate.isPending}
          onRetrySuggestion={() => void suggestion.refetch()}
          onSubmit={handleSubmit}
        />
      ) : null}
    </EntityFormDrawer>
  )
}
