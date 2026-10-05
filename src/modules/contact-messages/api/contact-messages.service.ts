import { $http } from '@/utils/http'
import {
  contactMessageDeleteEnvelopeSchema,
  contactMessageIdSchema,
  contactMessageShowEnvelopeSchema,
  contactMessageStatusEnvelopeSchema,
  contactMessagesIndexEnvelopeSchema,
  contactMessageWritableStatusSchema,
} from '../schemas/contact-message.schema'
import type { ContactMessage, ContactMessagesMeta, ContactMessageWritableStatus } from '../types/contact-message.types'
import { normalizeContactMessage } from '../utils/contact-message-normalizers'

const baseUrl = '/dashboard/contact-messages'
const mutationOptions = {
  suppressErrorNotification: true,
  suppressSuccessNotification: true,
  suppressForbiddenRedirect: true,
}

function assertIdentity(detail: ContactMessage, id: number) {
  if (detail.id !== id) throw new Error('Contact message identity mismatch')
  return detail
}

export const contactMessagesService = {
  async list(page: number, signal?: AbortSignal): Promise<PaginatedData<ContactMessage, ContactMessagesMeta>> {
    contactMessageIdSchema.parse(page)
    const response = await $http.get({ url: baseUrl, query: { page }, signal, suppressErrorNotification: true })
    const { data, meta } = contactMessagesIndexEnvelopeSchema.parse(response.data)
    const items = data.map(normalizeContactMessage)
    return {
      items,
      paginate: {
        current_page: meta.current_page,
        total_pages: meta.last_page,
        per_page: meta.per_page,
        total: meta.total,
        count: items.length,
        next_page_url: meta.current_page < meta.last_page ? String(meta.current_page + 1) : null,
        prev_page_url: meta.current_page > 1 ? String(meta.current_page - 1) : null,
      },
      extra: {
        currentPage: meta.current_page,
        lastPage: meta.last_page,
        perPage: meta.per_page,
        total: meta.total,
        newCount: meta.new_count,
      },
    }
  },
  async show(id: number, signal?: AbortSignal) {
    contactMessageIdSchema.parse(id)
    const response = await $http.get({ url: `${baseUrl}/${id}`, signal, suppressErrorNotification: true })
    return assertIdentity(normalizeContactMessage(contactMessageShowEnvelopeSchema.parse(response.data).data), id)
  },
  async updateStatus(id: number, status: ContactMessageWritableStatus) {
    contactMessageIdSchema.parse(id)
    const value = contactMessageWritableStatusSchema.parse(status)
    const response = await $http.patch({ url: `${baseUrl}/${id}/status`, data: { status: value }, ...mutationOptions })
    const envelope = contactMessageStatusEnvelopeSchema.parse(response.data)
    return { detail: assertIdentity(normalizeContactMessage(envelope.data), id), message: envelope.message?.trim() }
  },
  async delete(id: number) {
    contactMessageIdSchema.parse(id)
    const response = await $http.delete({
      url: `${baseUrl}/${id}`,
      suppressErrorNotification: true,
      suppressForbiddenRedirect: true,
    })
    return contactMessageDeleteEnvelopeSchema.parse(response.data)
  },
}
