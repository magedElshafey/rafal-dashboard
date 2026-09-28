import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPageCreatePayload } from '@/modules/static-pages/types/static-page.types'

export function useCreateStaticPage() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: StaticPageCreatePayload) => staticPagesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: staticPagesKeys.lists() })
      toast.success(t('staticPages.feedback.created'))
    },
    onError: () => toast.error(t('staticPages.feedback.createError')),
  })
}
