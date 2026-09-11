import { LoaderCircle } from 'lucide-react'

const Loading = ({ size }: { size?: number }) => {
  return <LoaderCircle className="spin-animation" size={size || 24} />
}

export default Loading
