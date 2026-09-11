import { useEffect, useId, useState } from 'react'
import { Calendar as CalendarIcon, CircleX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { DateRange } from 'react-day-picker'

import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { DatePickerProps, DatePickerValue } from '@/components/ui/datePicker/types'
import { cn } from '@/lib/utils'

const formatDateAsDDMMYYYY = (date: Date) =>
  date.toLocaleDateString('en-US', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })

function isDateRange(value: DatePickerValue): value is DateRange {
  return Boolean(value && !Array.isArray(value) && !(value instanceof Date) && 'from' in value)
}

export function DatePicker(props: DatePickerProps) {
  const {
    label,
    placeholder,
    defaultValue,
    value,
    mode = 'single',
    onChange,
    className,
    onClear,
    clearLabel,
    id,
    disabled,
    ...triggerProps
  } = props
  const { t } = useTranslation()
  const generatedId = useId()
  const triggerId = id ?? `${generatedId}-date-picker`
  const [open, setOpen] = useState(false)
  const [internalSelectedDate, setInternalSelectedDate] = useState<DatePickerValue>(defaultValue)
  const isControlled = Object.prototype.hasOwnProperty.call(props, 'value')
  const selectedDate = isControlled ? value : internalSelectedDate

  useEffect(() => {
    if (disabled) setOpen(false)
  }, [disabled])

  const updateSelectedDate = (date: DatePickerValue) => {
    if (!isControlled) setInternalSelectedDate(date)
    onChange?.(date)
    if (mode === 'single' && date) setOpen(false)
  }

  const formatDisplayDate = (date: DatePickerValue): string => {
    if (!date || (Array.isArray(date) && date.length === 0)) {
      return placeholder || t('label.select_date')
    }

    if (Array.isArray(date)) {
      const visible = date
        .slice(0, 1)
        .map((item) => formatDateAsDDMMYYYY(item))
        .join(', ')
      const extra = date.length > 1 ? ` +${date.length - 1} ${t('label.more')}` : ''
      return `${visible}${extra}`
    }

    if (isDateRange(date)) {
      const from = date.from ? formatDateAsDDMMYYYY(date.from) : ''
      const to = date.to ? formatDateAsDDMMYYYY(date.to) : ''
      return to ? `${from} → ${to}` : from
    }

    return formatDateAsDDMMYYYY(date)
  }

  const handleClear = () => {
    updateSelectedDate(undefined)
    onClear?.()
  }

  const calendarCommonProps = {
    captionLayout: 'dropdown' as const,
    firstWeekContainsDate: 1 as const,
    weekStartsOn: 6 as const,
    numberOfMonths: mode === 'range' ? 2 : 1,
    defaultMonth: selectedDate instanceof Date ? selectedDate : undefined,
  }

  return (
    <div className="flex flex-col gap-3">
      {label && (
        <Label htmlFor={triggerId} className="px-1">
          {label}
        </Label>
      )}

      <Popover open={open} onOpenChange={(nextOpen) => !disabled && setOpen(nextOpen)}>
        <div className="relative">
          <PopoverTrigger asChild>
            <Button
              {...triggerProps}
              id={triggerId}
              type="button"
              variant="outline"
              disabled={disabled}
              className={cn(
                'flex h-14 w-full items-center justify-between gap-2 rounded-2xl border border-black-50 bg-black-50 px-4 py-3 text-sm font-normal text-content-primary shadow-none outline-none transition-all',
                'hover:border-black-100 hover:bg-black-50 hover:text-content-primary',
                'focus:border-brand-500 focus:ring-3 focus:ring-brand-500/20',
                'focus-visible:border-brand-500 focus-visible:ring-3 focus-visible:ring-brand-500/20 focus-visible:outline-none',
                'aria-invalid:border-error-500 aria-invalid:ring-3 aria-invalid:ring-error-500/20',
                'disabled:cursor-not-allowed disabled:border-black-100 disabled:bg-black-100 disabled:text-content-secondary disabled:opacity-100',
                !selectedDate && 'text-content-muted',
                selectedDate && 'pe-20',
                className
              )}
              aria-haspopup="dialog"
              aria-expanded={open}
            >
              <span className="truncate">{formatDisplayDate(selectedDate)}</span>
              <CalendarIcon className="size-4 shrink-0 opacity-50" aria-hidden="true" />
            </Button>
          </PopoverTrigger>

          {selectedDate && (
            <button
              type="button"
              disabled={disabled}
              onClick={handleClear}
              className={cn(
                'absolute end-10 top-1/2 z-10 inline-flex size-7 -translate-y-1/2 items-center justify-center rounded-sm text-content-muted',
                'hover:bg-black-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-500/20',
                'disabled:cursor-not-allowed disabled:text-content-secondary'
              )}
              aria-label={clearLabel ?? t('label.clear_date')}
            >
              <CircleX className="size-4" aria-hidden="true" />
            </button>
          )}
        </div>

        <PopoverContent
          className={cn(
            'z-50 max-h-100 w-auto overflow-y-auto rounded-2xl border border-border-subtle bg-surface-card p-0 text-content-primary shadow-dropdown'
          )}
          align="start"
        >
          {mode === 'multiple' ? (
            <Calendar
              {...calendarCommonProps}
              mode="multiple"
              selected={Array.isArray(selectedDate) ? selectedDate : undefined}
              onSelect={updateSelectedDate}
            />
          ) : mode === 'range' ? (
            <Calendar
              {...calendarCommonProps}
              mode="range"
              selected={isDateRange(selectedDate) ? selectedDate : undefined}
              onSelect={updateSelectedDate}
            />
          ) : (
            <Calendar
              {...calendarCommonProps}
              mode="single"
              selected={selectedDate instanceof Date ? selectedDate : undefined}
              onSelect={updateSelectedDate}
            />
          )}
        </PopoverContent>
      </Popover>
    </div>
  )
}

DatePicker.displayName = 'DatePicker'
