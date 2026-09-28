import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'

import { warehousesService } from '@/modules/warehouses/api/warehouses.service'
import { warehousesKeys } from '@/modules/warehouses/queries/warehouses.keys'
import type { WarehouseUpdatePayload } from '@/modules/warehouses/types/warehouse.types'
import { isWarehouseCityConflict } from '@/modules/warehouses/utils/warehouse-error.utils'

export function useUpdateWarehouse(id: number | null) {
  const queryClient = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationFn: (payload: WarehouseUpdatePayload) => {
      if (id === null) throw new Error('Cannot update a Warehouse without an ID')
      return warehousesService.update(id, payload)
    },
    onSuccess: async (response) => {
      queryClient.setQueryData(warehousesKeys.detail(response.data.id), response)
      await queryClient.invalidateQueries({ queryKey: warehousesKeys.lists() })
      toast.success(t('warehouses.feedback.updated'))
    },
    onError: (error) =>
      toast.error(
        t(isWarehouseCityConflict(error) ? 'warehouses.errors.cityConflict' : 'warehouses.feedback.updateError')
      ),
  })
}
