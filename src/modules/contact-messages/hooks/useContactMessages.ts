import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { toast } from 'sonner'
import { useInfinitePaginatedQuery } from '@/hooks/queries/useInfinitePaginatedQuery'
import { contactMessagesService } from '../api/contact-messages.service'
import { contactMessagesKeys } from '../queries/contact-messages.keys'
import type { ContactMessagesFilters, ContactMessageWritableStatus } from '../types/contact-message.types'
import { emptyContactMessagesFilters, validContactMessagesCreatedRange } from '../utils/contact-message-filters'

export function useContactMessages(filters: ContactMessagesFilters = emptyContactMessagesFilters) {
  return useInfinitePaginatedQuery({
    queryKey: contactMessagesKeys.list(filters),
    queryFn: (page, signal) => contactMessagesService.list(page, signal, filters),
    enabled: validContactMessagesCreatedRange(filters),
    retry: false,
  })
}
export function useContactMessage(id: number) {
  return useQuery({
    queryKey: contactMessagesKeys.detail(id),
    queryFn: ({ signal }) => contactMessagesService.show(id, signal),
    enabled: Number.isSafeInteger(id) && id > 0,
    retry: false,
  })
}
export function useUpdateContactMessageStatus(id: number) {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationKey: contactMessagesKeys.mutation(id),
    mutationFn: (status: ContactMessageWritableStatus) => contactMessagesService.updateStatus(id, status),
    retry: false,
    onSuccess: async (response) => {
      await client.cancelQueries({ queryKey: contactMessagesKeys.detail(id), exact: true })
      client.setQueryData(contactMessagesKeys.detail(id), response.detail)
      toast.success(response.message || t('contactMessages.feedback.updated'))
      await Promise.all([
        client.invalidateQueries({ queryKey: contactMessagesKeys.detail(id), exact: true }),
        client.invalidateQueries({ queryKey: contactMessagesKeys.lists() }),
      ])
    },
  })
}
export function useDeleteContactMessage(id: number) {
  const client = useQueryClient()
  const { t } = useTranslation()
  return useMutation({
    mutationKey: contactMessagesKeys.mutation(id),
    mutationFn: () => contactMessagesService.delete(id),
    retry: false,
    onSuccess: async (response) => {
      await client.cancelQueries({ queryKey: contactMessagesKeys.detail(id), exact: true })
      client.removeQueries({ queryKey: contactMessagesKeys.detail(id), exact: true })
      toast.success(response.message?.trim() || t('contactMessages.feedback.deleted'))
      await client.invalidateQueries({ queryKey: contactMessagesKeys.lists() })
    },
  })
}
