import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'

export function useDeleteWarehouse() {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (id: number) => warehousesService.delete(id),
    onSuccess: async (_response, id) => {
      queryClient.removeQueries({ queryKey: warehousesKeys.detail(id), exact: true })
      await queryClient.invalidateQueries({ queryKey: warehousesKeys.lists() })
      toast.success(t('warehouses.feedback.deleted'))
    },
    onError: () => toast.error(t('warehouses.feedback.deleteError')),
  })
}
