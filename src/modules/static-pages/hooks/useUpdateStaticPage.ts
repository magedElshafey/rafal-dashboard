import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPageUpdatePayload } from '@/modules/static-pages/types/static-page.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useUpdateStaticPage(id: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: async (payload: StaticPageUpdatePayload) => {
      const updated = await staticPagesService.update(id, payload)
      if (updated) return updated
      return queryClient.fetchQuery({
        queryKey: staticPagesKeys.detail(id),
        queryFn: ({ signal }) => staticPagesService.show(id, signal),
      })
    },
    onSuccess: async (page) => {
      queryClient.setQueryData(staticPagesKeys.detail(page.id), page)
      await queryClient.invalidateQueries({ queryKey: staticPagesKeys.lists() })
      toast.success(t('staticPages.feedback.updated'))
    },
    onError: (error) => toastApiError(error, t('staticPages.feedback.updateError')),
  })
}
