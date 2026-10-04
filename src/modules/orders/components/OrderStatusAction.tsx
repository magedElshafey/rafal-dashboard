import { useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog'
import type { OrderDetail, OrderStatusDefinition } from '../types/order.types'
import { useUpdateOrderStatus } from '../hooks/useOrders'
import { orderStatusLabel } from '../utils/order-presentation'
import { orderTransitionFeedback } from '../utils/order-errors'

export function OrderStatusAction({
  order,
  definitions,
  refreshing = false,
}: {
  order: OrderDetail
  definitions: OrderStatusDefinition[]
  refreshing?: boolean
}) {
  const { t } = useTranslation()
  const mutation = useUpdateOrderStatus(order.id)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState('')
  const lock = useRef(false)
  const allowed = order.allowedTransitions.includes(selected)
  const feedback = mutation.error ? orderTransitionFeedback(mutation.error, t('orders.updateError')) : null
  const submit = async () => {
    if (!allowed || mutation.isPending || lock.current || refreshing) return
    lock.current = true
    try {
      await mutation.mutateAsync(selected)
      setOpen(false)
      setSelected('')
    } catch {
      /* Retain the dialog and communicate the safe failure. */
    } finally {
      lock.current = false
    }
  }
  if (!order.allowedTransitions.length) return null
  return (
    <Dialog
      open={open}
      onOpenChange={(value) => {
        if (mutation.isPending || lock.current) return
        setOpen(value)
        if (value) {
          mutation.reset()
          setSelected('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={refreshing}>{t('orders.updateStatus')}</Button>
      </DialogTrigger>
      <DialogContent showCloseButton={false} dir={t('orders.direction')}>
        <DialogTitle>{t('orders.updateStatus')}</DialogTitle>
        <DialogDescription>{t('orders.confirmDescription', { number: order.displayNumber })}</DialogDescription>
        <label className="text-sm">
          {t('orders.nextStatus')}
          <select
            className="mt-2 w-full rounded-md border bg-background p-3 focus-visible:ring-2"
            value={allowed ? selected : ''}
            disabled={mutation.isPending || refreshing}
            aria-invalid={Boolean(feedback?.statusError)}
            aria-describedby={feedback ? 'order-transition-error' : undefined}
            onChange={(event) => {
              setSelected(event.target.value)
              mutation.reset()
            }}
          >
            <option value="">{t('orders.selectStatus')}</option>
            {order.allowedTransitions.map((value) => (
              <option key={value} value={value}>
                {orderStatusLabel(value, definitions, t)}
              </option>
            ))}
          </select>
        </label>
        {feedback && (
          <div role="alert" id="order-transition-error" className="text-destructive">
            <p>{feedback.message}</p>
            {feedback.statusError && feedback.statusError !== feedback.message && <p>{feedback.statusError}</p>}
          </div>
        )}
        <div className="flex flex-wrap justify-end gap-2">
          <Button variant="outline" disabled={mutation.isPending} onClick={() => setOpen(false)}>
            {t('orders.close')}
          </Button>
          <Button disabled={!allowed || mutation.isPending || refreshing} onClick={() => void submit()}>
            {t(mutation.isPending ? 'orders.updating' : 'orders.confirmUpdate')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
