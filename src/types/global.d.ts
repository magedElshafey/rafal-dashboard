interface IDDl {
  value: string
  label: string
}

interface IStatus<T = string | number> {
  value: T
  label: string
}

interface IFileResponse {
  id: number
  name: string
  path: string
  type: string
  extension: string
}
type ApiResponse<T> = {
  data: T
}
type FilesFormValues = {
  files: File[]
}
type Pagination = {
  total: number
  count: number
  per_page: number
  next_page_url: string | null
  prev_page_url: string | null
  current_page: number
  total_pages: number
}

type PaginatedData<TItem, TExtra = null> = {
  items: TItem[]
  paginate: Pagination
  extra: TExtra
}

type EntityId = string

type Media = {
  id: EntityId
  name: string
  file_name: string
  mime_type: string
  size: number
  url: string
  is_downloadable?: boolean
}

type Group = {
  id: EntityId
  name: string
}

type Nullable<T> = T | null
