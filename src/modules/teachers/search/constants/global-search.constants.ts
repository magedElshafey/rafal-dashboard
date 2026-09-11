import { BookOpen, ClipboardList, FileQuestion, GraduationCap, Layers, UserRound, UsersRound } from 'lucide-react'

import type { GlobalSearchResultType } from '../types/global-search.types'

export const GLOBAL_SEARCH_MIN_QUERY_LENGTH = 2
export const GLOBAL_SEARCH_DEBOUNCE_MS = 400

export const GLOBAL_SEARCH_TYPE_META: Record<
  GlobalSearchResultType,
  {
    labelKey: string
    icon: typeof UserRound
  }
> = {
  student: {
    labelKey: 'teachers_layout.search.types.student',
    icon: GraduationCap,
  },
  parent: {
    labelKey: 'teachers_layout.search.types.parent',
    icon: UsersRound,
  },
  teacher: {
    labelKey: 'teachers_layout.search.types.teacher',
    icon: UserRound,
  },
  admin: {
    labelKey: 'teachers_layout.search.types.admin',
    icon: UserRound,
  },
  assistant: {
    labelKey: 'teachers_layout.search.types.assistant',
    icon: UserRound,
  },
  course: {
    labelKey: 'teachers_layout.search.types.course',
    icon: BookOpen,
  },
  exam: {
    labelKey: 'teachers_layout.search.types.exam',
    icon: FileQuestion,
  },
  assignment: {
    labelKey: 'teachers_layout.search.types.assignment',
    icon: ClipboardList,
  },
  group: {
    labelKey: 'teachers_layout.search.types.group',
    icon: Layers,
  },
}
