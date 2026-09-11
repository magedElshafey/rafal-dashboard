import type { ComponentType, SVGProps } from 'react'

import { TeacherRole } from '@/modules/auth/types/auth.types'
//icons
import DashboardGridIcon from '@/components/icons/DashboardGridIcon'
import DocumentsIcon from '@/components/icons/DocumentsIcon'
import ProfileReportIcon from '@/components/icons/ProfileReportIcon'
import StudentsIcon from '@/components/icons/StudentsIcon'
import UsersGroupIcon from '@/components/icons/UsersGroupIcon'
import chaptericon from '@/components/icons/chapterIcons'
import examIcon from '@/components/icons/examIcon'
import SessionsIcon from '@/components/icons/SessionsIcon'
import AttendanceCalendarIcon from '@/components/icons/AttendanceCalendarIcon'
import Registrationsicon from '@/components/icons/Registrationsicon'
import assistanceicon from '@/components/icons/assistanceicon'
import libraryicon from '@/components/icons/library'
import videiosession from '@/components/icons/VideoSessionIcon'

type SidebarIcon = ComponentType<SVGProps<SVGSVGElement>>

export type TSidebarItem = {
  labelKey: string
  path: string
  icon: SidebarIcon
  children?: {
    labelKey: string
    path: string
    icon?: SidebarIcon
  }[]
}
import { Bell, Clock } from 'lucide-react'
import MegaphoneIcon from '@/components/icons/MegaphoneIcon'
import ListCheckIcon from '@/components/icons/ListCheckIcon'
import UsersIcon from '@/components/icons/UsersIcon'
import StudentIcon from '@/components/icons/StudentIcon'

export const SIDEBAR_ITEMS_BY_ROLE: Record<TeacherRole, TSidebarItem[]> = {
  teacher: [
    {
      labelKey: 'teachers_layout.dashboard',
      path: '/home',
      icon: DashboardGridIcon,
    },
    {
      labelKey: 'teachers_layout.groups',
      path: '/groups',
      icon: UsersGroupIcon,
    },

    {
      labelKey: 'teachers_layout.assignments',
      path: '/assignments',
      icon: DocumentsIcon,
    },
    {
      labelKey: 'teachers_layout.exams',
      path: '/exams',
      icon: examIcon,
    },
    {
      labelKey: 'teachers_layout.attendance',
      path: '/attendance',
      icon: AttendanceCalendarIcon,
    },
    {
      labelKey: 'teachers_layout.session',
      path: '/session',
      icon: videiosession,
    },

    {
      labelKey: 'teachers_layout.reports',
      path: '/reports',
      icon: ProfileReportIcon,
    },
    {
      labelKey: 'teachers_layout.staff',
      path: '/staff',
      icon: UsersGroupIcon,
    },
    {
      labelKey: 'teachers_layout.announcement',
      path: '/announcement',
      icon: Bell,
    },
  ],
  assistant: [
    {
      labelKey: 'teachers_layout.dashboard',
      path: '/home',
      icon: DashboardGridIcon,
    },
    {
      labelKey: 'teachers_layout.groups',
      path: '/groups',
      icon: UsersGroupIcon,
    },
    {
      labelKey: 'teachers_layout.assignments',
      path: '/assignments',
      icon: DocumentsIcon,
    },
    {
      labelKey: 'teachers_layout.exams',
      path: '/exams',
      icon: examIcon,
    },
    {
      labelKey: 'teachers_layout.reports',
      path: '/reports',
      icon: ProfileReportIcon,
      children: [
        {
          labelKey: 'teachers_layout.report_center',
          path: '/reports-center',
        },
        {
          labelKey: 'teachers_layout.required_report',
          path: '/required-report',
        },
        // {
        //   labelKey: 'teachers_layout.previous_report',
        //   path: '/previous-report',
        // },
        // {
        //   labelKey: 'teachers_layout.performance_report',
        //   path: '/performance-report',
        // },
        // {
        //   labelKey: 'teachers_layout.assistant_analysis',
        //   path: '/assistant-analysis',
        // },
      ],
    },
    {
      labelKey: 'teachers_layout.checklist',
      path: '/checklist',
      icon: ListCheckIcon,
    },
    {
      labelKey: 'teachers_layout.attendance',
      path: '/attendance',
      icon: UsersIcon,
    },
    {
      labelKey: 'teachers_layout.sessions',
      path: '/sessions',
      icon: SessionsIcon,
    },

    {
      labelKey: 'teachers_layout.announcement',
      path: '/announcement',
      icon: MegaphoneIcon,
    },
    {
      labelKey: 'teachers_layout.extensions_request',
      path: '/extensions-request',
      icon: Registrationsicon,
    },
    {
      labelKey: 'teachers_layout.profile_edit_requests',
      path: '/profile-edit-requests',
      icon: ProfileReportIcon,
    },
    {
      labelKey: 'teachers_layout.students',
      path: '/registration',
      icon: StudentIcon,
    },
  ],
  admin: [
    {
      labelKey: 'teachers_layout.dashboard',
      path: '/home',
      icon: DashboardGridIcon,
    },
    {
      labelKey: 'teachers_layout.groups',
      path: '/groups',
      icon: UsersGroupIcon,
    },
    {
      labelKey: 'teachers_layout.students',
      path: '/students',
      icon: StudentsIcon,
    },
    {
      labelKey: 'teachers_layout.assistants',
      path: '/assistants',
      icon: assistanceicon,
    },
    {
      labelKey: 'teachers_layout.chapters',
      path: '/chapters',
      icon: chaptericon,
    },
    {
      labelKey: 'teachers_layout.assignments',
      path: '/assignments',
      icon: DocumentsIcon,
    },
    {
      labelKey: 'teachers_layout.exams',
      path: '/exams',
      icon: examIcon,
    },
    {
      labelKey: 'teachers_layout.content_library',
      path: '/content-library',
      icon: libraryicon,
    },
    {
      labelKey: 'teachers_layout.sessions',
      path: '/sessions',
      icon: SessionsIcon,
    },
    {
      labelKey: 'teachers_layout.attendance',
      path: '/attendance',
      icon: AttendanceCalendarIcon,
    },
    {
      labelKey: 'teachers_layout.checklist',
      path: '/checklist',
      icon: ListCheckIcon,
    },
    {
      labelKey: 'teachers_layout.reports',
      path: '/reports',
      icon: ProfileReportIcon,
      children: [
        {
          labelKey: 'teachers_layout.report_center',
          path: '/reports-center',
        },
        {
          labelKey: 'teachers_layout.required_report',
          path: '/required-report',
        },
        // {
        //   labelKey: 'teachers_layout.previous_report',
        //   path: '/previous-report',
        // },
        // {
        //   labelKey: 'teachers_layout.delivery_history',
        //   path: '/delivery-history',
        // },
        // {
        //   labelKey: 'teachers_layout.performance_report',
        //   path: '/performance-report',
        // },
        // {
        //   labelKey: 'teachers_layout.assistant_analysis',
        //   path: '/assistant-analysis',
        // },
      ],
    },
    {
      labelKey: 'teachers_layout.announcement',
      path: '/announcement',
      icon: Bell,
    },
    {
      labelKey: 'teachers_layout.registration',
      path: '/registration',
      icon: Registrationsicon,
    },
    {
      labelKey: 'teachers_layout.extensions_request',
      path: '/extensions-request',
      icon: Clock,
    },
  ],
}
export const SIDEBAR_FALLBACK_ITEMS: TSidebarItem[] = [
  {
    labelKey: 'teachers_layout.home',
    path: '/home',
    icon: DashboardGridIcon,
  },
]
