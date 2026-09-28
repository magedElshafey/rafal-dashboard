export const aboutUsKeys = {
  all: ['about-us'] as const,
  detail: () => [...aboutUsKeys.all, 'detail'] as const,
}
