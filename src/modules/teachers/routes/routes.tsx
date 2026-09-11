import { RoleOnly } from '@/modules/auth/guards/RoleOnly'
import { lazy } from 'react'
import type { RouteObject } from 'react-router'
import { Navigate } from 'react-router-dom'
import { useAuth } from '@/store/auth'

const NotificationDetailsPage = lazy(() => import('@/components/shared/notification-center/NotificationDetailsPage'))

const TeachersLayout = lazy(() => import('@/modules/teachers/layout/TeachersLayout'))
// shared
const TeachersHomePage = lazy(() => import('@/modules/teachers/shared/home/page/TeacherHomePage'))
const SettingsPage = lazy(() => import('@/modules/shared/settings/pages/SettingsPage'))
const TeacherNotificationsPage = lazy(
  () => import('@/modules/teachers/shared/notifications/page/TeacherNotificationsPage')
)
const AssignmentsPage = lazy(() => import('@/modules/teachers/shared/assignments/page/TeachersAssignmentsPage'))
const AssignmentDetailsPage = lazy(
  () => import('@/modules/teachers/shared/assignments/page/TeacherAssignmentDetailsPage')
)
const AdminAssignmentAnalysisRoute = lazy(
  () => import('@/modules/teachers/shared/assignments/page/AdminAssignmentAnalysisRoute')
)
const AttendanceListPage = lazy(() => import('@/modules/teachers/shared/attendance/pages/list/AttendanceListPage'))
const AttendanceDetailsPage = lazy(
  () => import('@/modules/teachers/shared/attendance/pages/details/AttendanceDetailsPage')
)
const AttendanceMarkingPage = lazy(
  () => import('@/modules/teachers/shared/attendance/pages/marking/AttendanceMarkingPage')
)
const AttendanceSessionFormPage = lazy(
  () => import('@/modules/teachers/shared/attendance/pages/session-form/AttendanceSessionFormPage')
)
const ReportsTeacherPage = lazy(() => import('@/modules/teachers/Teacher/reports/page/ReportsPage'))
const TeacherReportDetailsPage = lazy(() => import('@/modules/teachers/Teacher/reports/page/TeacherReportDetailsPage'))
// Teacher + Admin

const GroupsPage = lazy(() => import('@/modules/teachers/Teacher-Admin/groups/page/GroupsPage'))
const AdminGroupDetailsPage = lazy(() => import('@/modules/teachers/Teacher-Admin/groups/page/AdminGroupDetailsPage'))
const AdminSubgroupDetailsPage = lazy(
  () => import('@/modules/teachers/Teacher-Admin/groups/page/AdminSubgroupDetailsPage')
)
const TeacherGroupDetailsPage = lazy(
  () => import('@/modules/teachers/Teacher-Admin/groups/page/TeacherGroupDetailsPage')
)
const TeacherPerformanceReportPage = lazy(
  () => import('@/modules/teachers/Teacher-Admin/groups/page/TeacherPerformanceReportPage')
)
const AssistantGroupStudentsPage = lazy(
  () => import('@/modules/teachers/Teacher-Admin/groups/page/AssistantGroupStudentsPage')
)
const AssistantGroupStudentDetailsPage = lazy(
  () => import('@/modules/teachers/Teacher-Admin/groups/page/AssistantGroupStudentDetailsPage')
)

const GroupDetailsPage = () => {
  const role = useAuth((state) => state.role)

  if (role === 'admin') return <AdminGroupDetailsPage />
  if (role === 'teacher') return <TeacherGroupDetailsPage />

  return null
}
// Assistant + Admin
const AnnouncementPage = lazy(() => import('@/modules/teachers/Assistant-Admin/announcement/page/AnnouncementPage'))
const AnnouncementsDetailsPage = lazy(
  () => import('@/modules/teachers/shared/announcements/pages/AnnouncementsDetailsPage')
)
const MessagesCenterPage = lazy(() => import('@/modules/teachers/shared/announcements/pages/MessagesCenterPage'))
const MessageDetailsPage = lazy(() => import('@/modules/teachers/shared/announcements/pages/MessageDetailsPage'))
const TeachersExamPage = lazy(() => import('@/modules/teachers/Assistant-Admin/exams/page/TeacherExamPage'))
const TeacherExamDetailsPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/exams/page/TeacherExamDetailsPage')
)
const AdminExamAnalysisPage = lazy(() => import('@/modules/teachers/Assistant-Admin/exams/page/AdminExamAnalysisPage'))
const AssistantExamMeetingPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/exams/page/AssistantExamMeetingPage')
)
const TeacherAddExamPage = lazy(() => import('@/modules/teachers/Assistant-Admin/exams/page/TeacherAddExamPage'))
const DeliveryHistoryPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/delivery-history/DeliveryHistoryPage')
)
const PerformanceReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/performance-report/PerformanceReportPage')
)
const PerivousReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/previous-report/PreviousReportPage')
)
const MonthlyReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/previous-report/MonthlyReportPage')
)
const ReportCenterPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/report-center/ReportCenterPage')
)
const ViewReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/report-center/ViewReportPage')
)
const DetailedReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/report-center/DetailedReportPage')
)
const RequiredReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/required-report/RequiredReport')
)
const RequiredReportViewPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/required-report/RequiredReportViewPage')
)
const CreateRequiredReportPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/required-report/CreateRequiredReportPage')
)
const AssistantAnalysisPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/reports/pages/assistant-analysis/AssistantAnalysisPage')
)

const ExtensionsRequestPage = lazy(
  () => import('@/modules/teachers/Assistant-Admin/extensions-request/page/ExtensionsRequestPage')
)
// Teacher only
const SessionPage = lazy(() => import('@/modules/teachers/Teacher/session/page/SessionPage'))
const PersistentLiveSessionRoute = lazy(
  () => import('@/modules/teachers/Teacher/session/page/PersistentLiveSessionRoute')
)
// Assistant only
const ChecklistPage = lazy(() => import('@/modules/teachers/Assistant/checklist/page/CheklistPage'))
const CreateChecklistPage = lazy(() => import('@/modules/teachers/Assistant/checklist/page/CreateChecklistPage'))
const ChecklistDetailsPage = lazy(() => import('@/modules/teachers/Assistant/checklist/page/CheckListDetailsPage'))
const ProfileEditRequestsPage = lazy(
  () => import('@/modules/teachers/Assistant/profile-edit-requests/page/ProfileEditRequestsPage')
)
const ProfileEditRequestDetailsPage = lazy(
  () => import('@/modules/teachers/Assistant/profile-edit-requests/page/ProfileEditRequestDetailsPage')
)
const AssistantScheduledSessionsPage = lazy(
  () => import('@/modules/teachers/Assistant/sessions/page/AssistantScheduledSessionsPage')
)
const AssistantProfilePage = lazy(() => import('@/modules/teachers/Assistant/profile/page/AssistantProfilePage'))
const AssistantEditProfilePage = lazy(
  () => import('@/modules/teachers/Assistant/profile/page/AssistantEditProfilePage')
)
const StaffPage = lazy(() => import('@/modules/teachers/Teacher/staff/pages/StaffPage'))
const StaffDetailsPage = lazy(() => import('@/modules/teachers/Teacher/staff/pages/StaffDetailsPage'))
// Admin only

const StudentsPage = lazy(() => import('@/modules/teachers/Teacher-Admin/students/page/StudentPage'))
const StudentDetailsPage = lazy(() => import('@/modules/teachers/Teacher-Admin/students/page/StudentDetailsPage'))
const ContentLibraryPage = lazy(() => import('@/modules/teachers/Admin/content-library/pages/ContentLibraryPage'))
const ContentLibraryFolderPage = lazy(
  () => import('@/modules/teachers/Admin/content-library/pages/ContentLibraryFolderPage')
)
const ContentLibraryDetailsPage = lazy(
  () => import('@/modules/teachers/Admin/content-library/pages/ContentLibraryDetailsPage')
)
const AssistantPage = lazy(() => import('@/modules/teachers/Admin/assistant/page/AssistantPage'))
const AssistantDetailsPage = lazy(() => import('@/modules/teachers/Admin/assistant/page/AssistantDetailsPage'))
const ChaptersPage = lazy(() => import('@/modules/teachers/Admin/chapters/page/ChaptersPage'))
const AllLessonPage = lazy(() => import('@/modules/teachers/Admin/lessons/pages/AllLessonsPage'))
const LessonDetailsPage = lazy(() => import('@/modules/teachers/Admin/lessons/pages/LessonDetailsPage'))
const EditLessonPage = lazy(() => import('@/modules/teachers/Admin/lessons/pages/EditLessonPage'))

const RegistrationPage = lazy(() => import('@/modules/teachers/Assistant-Admin/registration/page/RegistrationPage'))

const SessionsPage = lazy(() => import('@/modules/teachers/Admin/sessions/page/SessionsPage'))

const SessionsRoutePage = () => {
  const role = useAuth((state) => state.role)

  return role === 'assistant' ? <AssistantScheduledSessionsPage /> : <SessionsPage />
}

const ReportsPage = () => {
  const role = useAuth((state) => state.role)

  return role === 'admin' || role === 'assistant' ? <ReportCenterPage /> : <ReportsTeacherPage />
}

export const TeachersRoutes: RouteObject[] = [
  {
    element: <TeachersLayout />,
    children: [
      // shared
      {
        index: true,
        element: <Navigate to="home" replace />,
      },
      {
        path: 'home',
        Component: TeachersHomePage,
      },
      {
        path: 'notifications/:notificationId',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant', 'teacher']}>
            <NotificationDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'notifications',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant', 'teacher']}>
            <TeacherNotificationsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'settings',
        Component: SettingsPage,
      },
      {
        path: 'assignments',
        Component: AssignmentsPage,
      },
      {
        path: 'assignments/:assignmentId',
        Component: AssignmentDetailsPage,
      },
      {
        path: 'assignments/:assignmentId/analysis',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AdminAssignmentAnalysisRoute currentRoleLabel="admin" />
          </RoleOnly>
        ),
      },
      {
        path: 'attendance',
        Component: AttendanceListPage,
      },
      {
        path: 'attendance/create',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AttendanceSessionFormPage mode="create" />
          </RoleOnly>
        ),
      },
      {
        path: 'attendance/:sessionId',
        Component: AttendanceDetailsPage,
      },
      {
        path: 'attendance/:sessionId/edit',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AttendanceSessionFormPage mode="edit" />
          </RoleOnly>
        ),
      },
      {
        path: 'attendance/:sessionId/marking',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <AttendanceMarkingPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports',
        element: (
          <RoleOnly allowedRoles={['teacher', 'admin', 'assistant']}>
            <ReportsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports/:studentId',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <TeacherReportDetailsPage />
          </RoleOnly>
        ),
      },
      // Teacher + Admin

      {
        path: 'groups',
        element: (
          <RoleOnly allowedRoles={['teacher', 'admin', 'assistant']}>
            <GroupsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'groups/:groupId',
        element: (
          <RoleOnly allowedRoles={['teacher', 'admin']}>
            <GroupDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'groups/:groupId/students',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <AssistantGroupStudentsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'groups/:id/students/:studentId',
        element: (
          <RoleOnly allowedRoles={['assistant', 'admin']}>
            <AssistantGroupStudentDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'groups/:groupId/sub-groups/:subGroupId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AdminSubgroupDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'groups/:groupId/students/:studentId/performance-report',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <TeacherPerformanceReportPage />
          </RoleOnly>
        ),
      },

      // Assistant + Admin
      {
        path: 'announcement',
        element: (
          <RoleOnly allowedRoles={['teacher', 'assistant', 'admin']}>
            <AnnouncementPage />
          </RoleOnly>
        ),
      },
      {
        path: 'announcement/:announcementId',
        element: (
          <RoleOnly allowedRoles={['teacher', 'assistant', 'admin']}>
            <AnnouncementsDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'messages-center',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <MessagesCenterPage />
          </RoleOnly>
        ),
      },
      {
        path: 'messages-center/:messageId',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <MessageDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'exams',
        element: (
          <RoleOnly allowedRoles={['teacher', 'assistant', 'admin']}>
            <TeachersExamPage />
          </RoleOnly>
        ),
      },
      {
        path: 'exams/create',
        element: (
          <RoleOnly allowedRoles={['teacher', 'admin']}>
            <TeacherAddExamPage />
          </RoleOnly>
        ),
      },
      {
        path: 'exams/:examId',
        element: (
          <RoleOnly allowedRoles={['teacher', 'assistant', 'admin']}>
            <TeacherExamDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'exams/:examId/analysis',
        element: (
          <RoleOnly allowedRoles={['teacher', 'admin']}>
            <AdminExamAnalysisPage />
          </RoleOnly>
        ),
      },
      {
        path: 'live-meeting',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <AssistantExamMeetingPage />
          </RoleOnly>
        ),
      },
      {
        path: 'delivery-history',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <DeliveryHistoryPage />
          </RoleOnly>
        ),
      },
      {
        path: 'performance-report',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <PerformanceReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'previous-report',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <PerivousReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'previous-report/monthly',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <MonthlyReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports-center',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <ReportCenterPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports-center/view',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <ViewReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports-center/view/:reportId',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <ViewReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'reports-center/details',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <DetailedReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'required-report',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <RequiredReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'required-report/create',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <CreateRequiredReportPage />
          </RoleOnly>
        ),
      },
      {
        path: 'required-report/view/:requiredReportId',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <RequiredReportViewPage />
          </RoleOnly>
        ),
      },
      {
        path: 'assistant-analysis',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <AssistantAnalysisPage />
          </RoleOnly>
        ),
      },
      {
        path: 'registration',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <RegistrationPage />
          </RoleOnly>
        ),
      },
      {
        path: 'extensions-request',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <ExtensionsRequestPage />
          </RoleOnly>
        ),
      },
      {
        path: 'extensions-request/:requestId',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <ExtensionsRequestPage />
          </RoleOnly>
        ),
      },
      // Teacher only
      {
        path: 'session',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <SessionPage />
          </RoleOnly>
        ),
      },
      {
        path: 'session/:id/live',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <PersistentLiveSessionRoute />
          </RoleOnly>
        ),
      },
      {
        path: 'staff',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <StaffPage />
          </RoleOnly>
        ),
      },
      {
        path: 'staff/:staffId',
        element: (
          <RoleOnly allowedRoles={['teacher']}>
            <StaffDetailsPage />
          </RoleOnly>
        ),
      },
      // Assistant only
      {
        path: 'profile',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <AssistantProfilePage />
          </RoleOnly>
        ),
      },
      {
        path: 'profile/edit',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <AssistantEditProfilePage />
          </RoleOnly>
        ),
      },
      {
        path: 'profile-edit-requests',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <ProfileEditRequestsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'profile-edit-requests/:requestId',
        element: (
          <RoleOnly allowedRoles={['assistant']}>
            <ProfileEditRequestDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'checklist',
        element: (
          <RoleOnly allowedRoles={['assistant', 'admin']}>
            <ChecklistPage />
          </RoleOnly>
        ),
      },
      {
        path: 'checklist/create',
        element: (
          <RoleOnly allowedRoles={['assistant', 'admin']}>
            <CreateChecklistPage />
          </RoleOnly>
        ),
      },
      {
        path: 'checklist/:id',
        element: (
          <RoleOnly allowedRoles={['assistant', 'admin']}>
            <ChecklistDetailsPage />
          </RoleOnly>
        ),
      },
      // Admin only
      {
        path: 'content-library',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <ContentLibraryPage />
          </RoleOnly>
        ),
      },
      {
        path: 'content-library/:folderId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <ContentLibraryFolderPage />
          </RoleOnly>
        ),
      },
      {
        path: 'content-library/files/:libraryId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <ContentLibraryDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'assistants',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AssistantPage />
          </RoleOnly>
        ),
      },
      {
        path: 'assistants/:assistantId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AssistantDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'students',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <StudentsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'students/:studentId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <StudentDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'chapters',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <ChaptersPage />
          </RoleOnly>
        ),
      },
      {
        path: 'chapters/:chapterId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <AllLessonPage />
          </RoleOnly>
        ),
      },
      {
        path: 'chapters/:chapterId/lesson/:lessonId',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <LessonDetailsPage />
          </RoleOnly>
        ),
      },
      {
        path: 'chapters/:chapterId/lesson/:lessonId/edit',
        element: (
          <RoleOnly allowedRoles={['admin']}>
            <EditLessonPage />
          </RoleOnly>
        ),
      },
      {
        path: 'sessions',
        element: (
          <RoleOnly allowedRoles={['admin', 'assistant']}>
            <SessionsRoutePage />
          </RoleOnly>
        ),
      },
    ],
  },
]
