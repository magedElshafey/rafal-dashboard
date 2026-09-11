import { ComponentProps, useEffect, useMemo, useRef, useState } from 'react'
import { Search } from 'lucide-react'
import { useTranslation } from 'react-i18next'

import { useQuery } from '@/store/queryContext/useQueryContext'
import { cn } from '@/lib/utils'

export interface ISearchFilterProps extends ComponentProps<'input'> {
  name: string
  label?: string
  placeholder?: string
  debounceMs?: number
  resetQueryNamesOnChange?: string[]
}

const SearchFilter = ({
  name,
  label,
  placeholder,
  className,
  debounceMs = 600,
  resetQueryNamesOnChange,
  onChange,
  ...props
}: ISearchFilterProps) => {
  const { forwardAddQuery, forwardDeleteQuery, forwardQuery } = useQuery()
  const { t } = useTranslation()

  const queryValue = forwardQuery?.[name] ?? ''

  const [value, setValue] = useState(queryValue)
  const didMountRef = useRef(false)
  const hasResetQueryNamesConfig = resetQueryNamesOnChange !== undefined
  const resetQueryNamesKey = resetQueryNamesOnChange?.join('\u0000') ?? ''
  const queryUpdateOptions = useMemo(
    () =>
      hasResetQueryNamesConfig
        ? { resetQueryNames: resetQueryNamesKey ? resetQueryNamesKey.split('\u0000') : [] }
        : undefined,
    [hasResetQueryNamesConfig, resetQueryNamesKey]
  )

  useEffect(() => {
    setValue(queryValue)
  }, [queryValue])

  useEffect(() => {
    if (!didMountRef.current) {
      didMountRef.current = true
      return
    }

    const timer = window.setTimeout(() => {
      const nextValue = value.trim()

      if (nextValue === queryValue) {
        return
      }

      if (!nextValue) {
        forwardDeleteQuery(name, queryUpdateOptions)
        return
      }

      forwardAddQuery({ [name]: nextValue }, queryUpdateOptions)
    }, debounceMs)

    return () => {
      window.clearTimeout(timer)
    }
  }, [value, queryValue, name, debounceMs, forwardAddQuery, forwardDeleteQuery, queryUpdateOptions])

  return (
    <label
      className={cn(
        'flex items-center gap-3 rounded-lg border border-black-50 bg-black-50 px-4 text-content-primary transition-all',
        'hover:border-black-100 focus-within:border-brand-500 focus-within:ring-3 focus-within:ring-brand-500/20',
        'has-[input[aria-invalid=true]]:border-error-500 has-[input[aria-invalid=true]]:ring-3 has-[input[aria-invalid=true]]:ring-error-500/20',
        'has-[input:disabled]:cursor-not-allowed has-[input:disabled]:border-black-100 has-[input:disabled]:bg-black-100',
        'has-[input:read-only]:border-black-100 has-[input:read-only]:bg-black-100',
        className
      )}
    >
      {label && <span className="sr-only">{label}</span>}

      <Search className="size-5 text-black-400" aria-hidden="true" />

      <input
        {...props}
        id={`${name}-id`}
        name={name}
        value={value}
        className="h-full min-h-12 w-full bg-transparent text-sm text-content-primary outline-none placeholder:text-black-400 disabled:cursor-not-allowed disabled:text-content-secondary read-only:cursor-default read-only:text-content-secondary"
        placeholder={placeholder || t('label.search')}
        onChange={(event) => {
          setValue(event.target.value)
          onChange?.(event)
        }}
      />
    </label>
  )
}

export default SearchFilter
