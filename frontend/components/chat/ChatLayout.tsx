'use client'

import { useState, useEffect, useCallback } from 'react'
import { Hash, Users, Bell, Plus, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAuthStore, useChatStore, Conversation } from '@/stores/chat.store'
import { roomService, Room } from '@/services/room.service'
import { friendsService, Friend } from '@/services/friends.service'
import { messageService } from '@/services/message.service'
import { User } from '@/services/auth.service'
import { socketService } from '@/services/socket.service'
import SearchModal from './SearchModal'
import CreateRoomModal from './CreateRoomModal'
import SettingsModal from './SettingsModal'

interface ChatLayoutProps {
  children: React.ReactNode
}

export default function ChatLayout({ children }: ChatLayoutProps) {
  const { user } = useAuthStore()
  const { 
    rooms, 
    friends,
    conversations,
    currentRoom, 
    currentChatUser,
    setRooms, 
    setFriends,
    setConversations,
    setCurrentRoom, 
    setCurrentChatUser 
  } = useChatStore()
  
  const [activeTab, setActiveTab] = useState<'chats' | 'friends'>('chats')
  const [loading, setLoading] = useState(true)

  // Load initial data
  const loadData = useCallback(async () => {
    if (!user) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      
      // Load rooms, friends, and conversations in parallel
      const [roomsData, friendsData, conversationsData] = await Promise.all([
        roomService.getRoomsWithUnreadCounts(),
        friendsService.getFriends(),
        messageService.getUserConversations()
      ])
      
      setRooms(roomsData)
      setFriends(friendsData)
      
      // Filter out any placeholder conversations when loading real data
      const realConversations = conversationsData.filter(conv => !conv._id.startsWith('temp-'))
      setConversations(realConversations)
    } catch (error) {
      console.error('Error loading chat data:', error)
      // Don't redirect on error, just show empty state
    } finally {
      setLoading(false)
    }
  }, [user, setRooms, setFriends, setConversations])

  useEffect(() => {
    loadData()
  }, [loadData])

  // Initialize socket connection when user is authenticated
  useEffect(() => {
    if (user) {
      socketService.connect()
      
      // Listen for conversation updates to refresh the list in real-time
      const unsubscribeConversationUpdate = socketService.onConversationUpdate(async () => {
        try {
          // Reload conversations to get updated unread counts
          const conversationsData = await messageService.getUserConversations()
          
          // Remove any placeholder conversations and replace with real ones
          const realConversations = conversationsData.filter(conv => !conv._id.startsWith('temp-'))
          setConversations(realConversations)
        } catch (error) {
          console.error('Error refreshing conversations after update:', error)
        }
      })

      // Listen for room updates to refresh the room list in real-time
      const unsubscribeRoomUpdate = socketService.onRoomUpdate(async () => {
        try {
          // Reload rooms to get updated unread counts
          const roomsData = await roomService.getRoomsWithUnreadCounts()
          setRooms(roomsData)
        } catch (error) {
          console.error('Error refreshing rooms after update:', error)
        }
      })
      
      return () => {
        unsubscribeConversationUpdate()
        unsubscribeRoomUpdate()
        if (user) {
          socketService.disconnect()
        }
      }
    }
    
    return () => {
      if (user) {
        socketService.disconnect()
      }
    }
  }, [user, setConversations, setRooms])

  const handleRoomCreated = () => {
    // Refresh the rooms list after a new room is created
    loadData()
  }

  const handleRoomSelect = (room: Room) => {
    setCurrentChatUser(null)
    setCurrentRoom(room)
  }

  const handleRoomJoined = (room: Room) => {
    // Refresh rooms list and select the joined room
    loadData()
    setCurrentChatUser(null)
    setCurrentRoom(room)
  }

  const handleUserUpdate = () => {
    // Refresh user data after profile update
    loadData()
  }

  const handleFriendSelect = async (friend: Friend) => {
    setCurrentRoom(null)
    setCurrentChatUser(friend)
    
    // Switch to the Chats tab to show the conversation
    setActiveTab('chats')
    
    // Check if conversation already exists
    const existingConversation = conversations.find(conv => 
      conv.otherUser._id === friend._id
    )
    
    if (!existingConversation) {
      // Create a placeholder conversation entry for immediate UI feedback
      const placeholderConversation: Conversation = {
        _id: `temp-${friend._id}`, // Temporary ID
        otherUser: {
          _id: friend._id,
          username: friend.username,
          name: friend.name,
        },
        lastMessage: {
          _id: 'temp-message',
          content: 'Start a conversation...',
          createdAt: new Date().toISOString(),
          sender: {
            _id: friend._id,
            username: friend.username,
            name: friend.name,
          }
        },
        unreadCount: 0
      }
      
      // Add the placeholder conversation to the store
      const updatedConversations = [placeholderConversation, ...conversations]
      setConversations(updatedConversations)
    }
  }

  const handleConversationSelect = (conversation: Conversation) => {
    // Convert the conversation's other user to a Friend-like object for consistency
    const userToChat: Friend = {
      _id: conversation.otherUser._id,
      username: conversation.otherUser.username,
      name: conversation.otherUser.name,
      email: '', // Not available in conversation, but not needed for chat
      profilePic: '' // Not available in conversation summary
    }
    setCurrentRoom(null)
    setCurrentChatUser(userToChat)
    
    // If this is a placeholder conversation (temp ID), we'll let the real conversation
    // replace it when the first message is sent
  }

  const handleUserSelect = (user: User) => {
    // Convert User to Friend-like object for direct messaging
    const friendUser: Friend = {
      _id: user._id,
      username: user.username,
      name: user.name,
      email: user.email,
      profilePic: user.profilePic
    }
    setCurrentRoom(null)
    setCurrentChatUser(friendUser)
  }

  const handleAddFriend = async () => {
    // Refresh friends list after adding
    try {
      const friendsData = await friendsService.getFriends()
      setFriends(friendsData)
    } catch (error) {
      console.error('Error refreshing friends:', error)
    }
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-background via-card to-background dark relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-accent/15 to-muted/20 rounded-full blur-3xl animate-pulse" style={{animationDelay: '2s'}} />
        <div className="absolute top-1/3 left-1/2 w-96 h-96 bg-gradient-radial from-primary/10 to-transparent rounded-full blur-2xl" />
      </div>
      
      {/* Sidebar */}
      <div className="w-80 bg-card/60 backdrop-blur-xl border-r border-border/50 flex flex-col relative z-10 shadow-2xl max-h-100vh">
        {/* App Header */}
        <div className="flex-shrink-0 p-4 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center">
              <Hash className="w-4 h-4 text-muted-foreground" />
            </div>
            <h1 className="font-bold text-xl bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">
              NoirChat
            </h1>
          </div>
          
          {/* Search */}
          <SearchModal
            onUserSelect={handleUserSelect}
            onRoomSelect={handleRoomJoined}
            onAddFriend={handleAddFriend}
          />
        </div>        
        {/* Navigation and Content */}
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'chats' | 'friends')} className="flex flex-col flex-1">
          {/* Navigation Tabs */}
          <div className="p-4 border-b border-border/50">
            <TabsList className="grid w-full grid-cols-2 bg-muted/50 border-border">
              <TabsTrigger 
                value="chats" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-muted-foreground cursor-pointer"
              >
                Chats
              </TabsTrigger>
              <TabsTrigger 
                value="friends" 
                className="data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground text-muted-foreground cursor-pointer"
              >
                Friends
              </TabsTrigger>
            </TabsList>
          </div>

          {/* Content Area */}
          <div className="flex-1 overflow-y-auto">
            <TabsContent value="chats" className="p-4 m-0 h-full">
              {/* Channels Section */}
              <div className="mb-6">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                    Channels
                  </h3>
                  <CreateRoomModal onRoomCreated={handleRoomCreated} />
                </div>
                
                {loading ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-46 overflow-y-auto pr-2">
                    {rooms.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <Hash className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No rooms found</p>
                      </div>
                    ) : (
                      rooms.map((room) => (
                        <button
                          key={room._id}
                          onClick={() => handleRoomSelect(room)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group cursor-pointer ${
                            currentRoom?._id === room._id
                              ? 'bg-secondary/80 backdrop-blur-sm text-card-foreground shadow-sm'
                              : 'text-card-foreground hover:bg-muted/40 hover:backdrop-blur-sm hover:shadow-md'
                          }`}
                        >
                          <Hash className={`w-4 h-4 flex-shrink-0 transition-colors ${
                            currentRoom?._id === room._id ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'
                          }`} />
                          <span className="flex-1 truncate font-medium">{room.name}</span>
                          {(room.unreadCount ?? 0) > 0 && (
                            <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                              {room.unreadCount}
                            </span>
                          )}
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Direct Messages Section */}
              <div>
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                  Direct Messages
                </h3>
                {loading ? (
                  <div className="flex items-center justify-center py-4">
                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                    {conversations.length === 0 ? (
                      <div className="text-center text-muted-foreground py-4">
                        <Users className="w-6 h-6 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No conversations yet</p>
                      </div>
                    ) : (
                      conversations.map((conversation) => (
                        <button
                          key={conversation._id}
                          onClick={() => handleConversationSelect(conversation)}
                          className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg text-left transition-all duration-200 group cursor-pointer ${
                            currentChatUser?._id === conversation.otherUser._id
                              ? 'bg-secondary/80 backdrop-blur-sm text-card-foreground shadow-sm'
                              : 'text-card-foreground hover:bg-muted/40 hover:backdrop-blur-sm hover:shadow-md'
                          }`}
                        >
                          <div className="relative">
                            <Avatar className="w-7 h-7 ring-2 ring-transparent group-hover:ring-border/50 transition-all">
                              <AvatarFallback className="text-xs bg-muted/50 backdrop-blur-sm">
                                {conversation.otherUser.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {/* TODO: Add online status from socket */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <span className="font-medium text-sm truncate">{conversation.otherUser.name}</span>
                              <span className="text-xs text-muted-foreground">
                                {new Date(conversation.lastMessage.createdAt).toLocaleDateString() === new Date().toLocaleDateString()
                                  ? new Date(conversation.lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                                  : new Date(conversation.lastMessage.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })
                                }
                              </span>
                            </div>
                            <div className="flex items-center justify-between">
                              <p className="text-xs text-muted-foreground truncate">
                                {conversation.lastMessage.sender._id === user?._id ? 'You: ' : ''}
                                {conversation.lastMessage.content}
                              </p>
                              {conversation.unreadCount > 0 && (
                                <span className="bg-primary text-primary-foreground text-xs rounded-full px-2 py-0.5 min-w-[20px] text-center">
                                  {conversation.unreadCount}
                                </span>
                              )}
                            </div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            </TabsContent>

            <TabsContent value="friends" className="p-4 m-0 h-full">
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider">
                      Friends ({friends.length})
                    </h3>
                    <Button size="sm" variant="ghost" className="w-6 h-6 p-0">
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                  
                  {friends.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p>No friends yet!</p>
                      <p className="text-xs mt-1">Add some friends to start chatting</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friends.map((friend) => (
                        <div
                          key={friend._id}
                          className="flex items-center space-x-3 px-3 py-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-all duration-200"
                        >
                          <div className="relative">
                            <Avatar className="w-8 h-8">
                              <AvatarImage src={friend.profilePic} alt={friend.name} />
                              <AvatarFallback className="text-sm bg-muted/50 backdrop-blur-sm">
                                {friend.name.split(' ').map((n: string) => n[0]).join('')}
                              </AvatarFallback>
                            </Avatar>
                            {/* Online status indicator */}
                            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 border-2 border-card rounded-full shadow-sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-card-foreground truncate">{friend.name}</p>
                            <p className="text-xs text-muted-foreground">@{friend.username}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleFriendSelect(friend)}
                            className="text-xs"
                          >
                            Message
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
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
              <SettingsModal onUserUpdate={handleUserUpdate} />
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
