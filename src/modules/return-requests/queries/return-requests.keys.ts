export const returnRequestsKeys = {
  all: ['return-requests'] as const,
  lists: () => [...returnRequestsKeys.all, 'list'] as const,
  list: () => [...returnRequestsKeys.lists()] as const,
  details: () => [...returnRequestsKeys.all, 'detail'] as const,
  detail: (id: number) => [...returnRequestsKeys.details(), id] as const,
}
