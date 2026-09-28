export const staticPagesKeys = {
  all: ['static-pages'] as const,
  lists: () => [...staticPagesKeys.all, 'list'] as const,
  list: () => [...staticPagesKeys.lists()] as const,
  details: () => [...staticPagesKeys.all, 'detail'] as const,
  detail: (id: number) => [...staticPagesKeys.details(), id] as const,
}
