import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { type FieldPathByValue, type FieldValues, type PathValue, useFormContext, useWatch } from 'react-hook-form'

import { useGroupSubGroupMultiDdl } from '@/hooks/ddl/groups/useGroupSubGroupMultiDdl'
import { cn } from '@/lib/utils'
import { FormMultiSelect } from '@/components/form/FormMultiSelect'
import type { HierarchicalDefaultSelection } from '@/components/form/useHierarchicalDefaultSelection'

type MultiSelectFieldPath<TFieldValues extends FieldValues> = FieldPathByValue<TFieldValues, string[]>

type GroupSubGroupMultiSelectsProps<TFieldValues extends FieldValues> = {
  groupName: MultiSelectFieldPath<TFieldValues>
  subGroupName: MultiSelectFieldPath<TFieldValues>

  groupLabel?: string
  subGroupLabel?: string

  groupPlaceholder?: string
  subGroupPlaceholder?: string

  groupLabelClassName?: string
  subGroupLabelClassName?: string

  groupItemClassName?: string
  subGroupItemClassName?: string

  groupTriggerClassName?: string
  subGroupTriggerClassName?: string

  required?: boolean
  groupRequired?: boolean
  subGroupRequired?: boolean
  disabled?: boolean

  groupErrorMessage?: string
  subGroupErrorMessage?: string
  retryLabel?: string

  allowedGroupIds?: readonly string[]
  allowedSubGroupIds?: readonly string[]
  defaultSelection?: HierarchicalDefaultSelection

  className?: string
}

export function GroupSubGroupMultiSelects<TFieldValues extends FieldValues>({
  groupName,
  subGroupName,

  groupLabel,
  subGroupLabel,

  groupPlaceholder,
  subGroupPlaceholder,

  groupLabelClassName,
  subGroupLabelClassName,

  groupItemClassName,
  subGroupItemClassName,

  groupTriggerClassName,
  subGroupTriggerClassName,

  required = false,
  groupRequired = required,
  subGroupRequired = required,
  disabled = false,

  groupErrorMessage,
  subGroupErrorMessage,
  retryLabel,

  allowedGroupIds,
  allowedSubGroupIds,
  defaultSelection,

  className,
}: GroupSubGroupMultiSelectsProps<TFieldValues>) {
  const { t } = useTranslation()

  const { control, setValue, clearErrors, getFieldState } = useFormContext<TFieldValues>()

  const watchedGroupIds = useWatch({
    control,
    name: groupName,
  })

  const selectedGroupIds = Array.isArray(watchedGroupIds) ? watchedGroupIds.map(String) : []

  const watchedSubGroupIds = useWatch({ control, name: subGroupName })
  const selectedSubGroupIds = Array.isArray(watchedSubGroupIds) ? watchedSubGroupIds.map(String) : []

  const {
    groupIds,
    groups,
    subGroups,
    isGroupsLoading,
    isGroupsFetching,
    isGroupsError,
    refetchGroups,
    isSubGroupsLoading,
    isSubGroupsFetching,
    isSubGroupsError,
    refetchSubGroups,
    isSubGroupDisabled,
  } = useGroupSubGroupMultiDdl({
    groupIds: selectedGroupIds,
  })

  const allowedGroups = allowedGroupIds ? new Set(allowedGroupIds.map(String)) : null
  const allowedSubGroups = allowedSubGroupIds ? new Set(allowedSubGroupIds.map(String)) : null
  const visibleGroups = allowedGroups ? groups.filter((option) => allowedGroups.has(String(option.value))) : groups
  const visibleSubGroups = allowedSubGroups
    ? subGroups.filter((option) => allowedSubGroups.has(String(option.value)))
    : subGroups

  const hasSelectedGroups = groupIds.length > 0

  const visibleGroupIdsKey = visibleGroups
    .map((option) => String(option.value))
    .sort()
    .join('\u0000')
  const selectedGroupIdsKey = selectedGroupIds.slice().sort().join('\u0000')

  const validSubGroupIdsKey = visibleSubGroups
    .map((option) => String(option.value))
    .sort()
    .join('\u0000')
  const selectedSubGroupIdsKey = selectedSubGroupIds.slice().sort().join('\u0000')

  useEffect(() => {
    const initialization = defaultSelection?.initialized.current
    if (!defaultSelection?.enabled || !initialization || initialization.mainGroupsInitialized) return
    if (isGroupsLoading || isGroupsFetching || isGroupsError) return

    initialization.mainGroupsInitialized = true
    if (getFieldState(groupName).isDirty) {
      initialization.mainGroupsSettled = true
      return
    }

    const defaultGroupIds = visibleGroupIdsKey ? visibleGroupIdsKey.split('\u0000') : []
    if (selectedGroupIdsKey === visibleGroupIdsKey) return

    setValue(groupName, defaultGroupIds as PathValue<TFieldValues, typeof groupName>, {
      shouldDirty: false,
      shouldTouch: false,
      shouldValidate: false,
    })
    clearErrors(groupName)
  }, [
    clearErrors,
    defaultSelection,
    getFieldState,
    groupName,
    isGroupsError,
    isGroupsFetching,
    isGroupsLoading,
    selectedGroupIdsKey,
    setValue,
    visibleGroupIdsKey,
  ])

  useEffect(() => {
    const initialization = defaultSelection?.initialized.current
    if (!defaultSelection?.enabled || !initialization?.mainGroupsInitialized) return
    if (selectedGroupIdsKey || !visibleGroupIdsKey) initialization.mainGroupsSettled = true
  }, [defaultSelection, selectedGroupIdsKey, visibleGroupIdsKey])

  useEffect(() => {
    if (isSubGroupsLoading || isSubGroupsError) return

    const validSubGroupIds = new Set(validSubGroupIdsKey ? validSubGroupIdsKey.split('\u0000') : [])
    const currentSubGroupIds: string[] = selectedSubGroupIdsKey ? selectedSubGroupIdsKey.split('\u0000') : []
    const initialization = defaultSelection?.initialized.current
    const shouldInitializeSubGroups =
      defaultSelection?.enabled && initialization?.mainGroupsSettled && !initialization.subGroupsInitialized
    if (shouldInitializeSubGroups && isSubGroupsFetching) return

    const shouldApplySubGroupDefaults = shouldInitializeSubGroups && !getFieldState(subGroupName).isDirty
    const reconciledIds = shouldApplySubGroupDefaults
      ? Array.from(validSubGroupIds)
      : currentSubGroupIds.filter((id) => validSubGroupIds.has(id))

    if (shouldInitializeSubGroups && initialization) initialization.subGroupsInitialized = true

    if (reconciledIds.join('\u0000') === selectedSubGroupIdsKey) return

    setValue(subGroupName, reconciledIds as PathValue<TFieldValues, typeof subGroupName>, {
      shouldDirty: !shouldApplySubGroupDefaults,
      shouldTouch: false,
      shouldValidate: false,
    })

    clearErrors(subGroupName)
  }, [
    clearErrors,
    defaultSelection,
    getFieldState,
    isGroupsFetching,
    isSubGroupsError,
    isSubGroupsFetching,
    isSubGroupsLoading,
    selectedSubGroupIdsKey,
    setValue,
    subGroupName,
    validSubGroupIdsKey,
  ])

  useEffect(() => {
    const initialization = defaultSelection?.initialized.current
    if (!defaultSelection?.enabled || !initialization?.subGroupsInitialized) return
    if (selectedSubGroupIdsKey || !validSubGroupIdsKey || !hasSelectedGroups) {
      initialization.subGroupsSettled = true
    }
  }, [defaultSelection, hasSelectedGroups, selectedSubGroupIdsKey, validSubGroupIdsKey])

  const renderDdlError = (message: string | undefined, retry: () => Promise<unknown>) => (
    <span className="flex flex-wrap items-center gap-2">
      <span>{message ?? t('label.no_options')}</span>
      <button
        type="button"
        className="font-semibold text-brand-600 underline"
        onClick={(event) => {
          event.stopPropagation()
          void retry()
        }}
      >
        {retryLabel ?? t('button.tryAgain')}
      </button>
    </span>
  )

  return (
    <div className={cn('grid grid-cols-1 gap-4 ', className)}>
      <FormMultiSelect
        name={groupName}
        data={visibleGroups}
        valueKey="value"
        labelKey="label"
        label={groupLabel}
        required={groupRequired}
        placeholder={groupPlaceholder ?? t('label.select_groups')}
        disabled={disabled}
        isLoading={isGroupsLoading}
        emptyMessage={isGroupsError ? renderDdlError(groupErrorMessage, refetchGroups) : t('label.no_options')}
        loadingMessage={t('label.loading')}
        itemClassName={groupItemClassName}
        labelClassName={groupLabelClassName}
        triggerClassName={groupTriggerClassName}
      />

      <FormMultiSelect
        name={subGroupName}
        data={visibleSubGroups}
        valueKey="value"
        labelKey="label"
        label={subGroupLabel}
        required={subGroupRequired}
        placeholder={
          !hasSelectedGroups ? t('label.select_group_first') : (subGroupPlaceholder ?? t('label.select_sub_groups'))
        }
        disabled={disabled || isSubGroupDisabled}
        isLoading={isSubGroupsLoading}
        emptyMessage={
          !hasSelectedGroups
            ? t('label.select_group_first')
            : isSubGroupsError
              ? renderDdlError(subGroupErrorMessage, refetchSubGroups)
              : t('label.no_options')
        }
        loadingMessage={t('label.loading')}
        itemClassName={subGroupItemClassName}
        labelClassName={subGroupLabelClassName}
        triggerClassName={subGroupTriggerClassName}
      />
    </div>
  )
}
