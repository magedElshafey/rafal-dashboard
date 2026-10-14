import { Suspense } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { MemoryRouter, matchRoutes, useLocation, useRoutes } from 'react-router-dom'
import i18n from '@/config/i18'
import { Routes } from '@/routes/routes'
import { PrivateRoutes } from '@/routes/privateRoutes'
import { dashboardNavigation } from '@/modules/dashboard/layout/dashboard-navigation'
import { BlogNavigation } from '../components/BlogNavigation'
vi.mock('@/modules/blogs/pages/BlogPostsPage', () => ({ default: () => <BlogNavigation /> }))
vi.mock('@/modules/blogs/pages/BlogCategoriesPage', () => ({ default: () => <BlogNavigation /> }))
const children = PrivateRoutes.flatMap((route) => route.children ?? [])
const blogRoutes = children.filter((route) => route.path?.startsWith('/dashboard/blog'))
function Router() {
  const location = useLocation()
  const content = useRoutes(blogRoutes)
  return (
    <>
      <output data-testid="location">{location.pathname + location.search + location.hash}</output>
      <Suspense fallback="loading">{content}</Suspense>
    </>
  )
}
beforeEach(async () => {
  await i18n.changeLanguage('en')
})
describe('unified blog routes', () => {
  it('registers canonical pages once and one parent sidebar destination', () => {
    expect(Routes.blogPosts).toBe('/dashboard/blogs/posts')
    expect(Routes.blogCategories).toBe('/dashboard/blogs/categories')
    for (const url of [Routes.blogPosts, Routes.blogCategories]) {
      expect(matchRoutes(PrivateRoutes, url)?.at(-1)?.route.Component).toBeDefined()
      expect(children.filter((route) => route.path === url)).toHaveLength(1)
    }
    expect(new Set(blogRoutes.map((route) => route.path)).size).toBe(blogRoutes.length)
    expect(dashboardNavigation.filter((item) => item.to.startsWith('/dashboard/blog'))).toEqual([
      expect.objectContaining({ to: Routes.blogs, labelKey: 'blogs.title', match: 'prefix' }),
    ])
  })
  it.each([
    [Routes.blogs, Routes.blogPosts, 'Posts'],
    [Routes.legacyBlogPosts, Routes.blogPosts, 'Posts'],
    [Routes.legacyBlogCategories, Routes.blogCategories, 'Categories'],
  ])('redirects %s preserving URL filter state and hash', async (from, to, label) => {
    const search = '?search=gift&blog_category_id=11&is_featured=0&sort_by=title&sort_dir=asc&page=2#list'
    render(
      <MemoryRouter initialEntries={[from + search]}>
        <Router />
      </MemoryRouter>
    )
    expect(await screen.findByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    expect(screen.getByTestId('location')).toHaveTextContent(to + search)
  })
  it.each(['en', 'ar'])('supports local navigation and active labels in %s', async (lang) => {
    await i18n.changeLanguage(lang)
    render(
      <MemoryRouter initialEntries={[Routes.blogPosts]}>
        <Router />
      </MemoryRouter>
    )
    const posts = await screen.findByRole('link', { name: lang === 'ar' ? 'المقالات' : 'Posts' })
    const categories = screen.getByRole('link', { name: lang === 'ar' ? 'تصنيفات المقالات' : 'Categories' })
    expect(posts).toHaveAttribute('aria-current', 'page')
    expect(categories).not.toHaveAttribute('aria-current')
    await userEvent.click(categories)
    expect(screen.getByTestId('location')).toHaveTextContent(Routes.blogCategories)
    expect(screen.getByRole('link', { name: lang === 'ar' ? 'تصنيفات المقالات' : 'Categories' })).toHaveAttribute(
      'aria-current',
      'page'
    )
    expect(i18n.t('blogs.title')).toBe(lang === 'ar' ? 'المدونة' : 'Blog')
  })
})
