'use client'

import Image from 'next/image'

interface LogoProps {
  size?: 'sm' | 'md' | 'lg'
}

export default function Logo({ size = 'md' }: LogoProps) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-10 h-10',
    lg: 'w-12 h-12',
  }

  return (
    <div className={`${sizeClasses[size]} relative`}>
      <Image 
        src="/logo.png" 
        alt="Logo" 
        fill
        className="object-contain"
        priority
      />
    </div>
  )
}
