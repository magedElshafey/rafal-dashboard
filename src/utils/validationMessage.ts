import { TFunction } from 'i18next'

export const validationMessage = (
  t: TFunction,
  key: string,
  validationKey: string,
  options?: Record<string, unknown>
) => t(`${validationKey}.${key}`, options)
