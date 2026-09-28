import type { PaginatedDashboardResponse } from '@/types/dashboard-api.types'

export type CustomerListItem = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  status: string
  isBlocked: boolean
  blockedAt: string | null
  blockedReason: string | null
  ordersCount: number
  lifetimeSpend: number
  createdAt: string
  updatedAt: string
}

export type CustomerDetail = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  firstName: string | null
  lastName: string | null
  termsAcceptedAt: string | null
  marketingOptIn: boolean
  status: string
  isBlocked: boolean
  blockedAt: string | null
  blockedReason: string | null
  addressesCount: number
  createdAt: string
  updatedAt: string
}

export type CustomerOrderListItem = {
  id: number
  orderNumber: string
  displayNumber: string
  status: string
  itemsCount: number
  total: number
  currency: string
  paymentStatus: string
  isGift: boolean
  placedAt: string | null
}

export type RawCustomerListItem = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  status: string
  is_blocked: boolean | 0 | 1
  blocked_at: string | null
  blocked_reason: string | null
  orders_count: number
  lifetime_spend: number | string
  created_at: string
  updated_at: string
}

export type RawCustomerDetail = {
  id: number
  name: string | null
  email: string | null
  phone: string | null
  first_name: string | null
  last_name: string | null
  terms_accepted_at: string | null
  marketing_opt_in: boolean | 0 | 1
  status: string
  is_blocked: boolean | 0 | 1
  blocked_at: string | null
  blocked_reason: string | null
  addresses_count: number
  created_at: string
  updated_at: string
}

export type RawCustomerOrderListItem = {
  id: number
  order_number: string
  display_number: string
  status: string
  customer: {
    type: string
    name: string | null
    email: string | null
    phone: string | null
  }
  items_count: number
  total: number | string
  currency: string
  payment_status: string
  is_gift: boolean | 0 | 1
  placed_at: string | null
}

export type CustomersIndexResponse = PaginatedDashboardResponse<RawCustomerListItem>
export type CustomerOrdersIndexResponse = PaginatedDashboardResponse<RawCustomerOrderListItem>
export type CustomerDetailResponse = {
  success: boolean
  message: string
  data: RawCustomerDetail
}

export type CustomerAccessAction = 'block' | 'unblock'
