'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, MessageCircle, Loader2, Hash, Users, Globe, Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { userService } from '@/services/user.service'
import { roomService, Room } from '@/services/room.service'
import { User } from '@/services/auth.service'
import { friendsService } from '@/services/friends.service'
import { useAuthStore } from '@/stores/chat.store'

interface SearchModalProps {
  onUserSelect: (user: User) => void
  onRoomSelect: (room: Room) => void
  onAddFriend: (user: User) => void
}

export default function SearchModal({ onUserSelect, onRoomSelect, onAddFriend }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState<'users' | 'rooms'>('users')
  const [userResults, setUserResults] = useState<User[]>([])
  const [roomResults, setRoomResults] = useState<Room[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)
  const [joiningRoom, setJoiningRoom] = useState<string | null>(null)
  const { user: currentUser } = useAuthStore()

  // Search when query changes with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isOpen && searchQuery.trim().length >= 2) {
        try {
          setIsSearching(true)
          
          if (activeTab === 'users') {
            const results = await userService.searchUsers(searchQuery.trim())
            // Filter out current user from results
            const filteredResults = results.filter(user => user._id !== currentUser?._id)
            setUserResults(filteredResults)
          } else {
            const results = await roomService.searchRooms(searchQuery.trim())
            setRoomResults(results)
          }
        } catch (error) {
          console.error('Search error:', error)
          if (activeTab === 'users') {
            setUserResults([])
          } else {
            setRoomResults([])
          }
        } finally {
          setIsSearching(false)
        }
      } else {
        setUserResults([])
        setRoomResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, activeTab, currentUser?._id])

  const handleAddFriend = async (user: User) => {
    try {
      setAddingFriend(user._id)
      await friendsService.addFriend(user.username)
      onAddFriend(user)
    } catch (error) {
      console.error('Error adding friend:', error)
    } finally {
      setAddingFriend(null)
    }
  }

  const handleStartChat = (user: User) => {
    onUserSelect(user)
    setIsOpen(false)
    setSearchQuery('')
    setUserResults([])
    setRoomResults([])
  }

  const handleJoinRoom = async (room: Room) => {
    try {
      setJoiningRoom(room._id)
      await roomService.joinRoom(room._id)
      onRoomSelect(room)
      setIsOpen(false)
      setSearchQuery('')
      setUserResults([])
      setRoomResults([])
    } catch (error) {
      console.error('Error joining room:', error)
    } finally {
      setJoiningRoom(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-muted-foreground cursor-pointer">
          <Search className="w-4 h-4 mr-2" />
          Search users and rooms...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as 'users' | 'rooms')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="users" className="flex items-center space-x-1">
                <Users className="w-4 h-4" />
                <span>Users</span>
              </TabsTrigger>
              <TabsTrigger value="rooms" className="flex items-center space-x-1">
                <Hash className="w-4 h-4" />
                <span>Rooms</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="users" className="mt-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {userResults.length > 0 ? (
                  userResults.map((user) => (
                    <div
                      key={user._id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <Avatar className="w-10 h-10">
                          <AvatarImage src={user.profilePic} alt={user.name} />
                          <AvatarFallback className="bg-primary/10 text-primary">
                            {user.name.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            {user.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            @{user.username}
                          </p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleStartChat(user)}
                          className="h-8 w-8 p-0 hover:bg-primary/10 hover:text-primary"
                        >
                          <MessageCircle className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleAddFriend(user)}
                          disabled={addingFriend === user._id}
                          className="h-8 w-8 p-0 hover:bg-green-500/10 hover:text-green-500"
                        >
                          {addingFriend === user._id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <UserPlus className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  ))
                ) : searchQuery.trim().length >= 2 && !isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No users found for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : null}
              </div>
            </TabsContent>

            <TabsContent value="rooms" className="mt-4">
              <div className="max-h-60 overflow-y-auto space-y-2">
                {roomResults.length > 0 ? (
                  roomResults.map((room) => (
                    <div
                      key={room._id}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center space-x-3 flex-1 min-w-0">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          {room.isPrivate ? (
                            <Lock className="w-5 h-5 text-primary" />
                          ) : (
                            <Globe className="w-5 h-5 text-primary" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">
                            # {room.name}
                          </p>
                          {room.description && (
                            <p className="text-xs text-muted-foreground truncate">
                              {room.description}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground">
                            {room.members.length} members
                          </p>
                        </div>
                      </div>
                      
                      <Button
                        size="sm"
                        onClick={() => handleJoinRoom(room)}
                        disabled={joiningRoom === room._id}
                        className="ml-2"
                      >
                        {joiningRoom === room._id ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          'Join'
                        )}
                      </Button>
                    </div>
                  ))
                ) : searchQuery.trim().length >= 2 && !isSearching ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>No public rooms found for &ldquo;{searchQuery}&rdquo;</p>
                  </div>
                ) : searchQuery.trim().length < 2 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Hash className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p>Type at least 2 characters to search</p>
                  </div>
                ) : null}
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </DialogContent>
    </Dialog>
  )
}
