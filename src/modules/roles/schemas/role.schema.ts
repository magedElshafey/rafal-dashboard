import * as yup from 'yup'

export function createRoleSchema(requiredMessage: string) {
  return yup.object({
    name: yup.string().trim().required(requiredMessage),
    permissions: yup.array(yup.string().required()).defined(),
  })
}
