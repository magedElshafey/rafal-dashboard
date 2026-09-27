export interface AuthAdmin {
  id: number
  name: string
  email: string
  roles: string[]
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponseData = {
  admin: AuthAdmin
  token: string
  roles: string[]
}

export type AuthSession = {
  admin: AuthAdmin
  token: string
}
