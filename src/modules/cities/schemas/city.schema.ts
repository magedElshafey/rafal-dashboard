import * as yup from 'yup'

import type { CityFormValues } from '@/modules/cities/types/city.types'

type Messages = {
  regionRequired: string
  nameArRequired: string
  nameEnRequired: string
  sortInteger: string
  coordinateNumber: string
  latitudeRange: string
  longitudeRange: string
  centerRequired: string
  boundaryRequired: string
  boundaryMinimum: string
}

export function createCitySchema(messages: Messages) {
  const coordinate = yup.object({
    lat: yup
      .number()
      .typeError(messages.coordinateNumber)
      .required(messages.coordinateNumber)
      .min(-90, messages.latitudeRange)
      .max(90, messages.latitudeRange),
    lng: yup
      .number()
      .typeError(messages.coordinateNumber)
      .required(messages.coordinateNumber)
      .min(-180, messages.longitudeRange)
      .max(180, messages.longitudeRange),
  })

  return yup.object<CityFormValues>({
    regionId: yup.number().nullable().required(messages.regionRequired).integer(messages.regionRequired),
    name: yup.object({
      ar: yup.string().trim().required(messages.nameArRequired),
      en: yup.string().trim().required(messages.nameEnRequired),
    }),
    isActive: yup.boolean().defined(),
    sortOrder: yup
      .number()
      .transform((value, originalValue) => (originalValue === '' || originalValue === null ? null : value))
      .nullable()
      .defined()
      .integer(messages.sortInteger),
    boundary: yup
      .array()
      .of(coordinate)
      .required(messages.boundaryRequired)
      .test('boundary-required', messages.boundaryRequired, (value) => value.length > 0)
      .min(3, messages.boundaryMinimum)
      .defined(),
    center: coordinate.nullable().required(messages.centerRequired).defined(),
  })
}
