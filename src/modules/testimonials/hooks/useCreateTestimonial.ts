import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { testimonialsService } from '@/modules/testimonials/api/testimonials.service'
import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'
import type { TestimonialWritePayload } from '@/modules/testimonials/types/testimonial.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useCreateTestimonial() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: TestimonialWritePayload) => testimonialsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: testimonialsKeys.lists() })
      toast.success(t('testimonials.feedback.created'))
    },
    onError: (error) => toastApiError(error, t('testimonials.feedback.createError')),
  })
}
