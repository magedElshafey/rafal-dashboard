import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehousePayload } from '@/modules/warehouses/types/warehouse.types'

export function useUpdateWarehouse(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: WarehousePayload) => warehousesService.update(id as number, payload),
    onSuccess: async (response) => {
      queryClient.setQueryData(warehousesKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: warehousesKeys.lists() })
      toast.success(t('warehouses.feedback.updated'))
    },
    onError: () => toast.error(t('warehouses.feedback.updateError')),
  })
}
