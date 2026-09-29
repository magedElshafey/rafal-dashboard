import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'
import type { CreateAdminPayload } from '@/modules/admins/types/admin.types'
import { toastApiError } from '@/utils/error/api-error-toast.helpers'

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: CreateAdminPayload) => adminsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminsKeys.lists() })
      toast.success(t('admins.feedback.created'))
    },
    onError: (error) => toastApiError(error, t('admins.feedback.createError')),
  })
}
