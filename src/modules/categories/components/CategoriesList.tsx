import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import {
  ResponsiveDataDesktop,
  ResponsiveDataFact,
  ResponsiveDataMobileCard,
  ResponsiveDataMobileCards,
  ResponsiveDataTable,
  ResponsiveDataTableCell,
  ResponsiveDataTableRow,
} from '@/components/shared/data-display/ResponsiveDataLayout'
import { Badge } from '@/components/ui/badge'
import { CategoryActions } from '@/modules/categories/components/CategoryActions'
import { CategoryImage } from '@/modules/categories/components/CategoryImage'
import type { Category } from '@/modules/categories/types/category.types'

type CategoriesListProps = {
  categories: readonly Category[]
  onEdit: (category: Category) => void
  onDelete: (category: Category) => void
  actionsDisabled?: boolean
}

export function CategoriesList({ categories, onEdit, onDelete, actionsDisabled = false }: CategoriesListProps) {
  const { t, i18n } = useTranslation()
  const language = i18n.language.startsWith('ar') ? 'ar' : 'en'
  const byId = useMemo(() => new Map(categories.map((category) => [category.id, category])), [categories])
  const columns = [
    { id: 'image', header: t('categories.fields.image'), className: 'w-24' },
    { id: 'name', header: t('categories.fields.name') },
    { id: 'parent', header: t('categories.fields.parent') },
    { id: 'children', header: t('categories.fields.children'), className: 'w-24' },
    { id: 'status', header: t('categories.fields.status') },
    { id: 'sort', header: t('categories.fields.sortOrder'), className: 'w-24' },
    { id: 'actions', header: t('categories.actions.label'), className: 'w-20' },
  ]

  const hierarchyLabel = (category: Category) => {
    if (category.parent_id === null) return t('categories.hierarchy.root')
    const parent = byId.get(category.parent_id)
    return parent
      ? t('categories.hierarchy.childOf', { name: parent.name[language] })
      : t('categories.hierarchy.childId', { id: category.parent_id })
  }

  return (
    <>
      <ResponsiveDataDesktop>
        <ResponsiveDataTable columns={columns}>
          {categories.map((category) => {
            const name = category.name[language]
            return (
              <ResponsiveDataTableRow key={category.id}>
                <ResponsiveDataTableCell>
                  <CategoryImage url={category.image_url} alt={name} />
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-64 whitespace-normal font-medium text-content-primary">
                  <span className="break-words">{name}</span>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="max-w-52 whitespace-normal">
                  <span className="break-words text-content-secondary">{hierarchyLabel(category)}</span>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Badge variant="outline">{category.children_count}</Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <Badge variant={category.is_active ? 'success' : 'outline'}>
                    {t(category.is_active ? 'categories.status.active' : 'categories.status.inactive')}
                  </Badge>
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell className="text-center font-medium">
                  {category.sort_order}
                </ResponsiveDataTableCell>
                <ResponsiveDataTableCell>
                  <CategoryActions
                    category={category}
                    displayName={name}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    disabled={actionsDisabled}
                  />
                </ResponsiveDataTableCell>
              </ResponsiveDataTableRow>
            )
          })}
        </ResponsiveDataTable>
      </ResponsiveDataDesktop>

      <ResponsiveDataMobileCards>
        {categories.map((category) => {
          const name = category.name[language]
          return (
            <ResponsiveDataMobileCard
              key={category.id}
              title={name}
              subtitle={category.slug}
              actions={
                <CategoryActions
                  category={category}
                  displayName={name}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  disabled={actionsDisabled}
                />
              }
              facts={
                <>
                  <ResponsiveDataFact label={t('categories.fields.parent')}>
                    {hierarchyLabel(category)}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('categories.fields.children')}>
                    {category.children_count}
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('categories.fields.status')}>
                    <Badge variant={category.is_active ? 'success' : 'outline'}>
                      {t(category.is_active ? 'categories.status.active' : 'categories.status.inactive')}
                    </Badge>
                  </ResponsiveDataFact>
                  <ResponsiveDataFact label={t('categories.fields.sortOrder')}>
                    {category.sort_order}
                  </ResponsiveDataFact>
                </>
              }
              footer={<CategoryImage url={category.image_url} alt={name} className="size-20" />}
            />
          )
        })}
      </ResponsiveDataMobileCards>
    </>
  )
}
