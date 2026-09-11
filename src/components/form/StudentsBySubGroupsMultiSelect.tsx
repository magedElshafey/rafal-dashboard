import { useEffect, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { type FieldPathByValue, type FieldValues, type PathValue, useFormContext, useWatch } from 'react-hook-form'

import { FormMultiSelect } from '@/components/form/FormMultiSelect'
import { normalizeStudentSubGroupIds, useStudentsMultiDdl } from '@/hooks/ddl/students/useStudentsMultiDdl'
import type { HierarchicalDefaultSelection } from '@/components/form/useHierarchicalDefaultSelection'

type StringArrayPath<T extends FieldValues> = FieldPathByValue<T, string[]>

type StudentsBySubGroupsMultiSelectProps<T extends FieldValues> = {
  name: StringArrayPath<T>
  subGroupName: StringArrayPath<T>
  label?: string
  placeholder?: string
  required?: boolean
  disabled?: boolean
  enabled?: boolean
  initialOptions?: IDDl[]
  initialSubGroupIds?: string[]
  allowedStudentIds?: string[]
  errorMessage?: string
  partialErrorMessage?: string
  retryLabel?: string
  triggerClassName?: string
  defaultSelection?: HierarchicalDefaultSelection
}

export function StudentsBySubGroupsMultiSelect<T extends FieldValues>({
  name,
  subGroupName,
  label,
  placeholder,
  required,
  disabled = false,
  enabled = true,
  initialOptions = [],
  initialSubGroupIds = [],
  allowedStudentIds,
  errorMessage,
  partialErrorMessage,
  retryLabel,
  triggerClassName,
  defaultSelection,
}: StudentsBySubGroupsMultiSelectProps<T>) {
  const { t } = useTranslation()
  const { control, setValue, clearErrors, getFieldState } = useFormContext<T>()
  const watchedSubGroups = useWatch({ control, name: subGroupName })
  const watchedStudents = useWatch({ control, name })
  const subGroupIds = normalizeStudentSubGroupIds(Array.isArray(watchedSubGroups) ? watchedSubGroups : [])
  const selectedStudentIds = Array.isArray(watchedStudents) ? watchedStudents.map((id: unknown) => String(id)) : []
  const query = useStudentsMultiDdl({ subGroupIds, enabled })
  const currentSubGroupsKey = subGroupIds.join('\u0000')
  const initialSubGroupsKey = normalizeStudentSubGroupIds(initialSubGroupIds).join('\u0000')

  const options = useMemo(() => {
    const merged = new Map<string, IDDl>()
    if (currentSubGroupsKey === initialSubGroupsKey) {
      initialOptions.forEach((option) => merged.set(String(option.value), option))
    }
    query.students.forEach((option) => merged.set(String(option.value), option))
    const allowed = allowedStudentIds ? new Set(allowedStudentIds.map((id: string) => String(id))) : null
    return Array.from(merged.values()).filter((option) => !allowed || allowed.has(String(option.value)))
  }, [allowedStudentIds, currentSubGroupsKey, initialOptions, initialSubGroupsKey, query.students])

  const validIdsKey = options
    .map((option) => String(option.value))
    .sort()
    .join('\u0000')
  const selectedIdsKey = selectedStudentIds.join('\u0000')

  useEffect(() => {
    if (!enabled) return
    const validIds = new Set(validIdsKey ? validIdsKey.split('\u0000') : [])
    const currentIds: string[] = selectedIdsKey ? selectedIdsKey.split('\u0000') : []
    const initialization = defaultSelection?.initialized.current
    const shouldInitializeStudents =
      defaultSelection?.enabled && initialization?.subGroupsSettled && !initialization.studentsInitialized

    if (shouldInitializeStudents && subGroupIds.length === 0) {
      initialization.studentsInitialized = true
      return
    }
    if (query.isLoading || query.isError || (shouldInitializeStudents && query.isFetching)) return

    const shouldApplyStudentDefaults = shouldInitializeStudents && !getFieldState(name).isDirty
    const reconciled = shouldApplyStudentDefaults ? Array.from(validIds) : currentIds.filter((id) => validIds.has(id))
    if (shouldInitializeStudents && initialization) initialization.studentsInitialized = true
    if (reconciled.join('\u0000') === selectedIdsKey) return

    setValue(name, reconciled as PathValue<T, typeof name>, {
      shouldDirty: !shouldApplyStudentDefaults,
      shouldTouch: false,
      shouldValidate: false,
    })
    clearErrors(name)
  }, [
    clearErrors,
    defaultSelection,
    enabled,
    getFieldState,
    name,
    query.isError,
    query.isFetching,
    query.isLoading,
    selectedIdsKey,
    setValue,
    subGroupIds.length,
    validIdsKey,
  ])

  const retryMessage = (
    <span className="flex flex-wrap items-center gap-2">
      <span>{query.isPartialError ? partialErrorMessage : errorMessage}</span>
      <button
        type="button"
        className="font-semibold text-brand-600 underline"
        onClick={(event) => {
          event.stopPropagation()
          void query.retry()
        }}
      >
        {retryLabel ?? t('button.tryAgain')}
      </button>
    </span>
  )

  const hasSubGroups = subGroupIds.length > 0
  return (
    <FormMultiSelect
      name={name}
      data={options}
      valueKey="value"
      labelKey="label"
      label={label}
      required={required}
      placeholder={!hasSubGroups ? t('label.select_group_first') : placeholder}
      disabled={disabled || !enabled || !hasSubGroups}
      isLoading={query.isLoading}
      loadingMessage={t('label.loading')}
      emptyMessage={
        !hasSubGroups ? t('label.select_group_first') : query.isError ? retryMessage : t('label.no_options')
      }
      triggerClassName={triggerClassName}
    />
  )
}
