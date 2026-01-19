import Image from 'next/image'

interface PasskeyIconProps {
  variant?: 'black' | 'white' | 'gray'
  size?: number
  className?: string
}

export function PasskeyIcon({ variant = 'black', size = 20, className }: PasskeyIconProps) {
  return (
    <Image
      src={`/passkey/${variant}.svg`}
      alt="Passkey"
      width={size}
      height={size}
      className={className}
    />
  )
}
