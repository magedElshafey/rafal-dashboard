import type { AppRole } from '@/modules/auth/types/auth.types'

export type WithRole<TData, TRole extends AppRole> = TData & {
  role: TRole
}

export function withRole<TData, TRole extends AppRole>(data: TData, role: TRole): WithRole<TData, TRole> {
  return {
    ...data,
    role,
  }
}
