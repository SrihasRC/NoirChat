import { Badge } from '@/components/ui/badge'

interface UserStatusIndicatorProps {
  isOnline: boolean;
  className?: string;
  showText?: boolean;
}

export default function UserStatusIndicator({ isOnline, className = '', showText = false }: UserStatusIndicatorProps) {
  if (showText) {
    return (
      <Badge 
        variant={isOnline ? 'default' : 'secondary'} 
        className={`text-xs ${className}`}
      >
        {isOnline ? 'Online' : 'Offline'}
      </Badge>
    )
  }

  return (
    <div 
      className={`w-3 h-3 rounded-full border-2 border-white ${
        isOnline ? 'bg-green-500' : 'bg-gray-400'
      } ${className}`}
      title={isOnline ? 'Online' : 'Offline'}
    />
  )
}
