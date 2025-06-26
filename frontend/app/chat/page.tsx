'use client'

import { useAuthStore } from '@/stores/chat.store'
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function ChatPage() {
  const { isAuthenticated, setUser } = useAuthStore()
  const router = useRouter()

  useEffect(() => {
    const savedUser = localStorage.getItem('user')
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser)
        console.log('Found saved user:', user)
        setUser(user)
      } catch (error) {
        console.error('Error parsing saved user:', error)
        localStorage.removeItem('user')
        router.push('/')
      }
    } else {
      router.push('/')
    }
  }, [setUser, router])

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center dark">
        <div className="text-foreground text-xl">Redirecting to login...</div>
      </div>
    )
  }

  return (
    <div>Chat</div>
  )
}
