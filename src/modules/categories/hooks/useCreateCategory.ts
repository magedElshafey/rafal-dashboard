import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'
import type { CategoryPayload } from '@/modules/categories/types/category.types'

export function useCreateCategory() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() })
      toast.success(t('categories.feedback.created'))
    },
    onError: () => toast.error(t('categories.feedback.createError')),
  })
}
