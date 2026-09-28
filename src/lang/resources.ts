import * as ar from '@/lang/ar.json'
import * as en from '@/lang/en.json'
import * as authAr from '@/modules/auth/locale/ar.json'
import * as authEn from '@/modules/auth/locale/en.json'
import * as dashboardAr from '@/modules/dashboard/locale/ar.json'
import * as dashboardEn from '@/modules/dashboard/locale/en.json'
import * as queryStateAr from '@/components/shared/query-state/locale/ar.json'
import * as queryStateEn from '@/components/shared/query-state/locale/en.json'
import * as rolesAr from '@/modules/roles/locale/ar.json'
import * as rolesEn from '@/modules/roles/locale/en.json'
import * as adminsAr from '@/modules/admins/locale/ar.json'
import * as adminsEn from '@/modules/admins/locale/en.json'
import * as formAr from '@/components/form/locale/ar.json'
import * as formEn from '@/components/form/locale/en.json'
import * as bannersAr from '@/modules/banners/locale/ar.json'
import * as bannersEn from '@/modules/banners/locale/en.json'
import * as categoriesAr from '@/modules/categories/locale/ar.json'
import * as categoriesEn from '@/modules/categories/locale/en.json'
import * as warehousesAr from '@/modules/warehouses/locale/ar.json'
import * as warehousesEn from '@/modules/warehouses/locale/en.json'
import * as regionsAr from '@/modules/regions/locale/ar.json'
import * as regionsEn from '@/modules/regions/locale/en.json'
import * as citiesAr from '@/modules/cities/locale/ar.json'
import * as citiesEn from '@/modules/cities/locale/en.json'
import * as settingsAr from '@/modules/settings/locale/ar.json'
import * as settingsEn from '@/modules/settings/locale/en.json'
import * as shippingMethodsAr from '@/modules/shipping-methods/locale/ar.json'
import * as shippingMethodsEn from '@/modules/shipping-methods/locale/en.json'
import * as productsAr from '@/modules/products/locale/ar.json'
import * as productsEn from '@/modules/products/locale/en.json'
import * as couponsAr from '@/modules/coupons/locale/ar.json'
import * as couponsEn from '@/modules/coupons/locale/en.json'
import * as aboutUsAr from '@/modules/about-us/locale/ar.json'
import * as aboutUsEn from '@/modules/about-us/locale/en.json'
import * as customersAr from '@/modules/customers/locale/ar.json'
import * as customersEn from '@/modules/customers/locale/en.json'
import * as reviewsAr from '@/modules/reviews/locale/ar.json'
import * as reviewsEn from '@/modules/reviews/locale/en.json'
import * as staticPagesAr from '@/modules/static-pages/locale/ar.json'
import * as staticPagesEn from '@/modules/static-pages/locale/en.json'

export const resources = {
  en: {
    translation: {
      ...en,
      ...formEn,
      ...authEn,
      ...dashboardEn,
      ...queryStateEn,
      ...rolesEn,
      ...adminsEn,
      ...bannersEn,
      ...categoriesEn,
      ...warehousesEn,
      ...regionsEn,
      ...citiesEn,
      ...settingsEn,
      ...shippingMethodsEn,
      ...productsEn,
      ...couponsEn,
      ...aboutUsEn,
      ...customersEn,
      ...reviewsEn,
      ...staticPagesEn,
    },
  },
  ar: {
    translation: {
      ...ar,
      ...formAr,
      ...authAr,
      ...dashboardAr,
      ...queryStateAr,
      ...rolesAr,
      ...adminsAr,
      ...bannersAr,
      ...categoriesAr,
      ...warehousesAr,
      ...regionsAr,
      ...citiesAr,
      ...settingsAr,
      ...shippingMethodsAr,
      ...productsAr,
      ...couponsAr,
      ...aboutUsAr,
      ...customersAr,
      ...reviewsAr,
      ...staticPagesAr,
    },
  },
} as const
