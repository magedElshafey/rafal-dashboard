import { describe, expect, it } from 'vitest'
import postsEn from '../locale/en.json'
import postsAr from '../locale/ar.json'
function entries(value: object, prefix = ''): [string, string][] {
  return Object.entries(value).flatMap(([key, item]) =>
    typeof item === 'string' ? [[prefix + key, item] as [string, string]] : entries(item, prefix + key + '.')
  )
}
describe('blogs translations', () => {
  it.each([[postsEn, postsAr]])('preserves AR/EN key and interpolation parity', (en, ar) => {
    const english = entries(en),
      arabic = entries(ar)
    expect(arabic.map(([key]) => key).sort()).toEqual(english.map(([key]) => key).sort())
    for (const [key, value] of english) {
      const translated = arabic.find(([name]) => name === key)?.[1]
      expect(translated).toBeTruthy()
      expect(translated).toMatch(/[\u0600-\u06ff]/)
      expect(translated?.match(/{{[^}]+}}/g) ?? []).toEqual(value.match(/{{[^}]+}}/g) ?? [])
    }
  })
})
