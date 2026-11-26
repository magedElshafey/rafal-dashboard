# Affiliate Laravel integration

The module uses shared staff HTTP, TanStack Query, existing components and EN/AR resources. All release/settings/financial gates remain closed. Role names and the assignable permissions catalog are never treated as effective grants.

The current completion status, assumptions and exact manual smoke checklist are in docs/affiliate-integration-audit/12_IMPLEMENTATION_STATUS.md, 11_CONSOLIDATED_BACKEND_MISSINGS.md and 07_BACKEND_HANDOFF.md. These active sections supersede older blocker recommendations.

Nullable full settings PUT, name-based code generation, financial detail/history preparation, application workflows, payout forms with read-back enforcement, optional order attribution and exact permission checks are implemented locally. Unknown financial data renders unavailable; no balances are invented. The authoritative permissions source is the sole confirmed Backend dependency. The in-memory session setter deliberately has no production hydration caller until that source is verified. No browser-persisted grants are trusted.

All deployed response assumptions still require authorized smoke tests. No live API requests or financial mutations were made in this task. No mock fallback exists in production paths. Shared Button.permissionName is unchanged.
