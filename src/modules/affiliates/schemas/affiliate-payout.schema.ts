import { format, isValid, parse } from 'date-fns'
import { z } from 'zod'

// Browser-local calendar day for the closed preparation UI; Backend business timezone still needs confirmation.
export const payoutToday = () => format(new Date(), 'yyyy-MM-dd')
export function isValidPayoutDate(value: string) {
  const parsed = parse(value, 'yyyy-MM-dd', new Date())
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    isValid(parsed) &&
    format(parsed, 'yyyy-MM-dd') === value &&
    value <= payoutToday()
  )
}
export const payoutPaidSchema = z.object({
  transfer_reference: z.string().trim().min(3).max(50),
  transferred_at: z.string().refine(isValidPayoutDate),
})
export const payoutRejectSchema = z.object({ reason: z.string().trim().min(10).max(250) })
export type PayoutPaidPayload = z.infer<typeof payoutPaidSchema>
