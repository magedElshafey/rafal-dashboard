export const adminsKeys = {
  all: ['admins'] as const,
  lists: () => [...adminsKeys.all, 'list'] as const,
  list: () => [...adminsKeys.lists()] as const,
  details: () => [...adminsKeys.all, 'detail'] as const,
  detail: (id: number) => [...adminsKeys.details(), id] as const,
}
