import { createInstance } from 'i18next'
import { describe, expect, it } from 'vitest'
import en from '@/lang/en.json'
import ar from '@/lang/ar.json'
import { formatRemainingTime, getRemainingMilliseconds, getRemainingTimeVariant } from './remaining-time.helpers'

async function translator(lng = 'en') {
  const i18n = createInstance()
  await i18n.init({ lng, resources: { en: { translation: en }, ar: { translation: ar } } })
  return i18n.t
}

describe('remaining time', () => {
  it.each([
    [1803, '1 day, 6h 3m left'],
    [1383, '23h 3m left'],
    [42, '42m left'],
    [3123, '2 days, 4h 3m left'],
    [0.5, 'Less than 1m left'],
  ])('formats %s minutes', async (minutes, expected) => {
    expect(formatRemainingTime(minutes * 60000, await translator())).toBe(expected)
  })
  it('uses Arabic plural forms and punctuation', async () => {
    const t = await translator('ar')
    expect(formatRemainingTime(1803 * 60000, t)).toBe('متبقي يوم واحد، 6 س 3 د')
    expect(formatRemainingTime(2880 * 60000, t)).toBe('متبقي يومان، 0 س 0 د')
    expect(formatRemainingTime(4320 * 60000, t)).toBe('متبقي 3 أيام، 0 س 0 د')
  })
  it.each([
    [86400001, 'warning'],
    [86400000, 'error'],
    [1, 'error'],
    [0, null],
    [-1, null],
  ])('uses elapsed milliseconds at the boundary: %s', (ms, expected) => {
    expect(getRemainingTimeVariant(Number(ms))).toBe(expected)
  })
  it('preserves timezone offsets and suppresses invalid or passed targets', async () => {
    const now = Date.parse('2026-09-08T08:46:00Z')
    expect(getRemainingMilliseconds('2026-09-08T11:46:00.000000+03:00', now)).toBe(0)
    expect(getRemainingMilliseconds('invalid', now)).toBe(0)
    expect(formatRemainingTime(-60000, await translator())).toBeNull()
    expect(formatRemainingTime(Number.NaN, await translator())).toBeNull()
  })
})
