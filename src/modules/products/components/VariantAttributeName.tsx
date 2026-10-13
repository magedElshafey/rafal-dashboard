import { Check } from 'lucide-react'
import { useId, useState } from 'react'
import { useFormContext } from 'react-hook-form'
import { useTranslation } from 'react-i18next'

import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'

const ATTRIBUTE_KEYS = [
  'color',
  'size',
  'length',
  'width',
  'height',
  'material',
  'weight',
  'diameter',
  'capacity',
  'style',
  'shape',
  'finish',
  'plating',
  'stone_type',
  'flower_color',
  'flower_count',
  'packaging_type',
  'occasion',
  'scent',
  'model',
] as const

export function VariantAttributeName({ name, disabled }: { name: string; disabled?: boolean }) {
  const { control } = useFormContext()
  const { t, i18n } = useTranslation()
  const listId = useId()
  const [open, setOpen] = useState(false)
  const [activeIndex, setActiveIndex] = useState(-1)

  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => {
        const value: string = field.value ?? ''
        const search = value.trim().toLocaleLowerCase()
        const options = ATTRIBUTE_KEYS.filter((key) =>
          [
            key,
            t(`products.variants.attributeNames.${key}`, { lng: 'ar' }),
            t(`products.variants.attributeNames.${key}`, { lng: 'en' }),
          ].some((label) => label.toLocaleLowerCase().includes(search))
        ).map((key) => ({ key: String(key), label: t(`products.variants.attributeNames.${key}`) }))
        if (value.trim() && !options.some((option) => option.key === value)) {
          options.push({ key: value, label: t('products.variants.useCustomAttribute', { key: value }) })
        }
        const expanded = open && !disabled && options.length > 0
        const select = (key: string) => {
          field.onChange(key)
          setOpen(false)
          setActiveIndex(-1)
        }
        return (
          <FormItem className="relative min-w-0" dir={i18n.dir()}>
            <FormLabel>{t('products.variants.fields.attributeKey')}</FormLabel>
            <FormControl>
              <Input
                {...field}
                value={value}
                disabled={disabled}
                role="combobox"
                autoComplete="off"
                aria-autocomplete="list"
                aria-expanded={expanded}
                aria-controls={expanded ? listId : undefined}
                aria-activedescendant={expanded && options[activeIndex] ? `${listId}-${activeIndex}` : undefined}
                onFocus={() => setOpen(true)}
                onBlur={() => {
                  field.onBlur()
                  setOpen(false)
                  setActiveIndex(-1)
                }}
                onChange={(event) => {
                  field.onChange(event.target.value)
                  setOpen(true)
                  setActiveIndex(-1)
                }}
                onKeyDown={(event) => {
                  if (event.nativeEvent.isComposing) return
                  if ((event.key === 'ArrowDown' || event.key === 'ArrowUp') && options.length) {
                    event.preventDefault()
                    setOpen(true)
                    const next =
                      event.key === 'ArrowDown'
                        ? (activeIndex + 1) % options.length
                        : (activeIndex <= 0 ? options.length : activeIndex) - 1
                    setActiveIndex(next)
                    document.getElementById(`${listId}-${next}`)?.scrollIntoView({ block: 'nearest' })
                  } else if (event.key === 'Enter' && expanded) {
                    event.preventDefault()
                    select(options[activeIndex]?.key ?? value)
                  } else if (event.key === 'Escape' && open) {
                    event.preventDefault()
                    event.stopPropagation()
                    setOpen(false)
                    setActiveIndex(-1)
                  }
                }}
              />
            </FormControl>
            {expanded && (
              <ul
                id={listId}
                role="listbox"
                aria-label={t('products.variants.fields.attributeKey')}
                className="absolute inset-x-0 top-full z-50 mt-1 max-h-60 overflow-auto rounded-xl border bg-popover p-1 text-popover-foreground shadow-md"
              >
                {options.map((option, index) => (
                  <li
                    key={option.key}
                    id={`${listId}-${index}`}
                    role="option"
                    aria-selected={value === option.key}
                    className={`flex cursor-pointer items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm transition-colors motion-reduce:transition-none hover:bg-accent ${index === activeIndex ? 'bg-accent' : ''}`}
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => select(option.key)}
                  >
                    <span>{option.label}</span>
                    {value === option.key && <Check aria-hidden="true" className="size-4 shrink-0" />}
                  </li>
                ))}
              </ul>
            )}
            <FormMessage />
          </FormItem>
        )
      }}
    />
  )
}
