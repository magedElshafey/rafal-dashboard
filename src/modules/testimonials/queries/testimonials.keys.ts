export const testimonialsKeys = {
  all: ['testimonials'] as const,
  lists: () => [...testimonialsKeys.all, 'list'] as const,
  list: () => [...testimonialsKeys.lists()] as const,
}
