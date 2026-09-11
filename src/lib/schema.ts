import { array, ArraySchema, mixed, number, NumberSchema, object, ObjectShape } from 'yup'

export const objectTransform = (objectShape?: ObjectShape | undefined) => {
  return object(objectShape).transform((_, value) => (value ? value : null))
}

export const numberTransform = (): NumberSchema<number | undefined> => {
  return number().transform((_, value) => {
    const parsed = typeof value === 'string' ? parseFloat(value) : value
    return typeof parsed === 'number' && !isNaN(parsed) ? parsed : null
  })
}

export const filesTransform = (): ArraySchema<File[], object> => {
  return array()
    .of(mixed<File>().test('file', 'Invalid file', (file) => file instanceof File))
    .transform((_, value) => {
      if (!value || !Array.isArray(value) || value.length === 0) {
        return null
      }
      return value
    }) as unknown as ArraySchema<File[], object>
}
