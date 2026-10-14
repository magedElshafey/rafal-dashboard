import type { PermissionGroup } from '@/modules/roles/types/permission.types'

// Synthetic scale fixture, not a copy of the unavailable full production catalog.
export function syntheticPermissionCatalog(): PermissionGroup[] {
  let id = 1000
  return Array.from({ length: 19 }, (_, index) => {
    const group = `synthetic-${index}`
    return {
      group,
      label: { en: `Group ${index}`, ar: `مجموعة ${index}` },
      permissions: Array.from({ length: index < 8 ? 4 : 3 }, (_, operation) => ({
        id: ++id,
        name: `${group}.operation-${operation}`,
        group,
        label: { en: `Action ${index}.${operation}`, ar: `إجراء ${index}.${operation}` },
      })),
    }
  })
}

export function granularPermissionCatalog(): PermissionGroup[] {
  return [
    {
      group: 'products',
      label: { en: 'Products', ar: 'المنتجات' },
      permissions: [
        { id: 201, name: 'products.view', group: 'products', label: { en: 'View products', ar: 'عرض المنتجات' } },
        {
          id: 202,
          name: 'products.manage-stock',
          group: 'products',
          label: { en: 'Manage stock', ar: 'إدارة المخزون' },
        },
      ],
    },
    {
      group: 'returns',
      label: { en: 'Returns', ar: 'المرتجعات' },
      permissions: [
        { id: 301, name: 'returns.approve', group: 'returns', label: { en: 'Approve returns', ar: 'قبول المرتجعات' } },
        { id: 302, name: 'returns.reject', group: 'returns', label: { en: 'Reject returns', ar: 'رفض المرتجعات' } },
      ],
    },
    {
      group: 'warehouse-staff',
      label: { en: 'Warehouse staff', ar: 'موظفو المستودع' },
      permissions: [
        {
          id: 401,
          name: 'warehouse-staff.assign',
          group: 'warehouse-staff',
          label: { en: 'Assign staff', ar: 'إسناد الموظفين' },
        },
      ],
    },
  ]
}
