'use client'

import { useState } from 'react'
import { Send, Paperclip, Smile, Hash, Users2, MoreHorizontal } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'

export default function ChatInterface() {
  const [message, setMessage] = useState('')
  const [selectedChannel] = useState('general')

  // Mock data - will be replaced with real data
  const messages = [
    {
      id: 1,
      user: { name: 'Alice Johnson', username: 'alice', avatar: '/avatars/alice.jpg' },
      content: 'Hey everyone! How\'s the project going?',
      timestamp: new Date(Date.now() - 3600000),
      type: 'text'
    },
    {
      id: 2,
      user: { name: 'Bob Smith', username: 'bob', avatar: '/avatars/bob.jpg' },
      content: 'Pretty good! Just pushed the latest changes to the design system. The new dark theme is looking sleek 🔥',
      timestamp: new Date(Date.now() - 2400000),
      type: 'text'
    },
    {
      id: 3,
      user: { name: 'Carol Davis', username: 'carol', avatar: '/avatars/carol.jpg' },
      content: 'Awesome work Bob! I love the new gradient effects.',
      timestamp: new Date(Date.now() - 1800000),
      type: 'text'
    },
    {
      id: 4,
      user: { name: 'Alice Johnson', username: 'alice', avatar: '/avatars/alice.jpg' },
      content: 'Should we schedule a quick sync to review the UI components?',
      timestamp: new Date(Date.now() - 900000),
      type: 'text'
    }
  ]

  const onlineUsers = [
    { id: 'alice', name: 'Alice Johnson', avatar: '/avatars/alice.jpg', status: 'Working on UI' },
    { id: 'bob', name: 'Bob Smith', avatar: '/avatars/bob.jpg', status: 'In a meeting' },
    { id: 'carol', name: 'Carol Davis', avatar: '/avatars/carol.jpg', status: 'Available' },
    { id: 'dave', name: 'Dave Wilson', avatar: '/avatars/dave.jpg', status: 'Away' },
  ]

  const handleSendMessage = () => {
    if (message.trim()) {
      // TODO: Implement message sending
      console.log('Sending message:', message)
      setMessage('')
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date) => {
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  return (
    <div className="flex flex-1 h-full relative">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-card/30 pointer-events-none" />
      
      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative z-10">
        {/* Chat Header */}
        <div className="bg-card/60 backdrop-blur-xl border-b border-border/50 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="p-1">
                  <Hash className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-semibold text-card-foreground capitalize">
                  {selectedChannel}
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                Channel for general discussions
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/30 backdrop-blur-sm transition-all">
                <Users2 className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/30 backdrop-blur-sm transition-all">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((msg, index) => {
            const showDate = index === 0 || 
              formatDate(msg.timestamp) !== formatDate(messages[index - 1].timestamp)
            
            return (
              <div key={msg.id}>
                {showDate && (
                  <div className="flex items-center justify-center my-4">
                    <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                      {formatDate(msg.timestamp)}
                    </div>
                  </div>
                )}
                
                <div className="flex space-x-3 hover:bg-muted/20 hover:backdrop-blur-sm p-2 -m-2 rounded-lg group transition-all duration-200">
                  <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-transparent group-hover:ring-border/30 transition-all">
                    <AvatarImage src={msg.user.avatar} alt={msg.user.name} />
                    <AvatarFallback className="text-sm bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm">
                      {msg.user.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline space-x-2 mb-1">
                      <span className="font-medium text-card-foreground">
                        {msg.user.name}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {formatTime(msg.timestamp)}
                      </span>
                    </div>
                    <div className="text-foreground leading-relaxed">
                      {msg.content}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Message Input */}
        <div className="bg-card/60 backdrop-blur-xl border-t border-border/50 p-4 shadow-lg">
          <div className="flex items-end space-x-4">
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground hover:bg-muted/30 backdrop-blur-sm mb-2 transition-all">
              <Paperclip className="w-4 h-4" />
            </Button>
            
            <div className="flex-1">
              <div className="relative group">
                <Input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={`Message #${selectedChannel}`}
                  className="pr-12 bg-muted/30 backdrop-blur-sm border-border/50 min-h-[44px] resize-none focus:bg-muted/50 focus:border-primary/50 transition-all duration-200 shadow-sm"
                />
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground hover:bg-muted/30 backdrop-blur-sm transition-all"
                >
                  <Smile className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            <Button 
              onClick={handleSendMessage}
              disabled={!message.trim()}
              className="bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-primary-foreground mb-2 shadow-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      </div>

      {/* Right Sidebar - Online Users */}
      <div className="w-64 bg-card/60 backdrop-blur-xl border-l border-border/50 relative z-10 shadow-xl">
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <h3 className="font-medium text-card-foreground flex items-center">
            <Users2 className="w-4 h-4 mr-2" />
            Online — {onlineUsers.length}
          </h3>
        </div>
        
        <div className="p-4 space-y-3">
          {onlineUsers.map((user) => (
            <div key={user.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/30 hover:backdrop-blur-sm cursor-pointer transition-all duration-200 group">
              <div className="relative">
                <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-border/50 transition-all">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="text-xs bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm" />
              </div>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-card-foreground truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.status}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
