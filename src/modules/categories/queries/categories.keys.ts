export const categoriesKeys = {
  all: ['categories'] as const,
  lists: () => [...categoriesKeys.all, 'list'] as const,
  list: () => [...categoriesKeys.lists()] as const,
  details: () => [...categoriesKeys.all, 'detail'] as const,
  detail: (id: number) => [...categoriesKeys.details(), id] as const,
}
