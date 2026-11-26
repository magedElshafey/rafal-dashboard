import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import i18n from '@/config/i18'
import { normalizeOrderDetail } from '../utils/order-normalizers'
import { orderMoneyLabel } from '../utils/order-presentation'
import { OrderAffiliateSection } from '../components/OrderAffiliateSection'
import fixture from './order-detail.fixture.json'
const affiliate = {
  id: 9,
  name: 'Synthetic partner',
  code: 'CODE9',
  discount: { percent: 10, amount: '5.00' },
  commission: { base: '50.00', rate: 5, amount: '2.50', status: 'approved', adjustment_amount: '-0.50' },
}
describe('Order Affiliate attribution', () => {
  it('preserves the documented string percentages, exact amounts and negative adjustment without recomputation', () => {
    const documented = {
      ...affiliate,
      discount: { percent: '10.00', amount: '50.00' },
      commission: { base: '450.00', rate: '10.00', amount: '45.00', status: 'pending', adjustment_amount: '-0.01' },
    }
    const result = normalizeOrderDetail({ ...fixture.data, affiliate: documented })
    expect(result.affiliate).toEqual(documented)
    const unusual = {
      ...documented,
      commission: { ...documented.commission, base: '12345678901234567890.01', amount: '0.03' },
    }
    expect(normalizeOrderDetail({ ...fixture.data, affiliate: unusual }).affiliate).toEqual(unusual)
  })
  it('preserves absent/null compatibility', () => {
    expect(normalizeOrderDetail(fixture.data).affiliate).toBeUndefined()
    expect(normalizeOrderDetail({ ...fixture.data, affiliate: null }).affiliate).toBeUndefined()
  })
  it('maps server values without changing existing order money/gift/loyalty', () => {
    const before = normalizeOrderDetail(fixture.data)
    const after = normalizeOrderDetail({ ...fixture.data, affiliate })
    expect(after.affiliate).toEqual(affiliate)
    expect(after.money).toEqual(before.money)
    expect(after.gift).toEqual(before.gift)
    expect(after.loyalty).toEqual(before.loyalty)
  })
  it('rejects malformed monetary fields rather than inventing a value', () =>
    expect(() =>
      normalizeOrderDetail({
        ...fixture.data,
        affiliate: { ...affiliate, commission: { ...affiliate.commission, amount: 'not-money' } },
      })
    ).toThrow())
  it('preserves negative sub-unit values and large decimal precision', () => {
    expect(orderMoneyLabel('-0.50', 'SAR', 'en')).toBe('-0.50 SAR')
    expect(orderMoneyLabel('12345678901234567890.01', 'SAR', 'en')).toBe('12,345,678,901,234,567,890.01 SAR')
  })
  it.each(['en', 'ar'])(
    'renders accessible financial facts in %s without a protected Affiliate link',
    async (language) => {
      await i18n.changeLanguage(language)
      const order = normalizeOrderDetail({ ...fixture.data, affiliate })
      render(<OrderAffiliateSection order={order} />)
      expect(screen.getByText('Synthetic partner')).toBeInTheDocument()
      expect(screen.getByText('CODE9')).toBeInTheDocument()
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText(orderMoneyLabel('-0.50', order.money.currency, language))).toBeInTheDocument()
    }
  )
})
