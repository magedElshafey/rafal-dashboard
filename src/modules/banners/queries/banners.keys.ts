export const bannersKeys = {
  all: ['banners'] as const,
  lists: () => [...bannersKeys.all, 'list'] as const,
  list: () => [...bannersKeys.lists()] as const,
  details: () => [...bannersKeys.all, 'detail'] as const,
  detail: (id: number) => [...bannersKeys.details(), id] as const,
}
