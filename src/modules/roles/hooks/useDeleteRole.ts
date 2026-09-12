import { useMutation, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'

export function useDeleteRole() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (id: number) => rolesService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: rolesKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: rolesKeys.lists() })
      toast.success(t('roles.feedback.deleted'))
    },
    onError: (error) => {
      const isSelfRoleError =
        isAxiosError(error) &&
        error.response?.status === 403 &&
        error.response.data?.message === 'You cannot delete a role assigned to your own account'
      toast.error(t(isSelfRoleError ? 'roles.errors.selfDelete' : 'roles.feedback.deleteError'))
    },
  })
}
