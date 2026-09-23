export const productsKeys = {
  all: ['products'] as const,
  lists: () => [...productsKeys.all, 'list'] as const,
  list: () => [...productsKeys.lists()] as const,
  details: () => [...productsKeys.all, 'detail'] as const,
  detail: (id: number) => [...productsKeys.details(), id] as const,
}
