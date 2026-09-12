import type { ComponentProps } from 'react'

import { FormInput } from '@/components/form/FormInput'

type FormSortOrderProps = Omit<ComponentProps<typeof FormInput>, 'type' | 'inputMode'> & {
  min?: number
  max?: number
  step?: number
}

/** Reusable numeric ordering field. Domain schemas remain responsible for validation. */
export function FormSortOrder({ min, max, step = 1, ...props }: FormSortOrderProps) {
  return <FormInput {...props} type="number" inputMode="numeric" min={min} max={max} step={step} dir="ltr" />
}
