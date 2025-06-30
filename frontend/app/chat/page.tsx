'use client'

import { useAuthStore, useChatStore } from '@/stores/chat.store'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import ChatLayout from '@/components/chat/ChatLayout'
import ChatInterface from '@/components/chat/ChatInterface'

export default function ChatPage() {
  const { isAuthenticated, user, setUser } = useAuthStore()
  const { currentRoom, currentChatUser } = useChatStore()
  const [isInitialized, setIsInitialized] = useState(false)
  const [isClient, setIsClient] = useState(false)
  const router = useRouter()

  useEffect(() => {
    setIsClient(true)
  }, [])

  useEffect(() => {
    if (!isClient) return
    
    // Check localStorage as the source of truth
    const savedUser = localStorage.getItem('user')
    const savedToken = localStorage.getItem('token')
    
    if (savedUser && savedToken) {
      // We have authentication data in localStorage
      if (!isAuthenticated || !user) {
        // But Zustand doesn't have it, so restore it
        try {
          const userObj = JSON.parse(savedUser)
          setUser(userObj)
        } catch {
          // Invalid saved user data, clear it
          localStorage.removeItem('user')
          localStorage.removeItem('token')
          router.push('/')
          return
        }
      }
      // User is authenticated, allow access
      setIsInitialized(true)
    } else {
      // No authentication data found
      router.push('/')
    }
  }, [isClient, isAuthenticated, user, setUser, router])

  if (!isClient || !isInitialized) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center dark">
        <div className="text-foreground text-xl">Loading...</div>
      </div>
    )
  }

  // Create a stable key that changes when the selected chat changes
  const chatKey = `chat-${currentRoom?._id || 'room-none'}-${currentChatUser?._id || 'user-none'}`

  return (
    <ChatLayout>
      <ChatInterface key={chatKey} />
    </ChatLayout>
  )
}
