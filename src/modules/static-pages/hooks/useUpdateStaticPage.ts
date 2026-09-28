import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { staticPagesService } from '@/modules/static-pages/api/static-pages.service'
import { staticPagesKeys } from '@/modules/static-pages/queries/static-pages.keys'
import type { StaticPageUpdatePayload } from '@/modules/static-pages/types/static-page.types'

export function useUpdateStaticPage(id: number) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: StaticPageUpdatePayload) => staticPagesService.update(id, payload),
    onSuccess: async (page) => {
      queryClient.setQueryData(staticPagesKeys.detail(page.id), page)
      await queryClient.invalidateQueries({ queryKey: staticPagesKeys.lists() })
      toast.success(t('staticPages.feedback.updated'))
    },
    onError: () => toast.error(t('staticPages.feedback.updateError')),
  })
}
