export interface IMedia {
  id: string
  name: string
  url: string
  filename: string
  type: string
  size: string
  extension: string
  created_at: string
}

export interface IServerMedia extends Omit<IMedia, 'url'> {
  path: string
}

export interface IImage {
  id: number
  name: string
  path: string
  type: string
  extension: string
}
