export const couponsKeys = {
  all: ['coupons'] as const,
  lists: () => [...couponsKeys.all, 'list'] as const,
  list: () => [...couponsKeys.lists()] as const,
}
