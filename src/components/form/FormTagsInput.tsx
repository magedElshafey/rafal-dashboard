import { useId, useState, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'
import { useFormContext } from 'react-hook-form'

import { Badge } from '@/components/ui/badge'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

type FormTagsInputProps = {
  name: string
  label?: string
  placeholder?: string
  addLabel?: string
  removeLabel: (value: string) => string
  maxItems?: number
  maxLengthPerItem?: number
  disabled?: boolean
  required?: boolean
  className?: string
}

export function FormTagsInput({
  name,
  label,
  placeholder,
  addLabel,
  removeLabel,
  maxItems,
  maxLengthPerItem,
  disabled = false,
  required = false,
  className,
}: FormTagsInputProps) {
  const { control } = useFormContext()
  const [draft, setDraft] = useState('')
  const inputId = useId()

  return (
    <FormField
      control={control}
      name={name}
      render={({ field, fieldState }) => {
        const values: string[] = Array.isArray(field.value) ? field.value : []
        const atLimit = maxItems !== undefined && values.length >= maxItems

        const commit = () => {
          const value = draft.trim()
          if (!value || disabled || atLimit) return
          if (values.includes(value)) {
            setDraft('')
            return
          }
          field.onChange([...values, value])
          setDraft('')
        }

        const handleKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
          if (event.key === 'Enter' || event.key === ',') {
            event.preventDefault()
            commit()
          } else if (event.key === 'Backspace' && !draft && values.length > 0) {
            field.onChange(values.slice(0, -1))
          }
        }

        return (
          <FormItem className={className}>
            {label ? (
              <FormLabel htmlFor={inputId}>
                {label}
                {required ? (
                  <span aria-hidden="true" className="ms-1 text-destructive">
                    *
                  </span>
                ) : null}
              </FormLabel>
            ) : null}
            <div
              className={cn(
                'max-h-40 min-h-11 overflow-y-auto rounded-lg border border-input bg-background p-2 shadow-xs transition-colors',
                'focus-within:border-ring focus-within:ring-[3px] focus-within:ring-ring/50',
                fieldState.error && 'border-destructive focus-within:ring-destructive/20',
                disabled && 'cursor-not-allowed opacity-50'
              )}
            >
              <div className="flex min-w-0 flex-wrap items-center gap-1.5">
                {values.map((value) => (
                  <Badge key={value} variant="secondary" className="max-w-full gap-1 pe-1" dir="auto">
                    <bdi className="min-w-0 break-all font-normal">{value}</bdi>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-label={removeLabel(value)}
                      onClick={() => field.onChange(values.filter((item) => item !== value))}
                      className="rounded-sm p-0.5 outline-none hover:bg-foreground/10 focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <X aria-hidden="true" className="size-3" />
                    </button>
                  </Badge>
                ))}
                <FormControl>
                  <Input
                    id={inputId}
                    value={draft}
                    disabled={disabled || atLimit}
                    maxLength={maxLengthPerItem}
                    placeholder={values.length === 0 ? placeholder : undefined}
                    aria-label={addLabel}
                    aria-invalid={Boolean(fieldState.error)}
                    onBlur={() => {
                      commit()
                      field.onBlur()
                    }}
                    onChange={(event) => setDraft(event.target.value)}
                    onKeyDown={handleKeyDown}
                    className="h-7 min-w-36 flex-1 border-0 bg-transparent px-1 shadow-none focus-visible:ring-0"
                    dir="auto"
                  />
                </FormControl>
              </div>
            </div>
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
