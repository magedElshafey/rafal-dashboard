import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

import FilterSelect from '@/components/filters/FilterSelect'
import { adminSortDirections, adminSortValues } from '@/modules/admins/utils/admin-filters'
import { useRoles } from '@/modules/roles/hooks/useRoles'

export function AdminFilters() {
  const { t } = useTranslation()
  const rolesQuery = useRoles()
  const roles = useMemo(() => rolesQuery.data?.pages.flatMap((page) => page.items) ?? [], [rolesQuery.data])
  const all = t('admins.filters.all')

  return (
    <div className="space-y-4">
      <FilterSelect
        name="role"
        label={t('admins.filters.role')}
        placeholder={all}
        data={roles}
        valueKey="id"
        labelKey="name"
        isLoading={rolesQuery.isLoading}
        isFetchingNextPage={rolesQuery.isFetchingNextPage}
        hasNextPage={rolesQuery.hasNextPage && !rolesQuery.isFetchNextPageError}
        onLoadMore={() => rolesQuery.fetchNextPage({ cancelRefetch: false })}
      />
      <FilterSelect
        name="sort_by"
        label={t('admins.filters.sortBy')}
        placeholder={all}
        data={adminSortValues.map((value) => ({ value, label: t(`admins.filters.sort.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
      <FilterSelect
        name="sort_dir"
        label={t('admins.filters.sortDir')}
        placeholder={all}
        data={adminSortDirections.map((value) => ({ value, label: t(`admins.filters.direction.${value}`) }))}
        valueKey="value"
        labelKey="label"
      />
    </div>
  )
}
