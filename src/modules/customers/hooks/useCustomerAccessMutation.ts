import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { customersService } from '@/modules/customers/api/customers.service'
import { customersKeys } from '@/modules/customers/queries/customers.keys'
import type { CustomerAccessAction } from '@/modules/customers/types/customer.types'

type CustomerAccessVariables = {
  id: number
  action: CustomerAccessAction
}

export function useCustomerAccessMutation() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()

  return useMutation({
    mutationFn: ({ id, action }: CustomerAccessVariables) =>
      action === 'block' ? customersService.block(id) : customersService.unblock(id),
    onSuccess: async (_data, { id, action }) => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: customersKeys.lists() }),
        queryClient.invalidateQueries({ queryKey: customersKeys.detail(id), exact: true }),
      ])
      toast.success(t(action === 'block' ? 'customers.feedback.blocked' : 'customers.feedback.unblocked'))
    },
    onError: (_error, { action }) => {
      toast.error(t(action === 'block' ? 'customers.feedback.blockError' : 'customers.feedback.unblockError'))
    },
  })
}
