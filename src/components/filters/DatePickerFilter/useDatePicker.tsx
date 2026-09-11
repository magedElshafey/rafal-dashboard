import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useQuery } from '@/store/queryContext/useQueryContext'
import { formatDateInputValue, parseDate } from '@/utils/date/date.helpers'
import { isDateRange } from 'react-day-picker'

import type {
  DatePickerHookReturn,
  IDatePickerProps,
  TDatePickerValueTemplate,
} from '@/components/filters/DatePickerFilter/types'
import { DatePickerValue } from '@/components/ui/datePicker/types'

type ResolvedDatePickerProps = IDatePickerProps & {
  queryName: NonNullable<IDatePickerProps['queryName']>
}

export default function useDatePicker({ queryName, mode = 'range' }: ResolvedDatePickerProps): DatePickerHookReturn {
  const { t } = useTranslation()
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery, forwardReplaceQueries } = useQuery()
  const queryValueKey =
    mode === 'range' && typeof queryName === 'object'
      ? `${forwardQuery?.[queryName.start] ?? ''}|${forwardQuery?.[queryName.end] ?? ''}`
      : typeof queryName === 'string'
        ? (forwardQuery?.[queryName] ?? '')
        : ''
  const queryValue = useMemo((): DatePickerValue => {
    if (mode === 'range') {
      const [start, end] = queryValueKey.split('|')

      if (!start && !end) return undefined

      return {
        from: start ? (parseDate(start) ?? undefined) : undefined,
        to: end ? (parseDate(end) ?? undefined) : undefined,
      }
    }

    if (!queryValueKey) return undefined

    if (mode === 'multiple') {
      const values = queryValueKey.split(',').filter(Boolean)

      const dates = values.map(parseDate).filter((value): value is Date => value !== null)
      return dates.length ? dates : undefined
    }

    return parseDate(queryValueKey) ?? undefined
  }, [queryValueKey, mode])
  const [value, setValue] = useState<DatePickerValue>(queryValue)

  useEffect(() => {
    setValue(queryValue)
  }, [queryValue])

  const handleSelect = (value: DatePickerValue) => {
    setValue(value)

    if (!value) return

    const formatted = formatValue(value)
    setQueryValue(formatted)
  }

  const formatValue = (value: DatePickerValue): TDatePickerValueTemplate => {
    if (mode === 'range' && isDateRange(value)) {
      const from = value?.from ? formatDateInputValue(value.from) : ''
      const to = value?.to ? formatDateInputValue(value.to) : ''
      return `${from} - ${to}`
    }

    if (mode === 'multiple' && Array.isArray(value)) {
      return value.map((day) => formatDateInputValue(day))
    }

    // single mode
    return formatDateInputValue(value as Date)
  }

  const setQueryValue = (formatted: TDatePickerValueTemplate) => {
    if (mode === 'range' && typeof formatted === 'string') {
      const [from, to] = formatted.split(' - ')
      const { start, end } = queryName as { start: string; end: string }
      if (from && to) {
        if (forwardQuery?.[start] === from && forwardQuery?.[end] === to) return
        forwardReplaceQueries([start, end], {
          [start]: from,
          [end]: to,
        })
      }
    } else if (typeof queryName === 'string') {
      const value = Array.isArray(formatted) ? formatted.join(',') : (formatted as string)
      forwardAddQuery({ [queryName]: value })
    }
  }

  const removeQueryFilter = () => {
    setValue(undefined)

    if (mode === 'range') {
      const { start, end } = queryName as { start: string; end: string }
      forwardReplaceQueries([start, end], {})
    } else if (typeof queryName === 'string') {
      forwardDeleteQuery(queryName)
    }
  }
  return {
    t,
    handleSelect,
    removeQueryFilter,
    getValue: () => value,
  }
}
