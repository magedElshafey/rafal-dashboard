import { beforeEach, describe, expect, it, vi } from 'vitest'
import { contactMessagesService } from '../api/contact-messages.service'
import { rawContactMessageSchema, contactMessageWritableStatusSchema } from '../schemas/contact-message.schema'
import index from './contact-messages-index.fixture.json'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn(), delete: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => vi.clearAllMocks())

describe('Contact Messages service contracts', () => {
  it('normalizes the supplied Index, nullable contact fields, account and authoritative counts', async () => {
    http.get.mockResolvedValue({ data: index })
    const signal = new AbortController().signal
    const result = await contactMessagesService.list(1, signal)
    expect(http.get).toHaveBeenCalledWith({
      url: '/dashboard/contact-messages',
      query: { page: 1 },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.extra).toEqual({ currentPage: 1, lastPage: 1, perPage: 15, total: 9, newCount: 4 })
    expect(result.paginate).toMatchObject({ current_page: 1, total_pages: 1, total: 9, count: 5, next_page_url: null })
    expect(result.items[0]).toMatchObject({
      id: 49,
      name: 'test',
      email: 'test@test.com',
      phone: '01091043660',
      status: 'new',
      user: null,
    })
    expect(result.items[1]).toMatchObject({ id: 41, phone: null })
    expect(result.items[2]).toMatchObject({ id: 42, email: null, phone: '0512683968', status: 'read' })
    expect(result.items[3].status).toBe('resolved')
    expect(result.items[4].user).toEqual({
      id: 1,
      firstName: 'abdullah',
      lastName: 'essam',
      email: 'abdullah.essam@gmail.com',
    })
  })
  it('reads matching Show identity and rejects the supplied /40 -> 49 inconsistency', async () => {
    http.get.mockResolvedValue({ data: { success: true, data: index.data[0] } })
    await expect(contactMessagesService.show(49)).resolves.toMatchObject({ id: 49 })
    await expect(contactMessagesService.show(40)).rejects.toThrow('Contact message identity mismatch')
    expect(http.patch).not.toHaveBeenCalled()
  })
  it('preserves blank strings, nulls, and future read statuses', () => {
    expect(
      rawContactMessageSchema.parse({
        ...index.data[0],
        name: '',
        email: null,
        phone: null,
        subject: '',
        message: '',
        status: 'future_status',
        status_label: 'Future Status',
      })
    ).toMatchObject({ name: '', email: null, phone: null, status: 'future_status' })
  })
  it.each([
    { id: 0 },
    { name: null },
    { email: 42 },
    { phone: false },
    { user: {} },
    { message: [] },
    { status: null },
  ])('rejects malformed fields %j', (fields) => {
    expect(() => rawContactMessageSchema.parse({ ...index.data[0], ...fields })).toThrow()
  })
  it.each(contactMessageWritableStatusSchema.options)(
    'sends only JSON status %s and parses full entity',
    async (status) => {
      const entity = { ...index.data[1], status, status_label: status, updated_at: '2026-10-04T17:44:09+00:00' }
      http.patch.mockResolvedValue({
        data: { success: true, message: 'Contact message status updated successfully', data: entity },
      })
      const result = await contactMessagesService.updateStatus(41, status)
      expect(http.patch).toHaveBeenCalledWith(
        expect.objectContaining({
          url: '/dashboard/contact-messages/41/status',
          data: { status },
          suppressSuccessNotification: true,
          suppressErrorNotification: true,
        })
      )
      expect(http.patch.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
      expect(result.detail).toMatchObject({ id: 41, status, updatedAt: '2026-10-04T17:44:09+00:00' })
      expect(contactMessageWritableStatusSchema.safeParse('future_status').success).toBe(false)
    }
  )
  it('rejects status identity mismatches and missing full entities', async () => {
    http.patch.mockResolvedValue({ data: { success: true, data: index.data[0] } })
    await expect(contactMessagesService.updateStatus(41, 'read')).rejects.toThrow('identity mismatch')
    http.patch.mockResolvedValue({ data: { success: true } })
    await expect(contactMessagesService.updateStatus(41, 'read')).rejects.toThrow()
  })
  it('deletes without requiring entity data', async () => {
    http.delete.mockResolvedValue({ data: { success: true, message: 'Contact message deleted successfully' } })
    await expect(contactMessagesService.delete(49)).resolves.toEqual({
      success: true,
      message: 'Contact message deleted successfully',
    })
    expect(http.delete).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/contact-messages/49', suppressErrorNotification: true })
    )
    expect(http.delete.mock.calls[0][0].data).toBeUndefined()
  })
  it('rejects unsuccessful envelopes and invalid IDs before transport', async () => {
    http.delete.mockResolvedValue({ data: { success: false } })
    await expect(contactMessagesService.delete(49)).rejects.toThrow()
    await expect(contactMessagesService.show(0)).rejects.toThrow()
    await expect(contactMessagesService.list(-1)).rejects.toThrow()
    expect(http.get).not.toHaveBeenCalled()
  })
})
