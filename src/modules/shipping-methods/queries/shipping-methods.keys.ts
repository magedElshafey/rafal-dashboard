export const shippingMethodsKeys = {
  all: ['shipping-methods'] as const,
  lists: () => [...shippingMethodsKeys.all, 'list'] as const,
  list: () => [...shippingMethodsKeys.lists()] as const,
}
