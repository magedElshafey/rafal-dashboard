import { ImgHTMLAttributes } from 'react'

type Props = ImgHTMLAttributes<HTMLImageElement>

function Image(props: Props) {
  return <img loading="lazy" alt="photo" {...props} />
}

export default Image
