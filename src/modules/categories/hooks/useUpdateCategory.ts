import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'
import type { CategoryPayload } from '@/modules/categories/types/category.types'

export function useUpdateCategory(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: CategoryPayload) => categoriesService.update(id as number, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(categoriesKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() })
      toast.success(t('categories.feedback.updated'))
    },
    onError: () => toast.error(t('categories.feedback.updateError')),
  })
}
