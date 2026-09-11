import { Children, ReactNode } from 'react'

interface IProps<T> {
  of: T[]
  render: (item: T, index: number) => ReactNode
}

export const Each = <T,>({ of, render }: IProps<T>) => Children.toArray(of?.map((item, index) => render(item, index)))
