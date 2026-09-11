export type DateInput = string | number | Date | null | undefined

export type AppLocale = 'en' | 'ar'

export type AppDirection = 'ltr' | 'rtl'

type LocalizedFormatOptions = {
  locale?: AppLocale

  /**
   * Only affects Arabic formatting.
   *
   * true:
   * ٢٠ يوليو ٢٠٢٦
   *
   * false:
   * 20 يوليو 2026
   *
   * @default true
   */
  useArabicDigits?: boolean

  /**
   * Uses the browser local timezone by default.
   *
   * Examples:
   * - Africa/Cairo
   * - UTC
   */
  timeZone?: string
}

type FormatDateOptions = LocalizedFormatOptions & {
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
}

type FormatShortDateOptions = LocalizedFormatOptions

type FormatMonthDayYearOptions = LocalizedFormatOptions

type FormatMonthYearOptions = LocalizedFormatOptions

type FormatTimeOptions = LocalizedFormatOptions & {
  /**
   * When true:
   * - English: 2:30 PM
   * - Arabic: ٢:٣٠ م
   *
   * When false:
   * - English: 14:30
   * - Arabic: ١٤:٣٠
   *
   * @default true
   */
  hour12?: boolean

  /**
   * @default false
   */
  includeSeconds?: boolean
}

export type FormattedTimeRange = {
  start: string
  end: string
  label: string
}

type FormatDateTimeOptions = LocalizedFormatOptions & {
  dateStyle?: 'full' | 'long' | 'medium' | 'short'
  timeStyle?: 'medium' | 'short'

  /**
   * @default true
   */
  hour12?: boolean
}

type RelativeTimeOptions = Pick<LocalizedFormatOptions, 'locale' | 'useArabicDigits'> & {
  locale?: AppLocale
  now?: Date
  numeric?: 'always' | 'auto'
  style?: 'long' | 'short' | 'narrow'
}

type ApiDateTimeOptions = {
  /**
   * Use `local` for values selected by the user
   * through a date or datetime-local input.
   *
   * Use `utc` only when the backend explicitly
   * expects UTC values without a timezone suffix.
   *
   * @default local
   */
  timeZone?: 'local' | 'utc'
}

type GetDaysLeftOptions = {
  /**
   * Useful for testing or calculating relative
   * to a specific point in time.
   */
  now?: Date

  /**
   * When true, expired dates return 0 instead
   * of a negative number.
   *
   * @default true
   */
  clampAtZero?: boolean
}

type DateDisplayAttributes = {
  lang: AppLocale
  dir: AppDirection
}

const APP_LOCALE_CONFIG: Record<
  AppLocale,
  {
    direction: AppDirection
    intlLocale: string
    intlLocaleWithLatinDigits: string
  }
> = {
  en: {
    direction: 'ltr',
    intlLocale: 'en-GB-u-ca-gregory-nu-latn',
    intlLocaleWithLatinDigits: 'en-GB-u-ca-gregory-nu-latn',
  },
  ar: {
    direction: 'rtl',
    intlLocale: 'ar-EG-u-ca-gregory-nu-arab',
    intlLocaleWithLatinDigits: 'ar-EG-u-ca-gregory-nu-latn',
  },
}

const RELATIVE_TIME_UNITS = [
  { unit: 'year', seconds: 60 * 60 * 24 * 365 },
  { unit: 'month', seconds: 60 * 60 * 24 * 30 },
  { unit: 'week', seconds: 60 * 60 * 24 * 7 },
  { unit: 'day', seconds: 60 * 60 * 24 },
  { unit: 'hour', seconds: 60 * 60 },
  { unit: 'minute', seconds: 60 },
  { unit: 'second', seconds: 1 },
] as const

const LOCAL_DATE_PATTERN = /^(\d{4})-(\d{2})-(\d{2})(?:[T\s](\d{2}):(\d{2})(?::(\d{2})(?:\.(\d{1,3}))?)?)?$/

const MILLISECONDS_PER_DAY = 24 * 60 * 60 * 1000

function padDatePart(value: number): string {
  return String(value).padStart(2, '0')
}

/**
 * Converts i18next language values such as:
 *
 * - ar
 * - ar-EG
 * - en
 * - en-US
 *
 * into the supported application locales.
 */
export function resolveAppLocale(language?: string | null): AppLocale {
  return language?.toLowerCase().startsWith('ar') ? 'ar' : 'en'
}

export function getDateDirection(locale: AppLocale = 'en'): AppDirection {
  return APP_LOCALE_CONFIG[locale].direction
}

/**
 * Attributes that should be applied to the element
 * rendering the localized date.
 *
 * @example
 * <time {...getDateDisplayAttributes(locale)}>
 *   {formatDateTime(value, { locale })}
 * </time>
 */
export function getDateDisplayAttributes(locale: AppLocale = 'en'): DateDisplayAttributes {
  return {
    lang: locale,
    dir: getDateDirection(locale),
  }
}

function getIntlLocale(locale: AppLocale, useArabicDigits: boolean): string {
  const config = APP_LOCALE_CONFIG[locale]

  if (locale === 'ar' && !useArabicDigits) {
    return config.intlLocaleWithLatinDigits
  }

  return config.intlLocale
}

/**
 * Supports ISO values containing more than three
 * fractional-second digits.
 *
 * Example:
 * 2026-07-06T12:06:05.000000Z
 *
 * Becomes:
 * 2026-07-06T12:06:05.000Z
 */
function normalizeIsoFractionalSeconds(value: string): string {
  return value.replace(/(\d{2}:\d{2}:\d{2}\.\d{3})\d+/, '$1')
}

/**
 * Parses date-only and datetime-local values explicitly
 * to avoid browser-specific parsing behavior.
 */
function parseLocalDateString(value: string): Date | null {
  const match = value.match(LOCAL_DATE_PATTERN)

  if (!match) return null

  const [
    ,
    yearValue,
    monthValue,
    dayValue,
    hoursValue = '00',
    minutesValue = '00',
    secondsValue = '00',
    millisecondsValue = '0',
  ] = match

  const year = Number(yearValue)
  const month = Number(monthValue)
  const day = Number(dayValue)
  const hours = Number(hoursValue)
  const minutes = Number(minutesValue)
  const seconds = Number(secondsValue)
  const milliseconds = Number(millisecondsValue.padEnd(3, '0'))

  const date = new Date(year, month - 1, day, hours, minutes, seconds, milliseconds)

  /**
   * Prevents invalid values such as:
   *
   * - 2026-02-31
   * - 2026-13-10
   * - 2026-07-20T25:00
   *
   * from silently rolling into another date.
   */
  const isValid =
    date.getFullYear() === year &&
    date.getMonth() === month - 1 &&
    date.getDate() === day &&
    date.getHours() === hours &&
    date.getMinutes() === minutes &&
    date.getSeconds() === seconds &&
    date.getMilliseconds() === milliseconds

  return isValid ? date : null
}

function parseDateValue(value: DateInput): Date | null {
  if (value === null || value === undefined || value === '') {
    return null
  }

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value
  }

  if (typeof value === 'number') {
    /**
     * Supports Unix timestamps in seconds or milliseconds.
     */
    const timestamp = Math.abs(value) < 1_000_000_000_000 ? value * 1000 : value

    const date = new Date(timestamp)

    return Number.isNaN(date.getTime()) ? null : date
  }

  /**
   * Handles values from:
   *
   * - input[type="date"]
   * - input[type="datetime-local"]
   */
  if (LOCAL_DATE_PATTERN.test(value)) {
    return parseLocalDateString(value)
  }

  /**
   * Handles complete ISO strings returned by APIs.
   *
   * Examples:
   *
   * - 2026-07-06T12:06:05Z
   * - 2026-07-06T12:06:05.000000Z
   * - 2026-07-06T12:06:05+03:00
   */
  const normalizedValue = normalizeIsoFractionalSeconds(value)

  const date = new Date(normalizedValue)

  return Number.isNaN(date.getTime()) ? null : date
}

/* =========================================================
    API formatting
  ========================================================= */

/**
 * Formats a date using the backend-required format:
 *
 * d-m-Y H:i
 *
 * Example:
 * 15-07-2026 14:30
 *
 * API values intentionally always use Latin digits.
 * They must not depend on the current UI language.
 */
export function formatDateTimeForApi(value: DateInput, options: ApiDateTimeOptions = {}): string {
  const { timeZone = 'local' } = options

  const date = parseDateValue(value)

  if (!date) {
    throw new RangeError('Cannot format an invalid date for the API.')
  }

  const useUtc = timeZone === 'utc'

  const day = useUtc ? date.getUTCDate() : date.getDate()
  const month = useUtc ? date.getUTCMonth() + 1 : date.getMonth() + 1
  const year = useUtc ? date.getUTCFullYear() : date.getFullYear()
  const hours = useUtc ? date.getUTCHours() : date.getHours()
  const minutes = useUtc ? date.getUTCMinutes() : date.getMinutes()

  const formattedDate = `${padDatePart(day)}-${padDatePart(month)}-${year}`
  const formattedTime = `${padDatePart(hours)}:${padDatePart(minutes)}`

  return `${formattedDate} ${formattedTime}`
}

/**
 * Formats a local date-only value as D-M-YYYY
 * for APIs that require unpadded parts.
 *
 * Example:
 * 5-7-2026
 */
export function formatDateForApi(value: DateInput): string {
  const date = parseDateValue(value)

  if (!date) {
    throw new RangeError('Cannot format an invalid date for the API.')
  }

  return `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`
}

/* =========================================================
    HTML input formatting
  ========================================================= */

/**
 * Returns a local calendar date in the value format
 * required by input[type="date"].
 *
 * This must always remain YYYY-MM-DD with Latin digits,
 * regardless of the current application language.
 */
export function formatDateInputValue(value: DateInput = new Date()): string {
  const date = parseDateValue(value)

  if (!date) {
    throw new RangeError('Cannot format an invalid date for a date input.')
  }

  return [date.getFullYear(), padDatePart(date.getMonth() + 1), padDatePart(date.getDate())].join('-')
}

/**
 * Returns a local date and time in the value format required by
 * input[type="datetime-local"]. The value deliberately has no timezone
 * suffix because it represents the user's local wall-clock selection.
 */
export function formatDateTimeInputValue(value: DateInput = new Date()): string {
  const date = parseDateValue(value)

  if (!date) {
    throw new RangeError('Cannot format an invalid date for a datetime-local input.')
  }

  return `${formatDateInputValue(date)}T${padDatePart(date.getHours())}:${padDatePart(date.getMinutes())}`
}

/* =========================================================
    Validation and comparison
  ========================================================= */

export function isValidDateInput(value: DateInput): boolean {
  return parseDateValue(value) !== null
}

/** Returns a defensive Date copy, or null for malformed API/input values. */
export function parseDate(value: DateInput): Date | null {
  const date = parseDateValue(value)

  return date ? new Date(date.getTime()) : null
}

export function isDateTimeOnOrAfter(value: DateInput, minimum: DateInput): boolean {
  const date = parseDateValue(value)
  const minimumDate = parseDateValue(minimum)

  return Boolean(date && minimumDate && date.getTime() >= minimumDate.getTime())
}

export function isDateTimeOnOrBefore(value: DateInput, maximum: DateInput): boolean {
  const date = parseDateValue(value)
  const maximumDate = parseDateValue(maximum)

  return Boolean(date && maximumDate && date.getTime() <= maximumDate.getTime())
}

/**
 * Compares local calendar dates after removing
 * the time-of-day from both values.
 */
export function isDateOnOrAfter(value: DateInput, minimum: DateInput): boolean {
  const date = parseDateValue(value)
  const minimumDate = parseDateValue(minimum)

  if (!date || !minimumDate) return false

  const normalizedDate = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  const normalizedMinimum = new Date(minimumDate.getFullYear(), minimumDate.getMonth(), minimumDate.getDate())

  return normalizedDate.getTime() >= normalizedMinimum.getTime()
}

/* =========================================================
    Localized UI formatting
  ========================================================= */

export function formatDate(value: DateInput, options: FormatDateOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, dateStyle = 'medium', timeZone } = options

  const date = parseDateValue(value)

  if (!date) return ''

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), {
    dateStyle,
    timeZone,
  }).format(date)
}

export function formatShortDate(value: DateInput, options: FormatShortDateOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone } = options

  const date = parseDateValue(value)

  if (!date) return ''

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(date)
}

/**
 * Formats the exact calendar date used by grouped timelines.
 *
 * English intentionally follows the month-day-year product format:
 * Jul 30, 2026
 *
 * Arabic keeps the locale-appropriate ordering and digit preference:
 * ٣٠ يوليو ٢٠٢٦
 */
export function formatMonthDayYear(value: DateInput, options: FormatMonthDayYearOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone } = options

  const date = parseDateValue(value)

  if (!date) return ''

  const intlLocale = locale === 'en' ? 'en-US-u-ca-gregory-nu-latn' : getIntlLocale(locale, useArabicDigits)

  return new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(date)
}

export function formatMonthYear(value: DateInput, options: FormatMonthYearOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone } = options
  const date = parseDateValue(value)

  if (!date) return ''

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), {
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(date)
}

/**
 * Formats time according to the selected language.
 *
 * Arabic:
 * ٢:٣٠ م
 * ٩:١٥ ص
 *
 * English:
 * 2:30 pm
 * 9:15 am
 */
export function formatTime(value: DateInput, options: FormatTimeOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone, hour12 = true, includeSeconds = false } = options

  const date = parseDateValue(value)

  if (!date) return ''

  const formatOptions: Intl.DateTimeFormatOptions = {
    hour: 'numeric',
    minute: '2-digit',
    hour12,
    timeZone,
  }

  if (includeSeconds) {
    formatOptions.second = '2-digit'
  }

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), formatOptions).format(date)
}

/**
 * Formats two valid instants as a localized display range while retaining the
 * individual labels for semantic <time> elements.
 */
export function formatTimeRange(
  startValue: DateInput,
  endValue: DateInput,
  options: FormatTimeOptions = {}
): FormattedTimeRange | null {
  const start = formatTime(startValue, options)
  const end = formatTime(endValue, options)

  if (!start || !end) return null

  return { start, end, label: `${start} – ${end}` }
}

/**
 * Formats the date and time together using Intl.
 *
 * Do not manually concatenate formatDate() and formatTime().
 * Intl handles the correct order and punctuation for each language.
 *
 * Arabic:
 * ٢٠ يوليو ٢٠٢٦، ٢:٣٠ م
 *
 * English:
 * 20 Jul 2026, 2:30 pm
 */
export function formatDateTime(value: DateInput, options: FormatDateTimeOptions = {}): string {
  const {
    locale = 'en',
    useArabicDigits = true,
    timeZone,
    dateStyle = 'medium',
    timeStyle = 'short',
    hour12 = true,
  } = options

  const date = parseDateValue(value)

  if (!date) return ''

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), {
    dateStyle,
    timeStyle,
    hour12,
    timeZone,
  }).format(date)
}
type FormatSmartDateTimeOptions = LocalizedFormatOptions & {
  now?: Date
  hour12?: boolean
}
export function formatSmartDateTime(value: DateInput, options: FormatSmartDateTimeOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone, now = new Date(), hour12 = true } = options

  const date = parseDateValue(value)

  if (!date || Number.isNaN(now.getTime())) {
    return ''
  }

  const intlLocale = getIntlLocale(locale, useArabicDigits)

  const getCalendarParts = (dateValue: Date) => {
    const parts = new Intl.DateTimeFormat('en-CA', {
      year: 'numeric',
      month: 'numeric',
      day: 'numeric',
      timeZone,
    }).formatToParts(dateValue)

    const getPart = (type: Intl.DateTimeFormatPartTypes) => Number(parts.find((part) => part.type === type)?.value)

    return {
      year: getPart('year'),
      month: getPart('month'),
      day: getPart('day'),
    }
  }

  const targetParts = getCalendarParts(date)
  const nowParts = getCalendarParts(now)

  const targetCalendarTime = Date.UTC(targetParts.year, targetParts.month - 1, targetParts.day)

  const currentCalendarTime = Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day)

  const differenceInDays = Math.round((targetCalendarTime - currentCalendarTime) / MILLISECONDS_PER_DAY)

  const timeLabel = new Intl.DateTimeFormat(intlLocale, {
    hour: 'numeric',
    minute: '2-digit',
    hour12,
    timeZone,
  }).format(date)

  if (differenceInDays === 0 || differenceInDays === 1) {
    const relativeDayLabel = new Intl.RelativeTimeFormat(intlLocale, {
      numeric: 'auto',
    }).format(differenceInDays, 'day')

    return `${relativeDayLabel}, ${timeLabel}`
  }

  const dateLabel = new Intl.DateTimeFormat(intlLocale, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone,
  }).format(date)

  return `${dateLabel}, ${timeLabel}`
}
export function getTodayFormattedDate(date: Date = new Date(), options: LocalizedFormatOptions = {}): string {
  return formatDate(date, {
    ...options,
    dateStyle: 'long',
  })
}

export function formatRelativeTime(value: DateInput, options: RelativeTimeOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, now = new Date(), numeric = 'always', style = 'long' } = options

  const date = parseDateValue(value)

  if (!date || Number.isNaN(now.getTime())) {
    return ''
  }

  const differenceInSeconds = (date.getTime() - now.getTime()) / 1000

  const selectedUnit =
    RELATIVE_TIME_UNITS.find(({ seconds }) => Math.abs(differenceInSeconds) >= seconds) ??
    RELATIVE_TIME_UNITS[RELATIVE_TIME_UNITS.length - 1]

  const relativeValue = Math.round(differenceInSeconds / selectedUnit.seconds)

  return new Intl.RelativeTimeFormat(getIntlLocale(locale, useArabicDigits), {
    numeric,
    style,
  }).format(relativeValue, selectedUnit.unit)
}

/* =========================================================
    Date calculations
  ========================================================= */

export function getTodayDate(): Date {
  const today = new Date()

  today.setHours(0, 0, 0, 0)

  return today
}

/**
 * Compares local calendar days without dividing elapsed milliseconds. This
 * keeps labels such as "today" and "in 1 day" correct across DST changes.
 */
export function differenceInCalendarDays(value: DateInput, relativeTo: DateInput = new Date()): number | null {
  const date = parseDateValue(value)
  const relativeDate = parseDateValue(relativeTo)

  if (!date || !relativeDate) return null

  const calendarValue = Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
  const relativeCalendarValue = Date.UTC(relativeDate.getFullYear(), relativeDate.getMonth(), relativeDate.getDate())

  return Math.round((calendarValue - relativeCalendarValue) / MILLISECONDS_PER_DAY)
}

export function isToday(value: DateInput, now: DateInput = new Date()): boolean {
  return differenceInCalendarDays(value, now) === 0
}

export function addMinutes(value: DateInput, minutes: number): Date | null {
  const date = parseDateValue(value)

  if (!date || !Number.isFinite(minutes)) return null

  return new Date(date.getTime() + minutes * 60 * 1000)
}

/**
 * Calculates the number of remaining 24-hour days
 * until the provided date.
 *
 * Partial future days are rounded up:
 *
 * - 2 hours remaining => 1 day
 * - 25 hours remaining => 2 days
 *
 * Expired dates return 0 by default.
 */
export function getDaysLeft(value: DateInput, options: GetDaysLeftOptions = {}): number | null {
  const { now = new Date(), clampAtZero = true } = options

  const targetDate = parseDateValue(value)

  if (!targetDate || Number.isNaN(now.getTime())) {
    return null
  }

  const differenceInMilliseconds = targetDate.getTime() - now.getTime()

  if (clampAtZero && differenceInMilliseconds <= 0) {
    return 0
  }

  const differenceInDays = differenceInMilliseconds / MILLISECONDS_PER_DAY

  /**
   * Future partial days round up.
   * Past partial days round down to preserve
   * their negative overdue value.
   */
  return differenceInDays >= 0 ? Math.ceil(differenceInDays) : Math.floor(differenceInDays)
}
type FormatDayMonthOptions = LocalizedFormatOptions

/**
 * Formats a date as day/month.
 *
 * Examples:
 * - English: 28/10
 * - Arabic with Latin digits: 28/10
 * - Arabic with Arabic digits: ٢٨/١٠
 */
export function formatDayMonth(value: DateInput, options: FormatDayMonthOptions = {}): string {
  const { locale = 'en', useArabicDigits = true, timeZone } = options

  const date = parseDateValue(value)

  if (!date) return ''

  return new Intl.DateTimeFormat(getIntlLocale(locale, useArabicDigits), {
    day: '2-digit',
    month: '2-digit',
    timeZone,
  }).format(date)
}

export function formatDuration(durationInMinutes: number, locale = 'en'): string {
  if (!Number.isFinite(durationInMinutes) || durationInMinutes < 0) {
    return '-'
  }

  const totalMinutes = Math.round(durationInMinutes)
  const hours = Math.floor(totalMinutes / 60)
  const minutes = totalMinutes % 60

  const isArabic = locale.toLowerCase().startsWith('ar')

  const formatNumber = (value: number) =>
    new Intl.NumberFormat(isArabic ? 'ar-EG' : 'en-US', {
      useGrouping: false,
    }).format(value)

  const hourLabel = isArabic ? 'س' : 'h'
  const minuteLabel = isArabic ? 'د' : 'm'

  // Less than 1 hour
  if (hours === 0) {
    return `${formatNumber(minutes)}${minuteLabel}`
  }

  // Exact hour: 60, 120, 180...
  if (minutes === 0) {
    return `${formatNumber(hours)}${hourLabel}`
  }

  // Example: 90 => 1.30h
  const paddedMinutes = minutes.toString().padStart(2, '0')

  const localizedMinutes = isArabic
    ? new Intl.NumberFormat('ar-EG', {
        minimumIntegerDigits: 2,
        useGrouping: false,
      }).format(minutes)
    : paddedMinutes

  return `${formatNumber(hours)}.${localizedMinutes}${hourLabel}`
}
export function formatTimestampDate(timestamp: number): string {
  const date = parseDateValue(timestamp)

  if (!date) return ''

  return `${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`
}
