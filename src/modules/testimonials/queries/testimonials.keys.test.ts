import { describe, expect, it } from 'vitest'

import { testimonialsKeys } from '@/modules/testimonials/queries/testimonials.keys'

describe('testimonialsKeys', () => {
  it('defines only list-oriented keys because no Show endpoint exists', () => {
    expect(testimonialsKeys.all).toEqual(['testimonials'])
    expect(testimonialsKeys.lists()).toEqual(['testimonials', 'list'])
    expect(testimonialsKeys.list()).toEqual([
      'testimonials',
      'list',
      { rating: null, createdFrom: '', createdTo: '', sortBy: null, sortDir: null },
    ])
    expect(testimonialsKeys).not.toHaveProperty('detail')
  })
})
