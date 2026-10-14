import { describe, expect, it } from 'vitest'
import { createBannerSchema } from './banner.schema'
import { getBannerDestinationType, normalizeBannerDestinationId } from '../utils/banner.utils'

const schema = createBannerSchema('create', false, {
  titleArRequired: 'required', titleEnRequired: 'required',
  platformRequired: 'required', positionRequired: 'position', destinationRequired: 'destination',
  dateInvalid: 'date', endBeforeStart: 'date', sortRequired: 'sort', sortInteger: 'sort',
  sortNonNegative: 'sort', imageRequired: 'image',
})
const valid = {
  title: {ar: 'عنوان', en: 'Title'}, platform: 'both', position: 'hero',
  destination_type: 'product', product_id: 37, category_id: null, starts_at: '', ends_at: '',
  is_active: true, sort_order: 0, image: {files: [new File(['image'], 'banner.png')], removedExistingIds: []},
}

describe('banner destination and position requirements', () => {
  it.each(['hero', 'men', 'gifts', 'loyalty'])('accepts position %s independently of platform', async position => {
    expect(await schema.isValid({...valid, position, platform: 'mobile'})).toBe(true)
  })
  it.each([
    {position: ''}, {position: 'other'}, {destination_type: ''}, {product_id: null},
    {product_id: 0}, {product_id: -1}, {product_id: Number.MAX_SAFE_INTEGER + 1},
    {category_id: 12}, {destination_type: 'category'},
  ])('rejects invalid or stale state %s', async fields => {
    expect(await schema.isValid({...valid, ...fields})).toBe(false)
  })
  it('accepts category selection only after clearing the product', async () => {
    expect(await schema.isValid({...valid, destination_type: 'category', product_id: null, category_id: 12})).toBe(true)
  })
  it('requires explicit correction of missing or conflicting backend destinations', () => {
    expect(getBannerDestinationType({product_id: null, category_id: null})).toBe('')
    expect(getBannerDestinationType({product_id: 37, category_id: 12})).toBe('')
    expect(getBannerDestinationType({product_id: 37, category_id: Number.NaN})).toBe('')
    expect(getBannerDestinationType({product_id: 37, category_id: null})).toBe('product')
    expect(getBannerDestinationType({product_id: null, category_id: 12})).toBe('category')
    expect(normalizeBannerDestinationId('37')).toBe(37)
    expect(normalizeBannerDestinationId('9007199254740993')).toBeNaN()
  })
})
