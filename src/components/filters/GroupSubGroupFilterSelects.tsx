import FilterSelect from '@/components/filters/FilterSelect'
import { useGroupSubGroupDdl } from '@/hooks/ddl/groups/useGroupSubGroupDdl'
import { cn } from '@/lib/utils'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'

type GroupSubGroupFilterSelectsProps = {
  groupName?: string
  subGroupName?: string

  groupLabel?: string
  subGroupLabel?: string

  groupPlaceholder?: string
  subGroupPlaceholder?: string

  disabled?: boolean
  className?: string

  groupTriggerClassName?: string
  subGroupTriggerClassName?: string
  initialGroupOption?: IDDl
  initialSubGroupOption?: IDDl
  groupClearLabel?: string
  subGroupClearLabel?: string
}

export function GroupSubGroupFilterSelects({
  groupName = 'group_id',
  subGroupName = 'sub_group_id',

  groupLabel,
  subGroupLabel,

  groupPlaceholder,
  subGroupPlaceholder,

  disabled,
  className,
  groupTriggerClassName,
  subGroupTriggerClassName,
  initialGroupOption,
  initialSubGroupOption,
  groupClearLabel,
  subGroupClearLabel,
}: GroupSubGroupFilterSelectsProps) {
  const { forwardQuery, forwardDeleteQuery } = useQuery()
  const { t } = useTranslation()

  const selectedGroupId = forwardQuery?.[groupName] ? String(forwardQuery[groupName]) : ''

  const { groupId, groups, subGroups, isGroupsLoading, isSubGroupsLoading } = useGroupSubGroupDdl({
    groupId: selectedGroupId,
  })

  const withSelectedOption = (options: IDDl[], selectedValue: string, initialOption?: IDDl) => {
    if (
      !initialOption ||
      String(initialOption.value) !== selectedValue ||
      options.some((option) => String(option.value) === selectedValue)
    ) {
      return options
    }

    return [initialOption, ...options]
  }

  const selectedSubGroupId = forwardQuery?.[subGroupName] ? String(forwardQuery[subGroupName]) : ''
  const groupOptions = withSelectedOption(groups, selectedGroupId, initialGroupOption)
  const subGroupOptions = withSelectedOption(subGroups, selectedSubGroupId, initialSubGroupOption)

  const handleGroupChange = useCallback(() => {
    forwardDeleteQuery(subGroupName)
  }, [forwardDeleteQuery, subGroupName])

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <FilterSelect
        name={groupName}
        data={groupOptions}
        valueKey="value"
        labelKey="label"
        label={groupLabel}
        placeholder={groupPlaceholder ?? t('label.select_group')}
        disabled={disabled}
        isLoading={isGroupsLoading}
        emptyMessage={t('label.no_options')}
        loadingMessage={t('label.loading')}
        triggerClassName={groupTriggerClassName}
        onFilterChange={handleGroupChange}
        clearLabel={groupClearLabel}
      />

      <FilterSelect
        name={subGroupName}
        data={subGroupOptions}
        valueKey="value"
        labelKey="label"
        label={subGroupLabel}
        placeholder={!groupId ? t('label.select_group_first') : (subGroupPlaceholder ?? t('label.select_sub_group'))}
        disabled={disabled || !groupId}
        isLoading={isSubGroupsLoading}
        emptyMessage={t('label.no_options')}
        loadingMessage={t('label.loading')}
        triggerClassName={subGroupTriggerClassName}
        clearLabel={subGroupClearLabel}
      />
    </div>
  )
}
