export type AppRole = string

export interface IUserCountry {
  id: string
  name: string
  iso2: string
  phone_code: string
}

export interface IUser {
  id: string
  name: string
  email?: string | null
  phone: string | null
  role?: AppRole | null
  type?: AppRole | null
  country?: IUserCountry | null
  country_code?: string | null
  image?: string | null
}

export type LoginPayload = {
  phone: string
  password: string
  rememberMe?: boolean
  countryCode: string
}

export type LoginResponseData = {
  token: string
  user: IUser
}

export type AuthSession = {
  token: string
  role: AppRole | null
  user: IUser
}
