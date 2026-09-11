import * as ar from '@/lang/ar.json'
import * as en from '@/lang/en.json'

import * as authAr from '@/modules/auth/locale/ar.json'
import * as authEn from '@/modules/auth/locale/en.json'
import * as courseEn from '@/modules/users/student/course/locale/en.json'
import * as courseAr from '@/modules/users/student/course/locale/ar.json'
import * as assignmentsEn from '@/modules/users/assignments/locale/en.json'
import * as assignmentsAr from '@/modules/users/assignments/locale/ar.json'
import * as libraryEn from '@/modules/users/student/library/locale/en.json'
import * as libraryAr from '@/modules/users/student/library/locale/ar.json'
import * as studentSessionsEn from '@/modules/users/student/sessions/locale/en.json'
import * as studentSessionsAr from '@/modules/users/student/sessions/locale/ar.json'
import * as homeEn from '@/modules/users/home/locale/en.json'
import * as homeAr from '@/modules/users/home/locale/ar.json'
import * as tasksEn from '@/modules/users/tasks/locale/en.json'
import * as tasksAr from '@/modules/users/tasks/locale/ar.json'
import * as usersLayoutEn from '@/modules/users/layout/locale/en.json'
import * as usersLayoutAr from '@/modules/users/layout/locale/ar.json'
import * as examsEn from '@/modules/users/exams/locale/en.json'
import * as examsAr from '@/modules/users/exams/locale/ar.json'
import * as teachersLayoutEn from '@/modules/teachers/layout/locale/en.json'
import * as teachersLayoutAr from '@/modules/teachers/layout/locale/ar.json'

import * as profileEn from '@/modules/users/profile/locale/en.json'
import * as profileAr from '@/modules/users/profile/locale/ar.json'
import * as notificationsEn from '@/modules/users/notifications/locale/en.json'
import * as notificationsAr from '@/modules/users/notifications/locale/ar.json'
import * as helpAndSupportEn from '@/modules/users/helpAnsSupport/locale/en.json'
import * as helpAndSupportAr from '@/modules/users/helpAnsSupport/locale/ar.json'
import * as performanceReportEn from '@/modules/users/performance-report/locale/en.json'
import * as performanceReportAr from '@/modules/users/performance-report/locale/ar.json'
import * as todoListEn from '@/modules/users/toDoList/locale/en.json'
import * as todoListAr from '@/modules/users/toDoList/locale/ar.json'
import * as participantMeetingEn from '@/modules/users/shared/meeting/locale/en.json'
import * as participantMeetingAr from '@/modules/users/shared/meeting/locale/ar.json'
import * as pdfViewerEn from '@/modules/users/shared/pdf-viewer/locale/en.json'
import * as pdfViewerAr from '@/modules/users/shared/pdf-viewer/locale/ar.json'

import * as QueryStateEn from '@/components/shared/query-state/locale/en.json'
import * as QueryStateAr from '@/components/shared/query-state/locale/ar.json'
import * as settingsEn from '@/modules/shared/settings/locale/en.json'
import * as settingsAr from '@/modules/shared/settings/locale/ar.json'
export const resources = {
  en: {
    translation: {
      ...en,

      ...authEn,
      ...courseEn,
      ...assignmentsEn,
      ...libraryEn,
      ...studentSessionsEn,
      ...homeEn,
      ...tasksEn,
      ...usersLayoutEn,
      ...examsEn,
      ...teachersLayoutEn,

      ...profileEn,
      ...notificationsEn,
      ...helpAndSupportEn,
      ...performanceReportEn,
      ...todoListEn,
      ...participantMeetingEn,
      ...pdfViewerEn,

      ...QueryStateEn,
      ...settingsEn,
    },
  },
  ar: {
    translation: {
      ...ar,

      ...authAr,
      ...courseAr,
      ...assignmentsAr,
      ...libraryAr,
      ...studentSessionsAr,
      ...homeAr,
      ...tasksAr,
      ...usersLayoutAr,
      ...examsAr,
      ...teachersLayoutAr,

      ...profileAr,
      ...notificationsAr,
      ...helpAndSupportAr,
      ...performanceReportAr,
      ...todoListAr,
      ...participantMeetingAr,
      ...pdfViewerAr,

      ...QueryStateAr,
      ...settingsAr,
    },
  },
} as const
