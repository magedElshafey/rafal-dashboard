import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ordersService } from '../api/orders.service'
import { normalizeOrderDetail } from '../utils/order-normalizers'
import gift from './order-gift.fixture.json'
import show from './order-detail.fixture.json'

const http = vi.hoisted(() => ({ get: vi.fn(), patch: vi.fn() }))
vi.mock('@/utils/http', () => ({ $http: http }))
beforeEach(() => vi.clearAllMocks())

const expectedGift = {
  isAnonymous: false,
  message: null,
  wrap: true,
  wrapFee: '15.00',
  buyer: { type: 'guest', name: 'sayed', email: 'tet@test.com', phone: '01091043665' },
  recipient: {
    name: 'sayed',
    phone: '01091043660',
    city: { id: 1, name: 'الرياض' },
    district: 'الحي السادس',
    streetDetails: 'شارع الهرم',
  },
}

describe('confirmed nested Gift contract', () => {
  it('preserves every supplied Gift field through GET Show normalization', async () => {
    http.get.mockResolvedValue({ data: { ...show, data: { ...show.data, gift } } })
    const result = await ordersService.show(21)
    expect(result.gift).toEqual(expectedGift)
    expect(http.get).toHaveBeenCalledWith(expect.objectContaining({ url: '/dashboard/orders/21' }))
  })
  it('accepts the same full Gift detail on successful status PATCH', async () => {
    const data = { ...show.data, gift, status: 'processing', allowed_transitions: ['shipped', 'cancelled'] }
    http.patch.mockResolvedValue({ data: { success: true, message: 'Saved', data } })
    const result = await ordersService.updateStatus(21, 'processing')
    expect(result.detail).toEqual(normalizeOrderDetail(data))
    expect(result.detail?.gift).toEqual(expectedGift)
    expect(http.patch).toHaveBeenCalledWith(
      expect.objectContaining({ url: '/dashboard/orders/21/status', data: { status: 'processing' } })
    )
  })
  it.each([false, 0, true, 1])('normalizes is_anonymous=%s and all wrap flag variants', (is_anonymous) => {
    for (const wrap of [false, 0, true, 1]) {
      const result = normalizeOrderDetail({ ...show.data, gift: { ...gift, is_anonymous, wrap } }).gift
      expect(result?.isAnonymous).toBe(is_anonymous === true || is_anonymous === 1)
      expect(result?.wrap).toBe(wrap === true || wrap === 1)
      expect(result?.wrapFee).toBe('15.00')
    }
  })
  it('keeps missing or explicit null Gift absent despite positive money gift_wrap_fee', () => {
    expect(show.data.money.gift_wrap_fee).toBe('15.00')
    expect(normalizeOrderDetail(show.data).gift).toBeNull()
    expect(normalizeOrderDetail({ ...show.data, gift: null }).gift).toBeNull()
  })
  it('preserves nullable city, future buyer type, message and precise backend fee; ignores extra keys', () => {
    const result = normalizeOrderDetail({
      ...show.data,
      gift: {
        ...gift,
        message: 'هدية لك',
        wrap_fee: '9007199254740993.123',
        future_field: { ignored: true },
        buyer: { ...gift.buyer, type: 'future_buyer' },
        recipient: { ...gift.recipient, city: null },
      },
    }).gift
    expect(result).toEqual({
      ...expectedGift,
      message: 'هدية لك',
      wrapFee: '9007199254740993.123',
      buyer: { ...gift.buyer, type: 'future_buyer' },
      recipient: { ...expectedGift.recipient, city: null },
    })
  })
  it.each([
    { is_anonymous: {} },
    { is_anonymous: 'false' },
    { wrap: 'true' },
    { wrap: 2 },
    { wrap_fee: 'NaN' },
    { wrap_fee: 15 },
    { message: {} },
    { buyer: [] },
    { buyer: { ...gift.buyer, type: '' } },
    { buyer: { ...gift.buyer, email: {} } },
    { recipient: { ...gift.recipient, city: { id: 0, name: 'الرياض' } } },
    { recipient: { ...gift.recipient, district: [] } },
    { recipient: { ...gift.recipient, street_details: {} } },
  ])('rejects malformed confirmed Gift fields: %j', (override) => {
    expect(() => normalizeOrderDetail({ ...show.data, gift: { ...gift, ...override } })).toThrow()
  })
})
