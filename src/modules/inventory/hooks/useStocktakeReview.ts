import { useEffect, useRef, useState } from 'react'
import { onlineManager, useQueryClient } from '@tanstack/react-query'
import { isAxiosError } from 'axios'
import type { UseFormReturn } from 'react-hook-form'
import { productsService } from '@/modules/products/api/products.service'
import { usePutProductVariantStock } from '@/modules/products/hooks/usePutProductVariantStock'
import { productsKeys } from '@/modules/products/queries/products.keys'
import type { VariantWarehouseStockFormValues } from '@/modules/products/types/product-variant.types'
import type { InventoryStock } from '@/modules/inventory/types/inventory.types'
import { applyApiValidationErrors } from '@/utils/apply-api-validation-errors'

type Notice = 'changed' | 'missing' | 'readError' | 'forbidden' | 'saveError' | 'unchanged' | null

export function useStocktakeReview(stock: InventoryStock, onComplete: () => void) {
  const client = useQueryClient()
  const putStock = usePutProductVariantStock(stock.product.id, {
    suppressForbiddenRedirect: true,
    revalidateProduct: true,
  })
  // This is the counting baseline, deliberately frozen while the operator enters a physical count.
  const [baseline, setBaseline] = useState(stock.quantity)
  const [reviewQuantity, setReviewQuantity] = useState<number | null>(null)
  const [notice, setNotice] = useState<Notice>(null)
  const [checking, setChecking] = useState(false)
  const lock = useRef(false)
  const reading = useRef(false)
  const alive = useRef(true)
  const methods = useRef<UseFormReturn<VariantWarehouseStockFormValues> | null>(null)

  useEffect(() => {
    alive.current = true
    return () => {
      alive.current = false
      if (reading.current) void client.cancelQueries({ queryKey: productsKeys.detail(stock.product.id), exact: true })
    }
  }, [client, stock.product.id])

  const checkBalance = async () => {
    reading.current = true
    try {
      if (!onlineManager.isOnline()) throw new Error('Offline')
      await client.cancelQueries({ queryKey: productsKeys.detail(stock.product.id), exact: true })
      if (!alive.current) return false
      const product = await client.fetchQuery({
        queryKey: productsKeys.detail(stock.product.id),
        queryFn: ({ signal }) => productsService.show(stock.product.id, signal, { suppressForbiddenRedirect: true }),
        staleTime: 0,
        retry: false,
      })
      if (!alive.current) return false
      const balance =
        product.id === stock.product.id
          ? product.variants
              .find((variant) => variant.id === stock.variant.id)
              ?.warehouseStocks.find((item) => item.warehouseId === stock.warehouse.id)
          : undefined
      if (!balance || (balance.id != null && balance.id !== stock.id)) {
        setNotice('missing')
        return false
      }
      if (!Number.isSafeInteger(balance.quantity) || balance.quantity < 0) throw new Error('Invalid balance')
      if (balance.quantity !== baseline) {
        setBaseline(balance.quantity)
        setNotice('changed')
        return false
      }
      return true
    } catch (error) {
      if (alive.current)
        setNotice(
          isAxiosError(error) && error.response?.status === 403
            ? 'forbidden'
            : isAxiosError(error) && error.response?.status === 404
              ? 'missing'
              : 'readError'
        )
      return false
    } finally {
      reading.current = false
    }
  }

  const review = async (
    values: VariantWarehouseStockFormValues,
    form: UseFormReturn<VariantWarehouseStockFormValues>
  ) => {
    if (lock.current || reviewQuantity !== null || values.quantity === null) return
    methods.current = form
    lock.current = true
    setChecking(true)
    setNotice(null)
    try {
      if (await checkBalance()) {
        if (values.quantity === baseline) setNotice('unchanged')
        else setReviewQuantity(values.quantity)
      }
    } finally {
      if (alive.current) setChecking(false)
      lock.current = false
    }
  }

  const confirm = async () => {
    if (lock.current || reviewQuantity === null) return
    lock.current = true
    setChecking(true)
    setNotice(null)
    try {
      if (!(await checkBalance())) {
        if (alive.current) setReviewQuantity(null)
        return
      }
      await putStock.mutateAsync({
        variantId: stock.variant.id,
        warehouseId: stock.warehouse.id,
        quantity: reviewQuantity,
      })
      if (alive.current) onComplete()
    } catch (error) {
      if (!alive.current) return
      setReviewQuantity(null)
      setNotice(
        isAxiosError(error) && error.response?.status === 403
          ? 'forbidden'
          : isAxiosError(error) && error.response?.status === 404
            ? 'missing'
            : 'saveError'
      )
      if (methods.current) applyApiValidationErrors(error, methods.current.setError, { quantity: 'quantity' })
    } finally {
      if (alive.current) setChecking(false)
      lock.current = false
    }
  }

  return {
    baseline,
    reviewQuantity,
    notice,
    busy: checking || putStock.isPending,
    saving: putStock.isPending,
    review,
    confirm,
    clearNotice: () => setNotice(null),
    edit: () => {
      setReviewQuantity(null)
      setNotice(null)
    },
  }
}
