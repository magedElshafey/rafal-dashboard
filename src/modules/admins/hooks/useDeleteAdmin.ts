import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { adminsService } from '@/modules/admins/api/admins.service'
import { adminsKeys } from '@/modules/admins/queries/admins.keys'

export function useDeleteAdmin() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => adminsService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: adminsKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: adminsKeys.lists() })
      toast.success(t('admins.feedback.deleted'))
    },
    onError: (error) => {
      const isSelfDeleteError =
        isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response.data?.message === 'You cannot delete your own account'
      toast.error(t(isSelfDeleteError ? 'admins.errors.selfDelete' : 'admins.feedback.deleteError'))
    },
  })
}
