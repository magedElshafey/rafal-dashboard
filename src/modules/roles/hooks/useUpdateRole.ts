import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'
import type { UpdateRolePayload } from '@/modules/roles/types/role.types'

export function useUpdateRole(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: UpdateRolePayload) => rolesService.update(id as number, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(rolesKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: rolesKeys.lists() })
      toast.success(t('roles.feedback.updated'))
    },
    onError: () => toast.error(t('roles.feedback.updateError')),
  })
}
