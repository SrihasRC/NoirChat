'use client'

import { useState, useEffect, useRef } from 'react'
import { Send, Paperclip, Smile, Hash, Users2, MoreHorizontal, User } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useChatStore, useAuthStore } from '@/stores/chat.store'
import { roomService } from '@/services/room.service'
import { messageService } from '@/services/message.service'
import { socketService, Message } from '@/services/socket.service'
import UserStatusIndicator from '@/components/ui/user-status-indicator'

export default function ChatInterface() {
  const [message, setMessage] = useState('')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // Use explicit selectors to ensure proper re-rendering
  const { user } = useAuthStore()
  const messages = useChatStore(state => state.messages)
  const currentRoom = useChatStore(state => state.currentRoom) 
  const currentChatUser = useChatStore(state => state.currentChatUser)
  const setMessages = useChatStore(state => state.setMessages)
  const addMessage = useChatStore(state => state.addMessage)
  const updateConversation = useChatStore(state => state.updateConversation)
  const updateRoom = useChatStore(state => state.updateRoom)
  const setConversations = useChatStore(state => state.setConversations)
  
  // Auto-scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Load messages when room or chat user changes
  useEffect(() => {
    const loadMessages = async () => {
      if (currentRoom) {
        try {
          const roomMessages = await roomService.getRoomMessages(currentRoom._id)
          // Sort messages by date
          const sortedMessages = [...roomMessages].sort((a, b) => 
            new Date(a.createdAt || a.timestamp || '').getTime() - 
            new Date(b.createdAt || b.timestamp || '').getTime()
          )
          setMessages(sortedMessages)
          
          // Mark room messages as read and update the unread count in the store
          try {
            await roomService.markRoomAsRead(currentRoom._id)
            // Update the room's unread count to 0 in the store
            updateRoom(currentRoom._id, { unreadCount: 0 })
          } catch (error) {
            console.error('Error marking room as read:', error)
          }
        } catch (error) {
          console.error('Error loading room messages:', error)
        }
      } else if (currentChatUser) {
        try {
          const directMessages = await messageService.getConversation(currentChatUser.username)
          // Sort direct messages by date
          const sortedMessages = [...directMessages].sort((a, b) => 
            new Date(a.createdAt || a.timestamp || '').getTime() - 
            new Date(b.createdAt || b.timestamp || '').getTime()
          )
          setMessages(sortedMessages)
          
          // Mark conversation as read and update the unread count in the store
          try {
            await messageService.markConversationAsRead(currentChatUser.username)
            // Update the conversation's unread count to 0 in the store
            updateConversation(currentChatUser._id, { unreadCount: 0 })
          } catch (error) {
            console.error('Error marking conversation as read:', error)
          }
        } catch (error) {
          console.error('Error loading direct messages:', error)
        }
      } else {
        setMessages([])
      }
    }

    loadMessages()
  }, [currentRoom, currentChatUser, setMessages, updateConversation, updateRoom])

  useEffect(() => {
    // Set up listeners for socket events
    let unsubscribe: () => void;
    
    if (currentRoom) {
      socketService.joinRoom(currentRoom._id)
      
      unsubscribe = socketService.onNewMessage((newMessage: Message) => {
        if (newMessage.room === currentRoom._id) {
          addMessage(newMessage)
        }
      })
    } else if (currentChatUser && user) {
      // Set up listener for direct messages
      unsubscribe = socketService.onNewMessage((newMessage: Message) => {
        // Check if message is from or to the current chat user
        const isRelevantMessage = (
          // Message is from current chat user to current user
          (newMessage.sender._id === currentChatUser._id && 
           newMessage.receiver && newMessage.receiver._id === user._id) ||
          // Message is from current user to current chat user (when it comes back from server)
          (newMessage.sender._id === user._id && 
           newMessage.receiver && newMessage.receiver._id === currentChatUser._id)
        );
        
        if (isRelevantMessage) {
          // Remove any temporary message with same content from sender and add the confirmed message
          const updatedMessages = messages.filter((m: Message) => 
            !(m.content === newMessage.content && 
              m._id.toString().startsWith('temp-') &&
              m.sender._id === newMessage.sender._id)
          );
          
          // Add the confirmed message if it's not already there
          const messageExists = updatedMessages.some((m: Message) => m._id === newMessage._id);
          if (!messageExists) {
            setMessages([...updatedMessages, newMessage]);
          } else {
            setMessages(updatedMessages);
          }
        }
      })
    }
    
    return () => {
      if (unsubscribe) unsubscribe()
      if (currentRoom) socketService.leaveRoom(currentRoom._id)
    }
  }, [currentRoom, currentChatUser, user, setMessages, addMessage, messages])

  const handleSendMessage = async () => {
    if (message.trim() && currentRoom) {
      try {
        await roomService.sendRoomMessage({
          roomId: currentRoom._id,
          content: message.trim()
        })
        setMessage('')
      } catch (error) {
        console.error('Error sending message:', error)
      }
    } else if (message.trim() && currentChatUser && user) {
      const messageContent = message.trim()
      
      // Create a temporary message to display immediately
      const tempMessage: Message = {
        _id: `temp-${Date.now()}`,
        sender: {
          _id: user._id,
          username: user.username,
          name: user.name
        },
        content: messageContent,
        messageType: 'text',
        isRead: false,
        createdAt: new Date().toISOString(),
        timestamp: new Date().toISOString()
      }
      
      if (currentChatUser) {
        tempMessage.receiver = {
          _id: currentChatUser._id,
          username: currentChatUser.username,
          name: currentChatUser.name
        }
      }
      
      // Add optimistic message to state
      addMessage(tempMessage)
      setMessage('')
      
      // Send the actual message to the server
      try {
        await messageService.sendDirectMessage({
          receiverUsername: currentChatUser.username,
          content: messageContent,
          messageType: 'text'
        })
        
        // Refresh conversations to show the new/updated conversation
        try {
          const updatedConversations = await messageService.getUserConversations()
          setConversations(updatedConversations)
        } catch (convError) {
          console.error('Error refreshing conversations:', convError)
        }
      } catch (error) {
        console.error('Error sending direct message:', error)
        // Could add message retry or error indicator here
      }
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const formatTime = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    return dateObj.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    })
  }

  const formatDate = (date: Date | string) => {
    const dateObj = typeof date === 'string' ? new Date(date) : date
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    if (dateObj.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (dateObj.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return dateObj.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        year: dateObj.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
      })
    }
  }

  // Show placeholder when no room or chat is selected
  if (!currentRoom && !currentChatUser) {
    return (
      <div className="flex flex-1 h-full relative">
        <div className="absolute inset-0 bg-gradient-to-br from-background/50 to-card/30 pointer-events-none" />
        <div className="flex-1 flex items-center justify-center relative z-10">
          <div className="text-center text-muted-foreground">
            <Hash className="w-16 h-16 mx-auto mb-4 opacity-50" />
            <h3 className="text-xl font-medium mb-2">Welcome to NoirChat</h3>
            <p>Select a room or friend to start chatting</p>
          </div>
        </div>
      </div>
    )
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
                  {currentRoom ? (
                    <Hash className="w-5 h-5 text-primary" />
                  ) : (
                    <User className="w-5 h-5 text-primary" />
                  )}
                </div>
                <h2 className="text-lg font-semibold text-card-foreground capitalize">
                  {currentRoom ? currentRoom.name : currentChatUser?.name}
                </h2>
              </div>
              <div className="text-sm text-muted-foreground">
                {currentRoom 
                  ? `${currentRoom.members.length} members` 
                  : currentChatUser 
                    ? `@${currentChatUser.username}`
                    : ''
                }
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
          {messages.length === 0 ? (
            <div className="text-center text-muted-foreground py-12">
              {currentRoom ? (
                <>
                  <Hash className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Welcome to #{currentRoom.name}</h3>
                  <p>This is the beginning of the #{currentRoom.name} channel.</p>
                </>
              ) : (
                <>
                  <User className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                  <p>This is the beginning of your direct message with {currentChatUser?.name}.</p>
                </>
              )}
            </div>
          ) : (
            messages.map((msg, index) => {
              const showDate = index === 0 || 
                formatDate(msg.createdAt || msg.timestamp || '') !== formatDate(messages[index - 1].createdAt || messages[index - 1].timestamp || '')
              
              return (
                <div key={msg._id}>
                  {showDate && (
                    <div className="flex items-center justify-center my-4">
                      <div className="bg-muted text-muted-foreground text-xs px-3 py-1 rounded-full">
                        {formatDate(msg.createdAt || msg.timestamp || '')}
                      </div>
                    </div>
                  )}
                  
                  <div className={`flex hover:bg-muted/20 hover:backdrop-blur-sm p-2 -m-2 rounded-lg group transition-all duration-200 ${msg.sender._id === user?._id ? 'justify-end' : 'space-x-3'}`}>
                    {msg.sender._id !== user?._id && (
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-transparent group-hover:ring-border/30 transition-all mr-3">
                        <AvatarFallback className="text-sm bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm">
                          {msg.sender.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div className={`flex-1 min-w-0 ${msg.sender._id === user?._id ? 'flex flex-col items-end' : ''}`}>
                      <div className={`flex items-baseline mb-1 ${msg.sender._id === user?._id ? 'justify-end' : ''}`}>
                        {msg.sender._id === user?._id ? (
                          <span className="text-xs text-muted-foreground mr-2">
                            You
                          </span>
                        ) : (
                          <span className="font-medium text-card-foreground mr-2">
                            {msg.sender.name}
                          </span>
                        )}
                        <span className="text-xs text-muted-foreground">
                          {formatTime(msg.createdAt || msg.timestamp || '')}
                        </span>
                      </div>
                      <div className={`leading-relaxed text-foreground max-w-[75%] ${msg.sender._id === user?._id ? 'text-right' : ''}`}>
                        {msg.content}
                      </div>
                    </div>
                    
                    {msg.sender._id === user?._id && (
                      <Avatar className="w-10 h-10 flex-shrink-0 ring-2 ring-transparent group-hover:ring-border/30 transition-all ml-3">
                        <AvatarFallback className="text-sm bg-gradient-to-br from-muted/50 to-muted/30 backdrop-blur-sm">
                          {msg.sender.name.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </div>
                </div>
              )
            })
          )}
          {/* Scroll target for auto-scroll */}
          <div ref={messagesEndRef} />
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
                  placeholder={
                    currentRoom 
                      ? `Message #${currentRoom.name}` 
                      : currentChatUser 
                        ? `Message ${currentChatUser.name}`
                        : 'Type a message...'
                  }
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
              className="hover:from-primary/90 hover:to-secondary/90 text-primary-foreground mb-1 shadow-lg backdrop-blur-sm transition-all duration-200 disabled:opacity-50"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <div className="text-xs text-muted-foreground mt-2">
            Press Enter to send, Shift + Enter for new line
          </div>
        </div>
      </div>

      {/* Right Sidebar - Room Members or Friend Info */}
      {currentRoom && (
        <div className="w-64 bg-card/60 backdrop-blur-xl border-l border-border/50 relative z-10 shadow-xl">
          <div className="p-4 border-b border-border/50 bg-gradient-to-r from-card/80 to-card/60 backdrop-blur-sm">
            <h3 className="font-medium text-card-foreground flex items-center">
              <Users2 className="w-4 h-4 mr-2" />
              Members — {currentRoom.members.length}
            </h3>
          </div>
          
          <div className="p-4 space-y-3">
            {currentRoom.members.map((member, index) => {
              const memberUser = typeof member === 'object' && 'user' in member 
                ? (typeof member.user === 'object' ? member.user : null)
                : null;
              const memberRole = typeof member === 'object' && 'role' in member ? member.role : 'member';
              
              return (
                <div key={index} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-muted/20 transition-colors">
                  <div className="relative">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="text-xs bg-gradient-to-br from-muted/50 to-muted/30">
                        {memberUser?.name 
                          ? memberUser.name.split(' ').map((n: string) => n[0]).join('')
                          : 'U'
                        }
                      </AvatarFallback>
                    </Avatar>
                    <UserStatusIndicator 
                      isOnline={memberUser?.isOnline ?? false}
                      className="absolute -bottom-0.5 -right-0.5"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-card-foreground truncate">
                      {memberUser?.name || 'Unknown User'}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {memberRole === 'owner' ? 'Owner' : memberRole === 'admin' ? 'Admin' : 'Member'}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  )
}
