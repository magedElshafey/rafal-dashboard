import { ReactNode } from 'react'

export type ErrorPageProps = {
  title: string
  desc1: string
  desc2: string
  code: string
  mainButton?: ReactNode
}
