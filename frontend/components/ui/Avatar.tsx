import { cn } from '@/lib/utils'
import Image from 'next/image'

interface AvatarProps {
  src?: string
  alt?: string
  size?: 'sm' | 'md' | 'lg' | 'xl'
  fallback?: string
  className?: string
}

export function Avatar({ 
  src, 
  alt, 
  size = 'md', 
  fallback, 
  className 
}: AvatarProps) {
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
    xl: 'h-16 w-16 text-lg',
  }

  return (
    <div className={cn(
      'relative inline-flex items-center justify-center rounded-full bg-gray-100 overflow-hidden',
      sizeClasses[size],
      className
    )}>
      {src ? (
        <Image
          src={src}
          alt={alt || 'Avatar'}
          width={100}
          height={100}
          className="h-full w-full object-cover"
        />
      ) : (
        <span className="font-medium text-gray-600">
          {fallback || '?'}
        </span>
      )}
    </div>
  )
}
