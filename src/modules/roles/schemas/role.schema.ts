import * as yup from 'yup'

type RoleValidationMessages = {
  nameRequired: string
  permissionsRequired: string
}

export function createRoleSchema(messages: RoleValidationMessages) {
  return yup.object({
    name: yup.string().trim().required(messages.nameRequired),
    permissions: yup.array(yup.string().required()).min(1, messages.permissionsRequired).defined(),
  })
}
