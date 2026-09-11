export type GlobalSearchResultType =
  'student' | 'parent' | 'teacher' | 'admin' | 'assistant' | 'course' | 'exam' | 'assignment' | 'group'

export type GlobalSearchResult = {
  id: string
  type: GlobalSearchResultType
  title: string
  subtitle?: string
  url: string
  image?: string | null
}
