import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { categoriesService } from '@/modules/categories/api/categories.service'
import { categoriesKeys } from '@/modules/categories/queries/categories.keys'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => categoriesService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: categoriesKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: categoriesKeys.lists() })
      toast.success(t('categories.feedback.deleted'))
    },
    onError: (error) => toastApiError(error, t('categories.feedback.deleteError')),
  })
}
