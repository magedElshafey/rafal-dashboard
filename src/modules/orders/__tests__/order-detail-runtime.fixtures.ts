import show from './order-detail.fixture.json'

const baseItem = show.data.items[0]

export const confirmedOrder18 = {
  ...show,
  data: {
    ...show.data,
    id: 18,
    order_number: 'RF-10018',
    display_number: '#RF-10018',
    status: 'confirmed',
    items: [
      {
        ...baseItem,
        id: 25,
        product_name: 'White Musk Perfume',
        variant_sku: 'RAF-VAR-vve-8333',
        variant_attributes: [],
        quantity: 3,
        unit_price: '249.72',
        discount_amount: '0.00',
        line_total: '749.16',
      },
    ],
    allowed_transitions: ['processing', 'cancelled'],
  },
}

export const processingOrder19 = {
  ...show,
  data: {
    ...show.data,
    id: 19,
    order_number: 'RF-10019',
    display_number: '#RF-10019',
    status: 'processing',
    items: [{ ...baseItem, id: 26, variant_attributes: [] }],
    allowed_transitions: ['shipped', 'cancelled'],
  },
}

export const cancelledOrder20 = {
  ...show,
  data: {
    ...show.data,
    id: 20,
    order_number: 'RF-10020',
    display_number: '#RF-10020',
    status: 'cancelled',
    customer: {
      type: 'registered',
      name: '',
      email: 'magedelshafey98@gmail.com',
      phone: '+966501234567',
    },
    items: [
      { ...baseItem, id: 27, product_name: 'White Musk Perfume', variant_attributes: [] },
      {
        ...baseItem,
        id: 28,
        product_name: 'Gold Ring',
        variant_attributes: { size: 'S', color: 'gold' },
        personalization: { text: 'توتا', language: 'ar', fee: '19.84' },
      },
      { ...baseItem, id: 29, product_name: 'Aqua Bracelet', variant_attributes: { color: '#03C4DD' } },
      { ...baseItem, id: 30, product_name: 'Plain Pendant', variant_attributes: [] },
      {
        ...baseItem,
        id: 31,
        product_name: 'Personalized Necklace',
        variant_attributes: { size: 'S' },
        personalization: { text: 'تيست', language: 'ar', fee: '11.48' },
      },
      { ...baseItem, id: 32, product_name: 'Historic White Variant', variant_attributes: { color: 'white' } },
    ],
    status_history: [
      ...show.data.status_history,
      {
        from_status: 'confirmed',
        to_status: 'cancelled',
        note: 'Order cancelled',
        actor_type: 'admin',
        actor_id: 1,
        actor_name: 'Super Admin',
        created_at: '2026-10-04T06:41:25+00:00',
      },
    ],
    allowed_transitions: [],
    cancelled_at: '2026-10-04T06:41:25+00:00',
  },
}
