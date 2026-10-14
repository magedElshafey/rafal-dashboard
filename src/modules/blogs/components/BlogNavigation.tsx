import { NavLink } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Routes } from '@/routes/routes'
export function BlogNavigation() {
  const { t } = useTranslation()
  return (
    <nav aria-label={t('blogs.navigation')} className="flex flex-wrap gap-2">
      {[
        [Routes.blogPosts, 'blogs.posts'],
        [Routes.blogCategories, 'blogs.categories'],
      ].map(([to, label]) => (
        <NavLink
          key={to}
          to={to}
          end
          className={({ isActive }) =>
            'rounded-md px-4 py-2 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ' +
            (isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted')
          }
        >
          {t(label)}
        </NavLink>
      ))}
    </nav>
  )
}
