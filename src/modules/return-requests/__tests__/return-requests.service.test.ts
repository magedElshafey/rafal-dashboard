import { beforeEach, describe, expect, it, vi } from 'vitest'
import { returnRequestsService } from '../api/return-requests.service'
import { normalizeReturnRequest } from '../utils/return-request-normalizers'
import approved from './return-request-approved.fixture.json'
import show from './return-request-show.fixture.json'
import index from './return-requests-index.fixture.json'
import nullCommentIndex from './return-requests-index-null-comment.fixture.json'
import { emptyReturnRequestsFilters } from '../utils/return-request-filters'

const http = vi.hoisted(() => ({ get: vi.fn(), post: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))

beforeEach(() => vi.clearAllMocks())

describe('Return Requests real read contracts', () => {
  it.each(['no comment', 'Damaged product', '', null])('preserves valid comment %j', (comment) => {
    expect(normalizeReturnRequest({ ...show.data, comment }).comment).toBe(comment)
  })
  it.each([123, true, {}, []])('rejects malformed comment %j', (comment) => {
    expect(() => normalizeReturnRequest({ ...show.data, comment })).toThrow()
  })
  it('resolves the exact real nullable-comment Index response without fabricating absent values', async () => {
    http.get.mockResolvedValue({ data: nullCommentIndex })
    await expect(returnRequestsService.list()).resolves.toMatchObject({
      items: [
        {
          id: 1,
          order: { id: 22, orderNumber: 'RF-10022', status: 'delivered' },
          user: { id: 4, name: '', email: 'magedelshafey98@gmail.com' },
          status: 'pending',
          reason: 'damaged',
          reasonLabel: 'Damaged',
          comment: null,
          decisionNote: null,
          decidedByAdmin: null,
          decidedAt: null,
          createdAt: '2026-10-04T21:58:28+00:00',
          updatedAt: '2026-10-04T21:58:28+00:00',
        },
      ],
      paginate: { current_page: 1, per_page: 15, next_page_url: null },
      extra: null,
    })
  })
  it('parses the exact Index response and only confirmed partial pagination metadata', async () => {
    http.get.mockResolvedValue({ data: index })
    const signal = new AbortController().signal
    const result = await returnRequestsService.list(
      {
        ...emptyReturnRequestsFilters,
        orderId: 47,
        dateFrom: '2026-10-01',
        dateTo: '2026-10-09',
        sortBy: 'status',
        sortDir: 'desc',
      },
      2,
      signal
    )
    expect(http.get).toHaveBeenCalledWith({
      url: '/dashboard/return-requests',
      query: {
        order_id: 47,
        date_from: '2026-10-01',
        date_to: '2026-10-09',
        sort_by: 'status',
        sort_dir: 'desc',
        page: 2,
      },
      signal,
      suppressErrorNotification: true,
    })
    expect(result.paginate).toMatchObject({ current_page: 1, per_page: 15, next_page_url: null })
    expect(result.items).toEqual([
      {
        id: 31,
        order: { id: 47, orderNumber: 'RF-10047', status: 'delivered' },
        user: { id: 1, name: '', email: 'abdullah.essam@gmail.com' },
        status: 'pending',
        reason: 'damaged',
        reasonLabel: 'Damaged',
        comment: 'no comment',
        decisionNote: null,
        decidedByAdmin: null,
        decidedAt: null,
        createdAt: '2026-09-26T17:49:57+00:00',
        updatedAt: '2026-09-26T17:49:57+00:00',
      },
    ])
  })
  it('GETs and normalizes the exact Show while accepting a blank user name', async () => {
    http.get.mockResolvedValue({ data: show })
    const detail = await returnRequestsService.show(31)
    expect(http.get).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/return-requests/31', suppressErrorNotification: true })
    )
    expect(detail).toEqual(normalizeReturnRequest(index.data[0]))
  })
  it('keeps status and reason open while rejecting malformed required identity fields', () => {
    expect(normalizeReturnRequest({ ...show.data, status: 'future_status', reason: 'future_reason' })).toMatchObject({
      status: 'future_status',
      reason: 'future_reason',
    })
    for (const value of [
      { ...show.data, id: 0 },
      { ...show.data, order: { ...show.data.order, id: '47' } },
      { ...show.data, order: { ...show.data.order, order_number: '' } },
      { ...show.data, user: { ...show.data.user, email: '' } },
      { ...show.data, status: '' },
      { ...show.data, created_at: null },
    ])
      expect(() => normalizeReturnRequest(value)).toThrow()
  })
})

describe('Return Request decisions', () => {
  it.each([undefined, {}, { ...approved.data, comment: true }])(
    'keeps Show and Approve strict when entity data is invalid: %j',
    async (data) => {
      http.get.mockResolvedValue({ data: { success: true, data } })
      http.post.mockResolvedValue({ data: { success: true, data } })
      await expect(returnRequestsService.show(31)).rejects.toThrow()
      await expect(returnRequestsService.approve(31, '')).rejects.toThrow()
    }
  )
  it.each([undefined, null, {}, { ...show.data, comment: true }])(
    'accepts Reject success with unconfirmed data: %j',
    async (data) => {
      http.post.mockResolvedValue({ data: { success: true, data } })
      await expect(returnRequestsService.reject(31, 'Reason')).resolves.toMatchObject({ detail: null })
    }
  )
  it('consumes valid Reject entity data opportunistically and ignores mismatched identity', async () => {
    http.post.mockResolvedValue({ data: show })
    await expect(returnRequestsService.reject(31, 'Reason')).resolves.toMatchObject({
      detail: normalizeReturnRequest(show.data),
    })
    await expect(returnRequestsService.reject(32, 'Reason')).resolves.toMatchObject({ detail: null })
  })
  it('POSTs approval as JSON with nullable or trimmed decision_note and normalizes the confirmed entity', async () => {
    http.post.mockResolvedValue({ data: approved })
    const blank = await returnRequestsService.approve(31, '   ')
    expect(http.post).toHaveBeenNthCalledWith(1, {
      url: '/dashboard/return-requests/31/approve',
      data: { decision_note: null },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    expect(http.post.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
    expect(blank.detail).toMatchObject({
      id: 31,
      status: 'approved',
      order: { id: 47, orderNumber: 'RF-10047', status: 'returned' },
      decisionNote: null,
      decidedByAdmin: { id: 1, name: 'Super Admin', email: 'admin@admin.com' },
      decidedAt: '2026-09-26T18:56:30+00:00',
      createdAt: '2026-09-26T17:49:57+00:00',
      updatedAt: '2026-09-26T18:56:30+00:00',
    })
    await returnRequestsService.approve(31, '  Verified  ')
    expect(http.post.mock.calls[1][0].data).toEqual({ decision_note: 'Verified' })
  })
  it('POSTs rejection as JSON and succeeds without requiring guessed entity data', async () => {
    http.post.mockResolvedValue({ data: { success: true, message: 'Decision saved' } })
    await expect(returnRequestsService.reject(31, '  Return does not meet policy.  ')).resolves.toEqual({
      message: 'Decision saved',
      detail: null,
    })
    expect(http.post).toHaveBeenCalledWith({
      url: '/dashboard/return-requests/31/reject',
      data: { decision_note: 'Return does not meet policy.' },
      suppressErrorNotification: true,
      suppressSuccessNotification: true,
      suppressForbiddenRedirect: true,
    })
    expect(http.post.mock.calls[0][0].data).not.toBeInstanceOf(FormData)
  })
  it('rejects blank rejection notes before transport and preserves resolved validation failures', async () => {
    await expect(returnRequestsService.reject(31, '   ')).rejects.toThrow()
    expect(http.post).not.toHaveBeenCalled()
    http.post.mockResolvedValue({
      data: {
        success: false,
        message: 'Decision note is invalid',
        errors: { decision_note: ['Decision note is required.'] },
      },
    })
    await expect(returnRequestsService.reject(31, 'note')).rejects.toThrow('Return request decision rejected')
  })
})
