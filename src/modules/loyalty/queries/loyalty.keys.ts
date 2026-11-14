import type { LoyaltyLedgerFilters } from '../types/loyalty.types'

export const loyaltyKeys = {
  all: ['loyalty'] as const,
  settings: () => [...loyaltyKeys.all, 'settings'] as const,
  histories: () => [...loyaltyKeys.all, 'settings-history'] as const,
  history: (perPage: number) => [...loyaltyKeys.histories(), { perPage }] as const,
  customers: () => [...loyaltyKeys.all, 'customers'] as const,
  customer: (customerId: number) => [...loyaltyKeys.customers(), customerId] as const,
  customerSummary: (customerId: number) => [...loyaltyKeys.customer(customerId), 'summary'] as const,
  customerLedgers: (customerId: number) => [...loyaltyKeys.customer(customerId), 'ledger'] as const,
  customerLedger: (customerId: number, filters: LoyaltyLedgerFilters) =>
    [...loyaltyKeys.customerLedgers(customerId), filters] as const,
}
