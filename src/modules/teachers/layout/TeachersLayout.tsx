import { Suspense } from 'react'
import { Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

import { TransparentFallback } from '@/components/shared/TransparentFallback'
import DashboardChrome from '@/modules/teachers/layout/components/DashboardChrome'
import {
  TeacherSessionMeetingHost,
  TeacherSessionMeetingProvider,
} from '@/modules/teachers/Teacher/session/persistent/TeacherSessionMeetingProvider'
import {
  AssistantExamMeetingHost,
  AssistantExamMeetingProvider,
} from '@/modules/teachers/Assistant-Admin/exams/persistent/AssistantExamMeetingProvider'

function TeachersLayout() {
  const { t } = useTranslation()

  return (
    <TeacherSessionMeetingProvider>
      <AssistantExamMeetingProvider>
        <div className="grid min-h-dvh grid-cols-1 grid-rows-[90px_1fr] bg-[#F6F8FB] text-content-primary lg:grid-cols-[210px_minmax(0,1fr)]">
          <a
            href="#teacher-dashboard-content"
            className="sr-only z-50 rounded-md bg-white px-4 py-2 text-sm font-semibold text-brand-700 shadow focus:not-sr-only focus:fixed focus:left-4 focus:top-4"
          >
            {t('teachers_layout.skip_to_content')}
          </a>

          <DashboardChrome />

          <main
            id="teacher-dashboard-content"
            className="min-w-0 bg-[#F6F8FB] px-4 py-6 sm:px-6 lg:col-start-2 lg:row-start-2"
          >
            <TeacherSessionMeetingHost />
            <AssistantExamMeetingHost />
            <Suspense fallback={<TransparentFallback />}>
              <Outlet />
            </Suspense>
          </main>
        </div>
      </AssistantExamMeetingProvider>
    </TeacherSessionMeetingProvider>
  )
}

export default TeachersLayout
