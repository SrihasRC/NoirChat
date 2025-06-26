'use client'

import { useState } from 'react'
import { Search, Hash, Users, Settings, Bell, Plus } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore } from '@/stores/chat.store'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user } = useAuthStore()
  const [activeTab, setActiveTab] = useState<'rooms' | 'friends'>('rooms')
  const [selectedRoom, setSelectedRoom] = useState('general')

  // Mock data - will be replaced with real data from API
  const channels = [
    { id: 'general', name: 'General', unread: 3, type: 'channel' },
    { id: 'random', name: 'Random', unread: 0, type: 'channel' },
    { id: 'design-team', name: 'Design Team', unread: 1, type: 'channel' },
  ]

  const directMessages = [
    { id: 'alice', name: 'Alice Johnson', unread: 2, avatar: '/avatars/alice.jpg', online: true },
    { id: 'bob', name: 'Bob Smith', unread: 0, avatar: '/avatars/bob.jpg', online: false },
    { id: 'carol', name: 'Carol Davis', unread: 1, avatar: '/avatars/carol.jpg', online: true },
  ]

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-card to-background dark relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/15 to-muted/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-2xl" />
      </div>
      
      {/* Sidebar */}
      <div className="w-80 bg-card/60 backdrop-blur-xl border-r border-border/50 flex flex-col relative z-10 shadow-2xl">
        {/* App Header */}
        <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 bg-gradient-to-br from-primary via-secondary to-accent rounded-lg flex items-center justify-center shadow-lg">
              <Hash className="w-4 h-4 text-muted-foreground drop-shadow-sm" />
            </div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              NoirChat
            </h1>
          </div>
          
          {/* Search */}
          <div className="relative group">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
            <Input
              placeholder="Search messages, friends, rooms..."
              className="pl-10 bg-muted/30 backdrop-blur-sm border-border/50 text-foreground placeholder:text-muted-foreground focus:bg-muted/50 focus:border-primary/50 transition-all duration-200 shadow-sm"
            />
          </div>
        </div>        
        {/* Navigation and Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'rooms' | 'friends')} className="flex flex-col flex-1">
          {/* Navigation Tabs */}
          <div className="p-4 border-b border-border/50">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 border-border">
              <TabsTrigger 
                value="rooms" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-muted-foreground"
              >
                Rooms
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-muted-foreground"
              >
                Friends
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="rooms" className="p-4 m-0 h-full">
              {/* Channels Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Channels
                  </h3>
                  <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {channels.map((channel) => (
                    <button
                      key={channel.id}
                      onClick={() => setSelectedRoom(channel.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                        selectedRoom === channel.id
                          ? 'bg-secondary/80 backdrop-blur-sm text-card-foreground shadow-sm'
                          : 'text-card-foreground hover:bg-muted/40 hover:backdrop-blur-sm hover:shadow-md'
                      }`}
                    >
                      <Hash className={`w-4 h-4 flex-shrink-0 transition-colors ${
                        selectedRoom === channel.id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                      }`} />
                      <span className="flex-1 truncate font-medium">{channel.name}</span>
                      {channel.unread > 0 && (
                        <Badge variant="secondary" className="bg-destructive/90 text-destructive-foreground min-w-[20px] h-5 text-xs backdrop-blur-sm shadow-sm rounded-full">
                          {channel.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              {/* Direct Messages Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider mb-3">
                  Direct Messages
                </h3>
                <div className="space-y-1">
                  {directMessages.map((dm) => (
                    <button
                      key={dm.id}
                      onClick={() => setSelectedRoom(dm.id)}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group ${
                        selectedRoom === dm.id
                          ? 'bg-secondary/80 backdrop-blur-sm text-card-foreground shadow-sm'
                          : 'text-card-foreground hover:bg-muted/40 hover:backdrop-blur-sm hover:shadow-md'
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="w-6 h-6 ring-2 ring-transparent group-hover:ring-border/50 transition-all">
                          <AvatarImage src={dm.avatar} alt={dm.name} />
                          <AvatarFallback className="text-xs bg-muted/50 backdrop-blur-sm">
                            {dm.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        {dm.online && (
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm" />
                        )}
                      </div>
                      <span className="flex-1 truncate font-medium">{dm.name}</span>
                      {dm.unread > 0 && (
                        <Badge variant="secondary" className="bg-destructive/90 text-destructive-foreground min-w-[20px] h-5 text-xs backdrop-blur-sm shadow-sm">
                          {dm.unread}
                        </Badge>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="friends" className="p-4 m-0 h-full">
              <div className="text-center text-muted-foreground py-8">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Friends feature coming soon!</p>
              </div>
            </TabsContent>
          </div>
        </Tabs>

        {/* User Profile Section */}
        <div className="p-4 border-t border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3">
            <div className="relative group">
              <Avatar className="w-8 h-8 ring-2 ring-transparent group-hover:ring-primary/30 transition-all">
                <AvatarImage src={user?.profilePic} alt={user?.name} />
                <AvatarFallback className="text-sm bg-gradient-to-br from-primary/20 to-secondary/20 backdrop-blur-sm">
                  {user?.name?.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-card-foreground truncate">{user?.name}</p>
              <p className="text-xs text-muted-foreground">@{user?.username}</p>
            </div>
            <div className="flex space-x-1">
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-muted/30 hover:backdrop-blur-sm transition-all">
                <Bell className="w-4 h-4" />
              </Button>
              <Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-muted/30 hover:backdrop-blur-sm transition-all">
                <Settings className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {children}
      </div>
    </div>
  )
}
