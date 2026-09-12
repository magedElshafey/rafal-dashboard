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
    },
  },
} as const
