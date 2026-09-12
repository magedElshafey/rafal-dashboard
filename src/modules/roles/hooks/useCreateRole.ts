import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { rolesService } from '@/modules/roles/api/roles.service'
import { rolesKeys } from '@/modules/roles/queries/roles.keys'
import type { CreateRolePayload } from '@/modules/roles/types/role.types'

export function useCreateRole() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: (payload: CreateRolePayload) => rolesService.create(payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: rolesKeys.lists() })
      toast.success(t('roles.feedback.created'))
    },
    onError: () => toast.error(t('roles.feedback.createError')),
  })
}
