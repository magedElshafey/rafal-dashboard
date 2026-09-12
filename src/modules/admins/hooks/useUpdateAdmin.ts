import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'
import type { UpdateAdminPayload } from '@/modules/admins/types/admin.types'

export function useUpdateAdmin(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: UpdateAdminPayload) => adminsService.update(id as number, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(adminsKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: adminsKeys.lists() })
      toast.success(t('admins.feedback.updated'))
    },
    onError: () => toast.error(t('admins.feedback.updateError')),
  })
}
