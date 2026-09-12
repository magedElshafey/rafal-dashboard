import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'
import type { CreateAdminPayload } from '@/modules/admins/types/admin.types'

export function useCreateAdmin() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: CreateAdminPayload) => adminsService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: adminsKeys.lists() })
      toast.success(t('admins.feedback.created'))
    },
    onError: () => toast.error(t('admins.feedback.createError')),
  })
}
