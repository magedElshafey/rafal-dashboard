import type { z } from 'zod'
import type {
  contactMessageDeleteEnvelopeSchema,
  contactMessageShowEnvelopeSchema,
  contactMessageStatusEnvelopeSchema,
  contactMessagesIndexEnvelopeSchema,
  contactMessageWritableStatusSchema,
  rawContactMessageSchema,
  rawContactMessageUserSchema,
} from '../schemas/contact-message.schema'

export type RawContactMessage = z.infer<typeof rawContactMessageSchema>
export type RawContactMessageUser = z.infer<typeof rawContactMessageUserSchema>
export type RawContactMessagesIndexEnvelope = z.infer<typeof contactMessagesIndexEnvelopeSchema>
export type RawContactMessageShowEnvelope = z.infer<typeof contactMessageShowEnvelopeSchema>
export type RawContactMessageStatusEnvelope = z.infer<typeof contactMessageStatusEnvelopeSchema>
export type RawContactMessageDeleteEnvelope = z.infer<typeof contactMessageDeleteEnvelopeSchema>
export type ContactMessageWritableStatus = z.infer<typeof contactMessageWritableStatusSchema>
export type ContactMessageSortBy = 'created_at' | 'status' | 'name'
export type ContactMessageSortDir = 'asc' | 'desc'

export type ContactMessagesFilters = {
  createdFrom: string
  createdTo: string
  sortBy: ContactMessageSortBy | null
  sortDir: ContactMessageSortDir | null
}

export type ContactMessage = {
  id: number
  name: string
  email: string | null
  phone: string | null
  subject: string
  message: string
  status: string
  statusLabel: string
  user: { id: number; firstName: string; lastName: string; email: string } | null
  createdAt: string
  updatedAt: string
}
export type ContactMessagesMeta = {
  currentPage: number
  lastPage: number
  perPage: number
  total: number
  newCount: number
}
