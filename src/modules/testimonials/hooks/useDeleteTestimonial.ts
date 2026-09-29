import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { testimonialsService } from '@/modules/testimonials/api/testimonials.service'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useDeleteTestimonial() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => testimonialsService.delete(id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: testimonialsKeys.lists() })
      toast.success(t('testimonials.feedback.deleted'))
    },
    onError: (error) => toastApiError(error, t('testimonials.feedback.deleteError')),
  })
}
