import { expect, it } from 'vitest'
import ar from './ar.json'
import en from './en.json'

function keys(value: object, prefix = ''): string[] {
  return Object.entries(value).flatMap(([key, child]) => {
    const path = prefix + key.replace(/_(zero|one|two|few|many|other)$/, '')
    return typeof child === 'object' && child !== null ? keys(child, path + '.') : [path]
  })
}
it('keeps Role Arabic and English translation keys in parity, including group controls', () => {
  expect([...new Set(keys(ar))].sort()).toEqual([...new Set(keys(en))].sort())
})
