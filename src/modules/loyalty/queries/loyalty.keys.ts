export const loyaltyKeys = {
  all: ['loyalty'] as const,
  settings: () => [...loyaltyKeys.all, 'settings'] as const,
  histories: () => [...loyaltyKeys.all, 'settings-history'] as const,
  history: (perPage: number) => [...loyaltyKeys.histories(), { perPage }] as const,
}
