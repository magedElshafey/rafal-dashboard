import { useCallback } from 'react'
import { FieldValues, Path, PathValue, useFormContext, useWatch } from 'react-hook-form'

import { FormSelect } from '@/components/form'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGroupSubGroupDdl } from '@/hooks/ddl/groups/useGroupSubGroupDdl'
import { useTranslation } from 'react-i18next'

type GroupSubGroupSelectsProps<TFieldValues extends FieldValues> = {
  groupName: Path<TFieldValues>
  subGroupName: Path<TFieldValues>

  groupLabel?: string
  subGroupLabel?: string
  groupLabelClassName?: string
  subGroupLableClassName?: string
  groupPlaceholder?: string
  subGroupPlaceholder?: string

  required?: boolean
  disabled?: boolean
  initialGroupOption?: IDDl
  initialSubGroupOption?: IDDl

  className?: string
  groupTriggerClassName?: string
  subGroupTriggerClassName?: string
  onGroupChange?: (groupId: string) => void
  onSubGroupChange?: (subGroupId: string) => void
  groupErrorMessage?: string
  subGroupErrorMessage?: string
  retryLabel?: string
}

export function GroupSubGroupSelects<TFieldValues extends FieldValues>({
  groupName,
  subGroupName,

  groupLabel,
  subGroupLabel,

  groupPlaceholder,
  subGroupPlaceholder,

  required,
  disabled,
  initialGroupOption,
  initialSubGroupOption,

  className,
  groupTriggerClassName,
  subGroupTriggerClassName,
  groupLabelClassName,
  subGroupLableClassName,
  onGroupChange,
  onSubGroupChange,
  groupErrorMessage,
  subGroupErrorMessage,
  retryLabel,
}: GroupSubGroupSelectsProps<TFieldValues>) {
  const { control, setValue, clearErrors } = useFormContext<TFieldValues>()
  const { t } = useTranslation()

  const selectedGroupId = useWatch({
    control,
    name: groupName,
  })
  const selectedSubGroupId = useWatch({
    control,
    name: subGroupName,
  })

  const {
    groupId,
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
  } = useGroupSubGroupDdl({
    groupId: selectedGroupId ? String(selectedGroupId) : '',
  })

  const withSelectedOption = (options: IDDl[], selectedValue: unknown, initialOption?: IDDl) => {
    const normalizedValue = selectedValue == null ? '' : String(selectedValue)

    if (
      !initialOption ||
      String(initialOption.value) !== normalizedValue ||
      options.some((option) => String(option.value) === normalizedValue)
    ) {
      return options
    }

    return [initialOption, ...options]
  }

  const groupOptions = withSelectedOption(groups, selectedGroupId, initialGroupOption)
  const subGroupOptions = withSelectedOption(subGroups, selectedSubGroupId, initialSubGroupOption)

  const resetSubGroup = useCallback(() => {
    setValue(subGroupName, '' as PathValue<TFieldValues, Path<TFieldValues>>, {
      shouldDirty: true,
      shouldTouch: false,
      shouldValidate: false,
    })

    clearErrors(subGroupName)
  }, [setValue, clearErrors, subGroupName])

  return (
    <div className={cn('grid grid-cols-1 gap-4 sm:grid-cols-2', className)}>
      <div className="space-y-2">
        <FormSelect
          labelClassName={groupLabelClassName}
          name={groupName}
          data={groupOptions}
          valueKey="value"
          labelKey="label"
          label={groupLabel}
          required={required}
          placeholder={groupPlaceholder ?? t('label.select_group')}
          disabled={disabled || isGroupsError}
          isLoading={isGroupsLoading}
          emptyMessage={t('label.no_options')}
          loadingMessage={t('label.loading')}
          triggerClassName={groupTriggerClassName}
          onChange={(newValue) => {
            resetSubGroup()
            onGroupChange?.(newValue)
          }}
        />
        {isGroupsError && groupErrorMessage && retryLabel && (
          <div role="alert" className="flex items-center justify-between gap-3 text-sm text-error-700">
            <span>{groupErrorMessage}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isGroupsFetching}
              onClick={() => void refetchGroups()}
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <FormSelect
          labelClassName={subGroupLableClassName}
          name={subGroupName}
          data={subGroupOptions}
          valueKey="value"
          labelKey="label"
          label={subGroupLabel}
          required={required}
          placeholder={!groupId ? t('label.select_group_first') : (subGroupPlaceholder ?? t('label.select_sub_group'))}
          disabled={disabled || !groupId || isSubGroupsLoading || isSubGroupsError}
          isLoading={isSubGroupsLoading}
          emptyMessage={t('label.no_options')}
          loadingMessage={t('label.loading')}
          triggerClassName={subGroupTriggerClassName}
          onChange={onSubGroupChange}
        />
        {isSubGroupsError && subGroupErrorMessage && retryLabel && (
          <div role="alert" className="flex items-center justify-between gap-3 text-sm text-error-700">
            <span>{subGroupErrorMessage}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={isSubGroupsFetching}
              onClick={() => void refetchSubGroups()}
            >
              {retryLabel}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
