import * as yup from 'yup'

type AdminValidationMessages = {
  nameRequired: string
  emailRequired: string
  emailInvalid: string
  passwordRequired: string
  passwordConfirmationRequired: string
  passwordMismatch: string
}

export function createAdminSchema(mode: 'create' | 'edit', messages: AdminValidationMessages) {
  return yup.object({
    name: yup.string().trim().required(messages.nameRequired),
    email: yup.string().trim().email(messages.emailInvalid).required(messages.emailRequired),
    password: mode === 'create' ? yup.string().required(messages.passwordRequired) : yup.string().defined(),
    passwordConfirmation:
      mode === 'create'
        ? yup
            .string()
            .required(messages.passwordConfirmationRequired)
            .oneOf([yup.ref('password')], messages.passwordMismatch)
        : yup.string().defined(),
    roles: yup.array(yup.string().required()).defined(),
  })
}
