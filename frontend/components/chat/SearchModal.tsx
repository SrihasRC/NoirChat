'use client'

import { useState, useEffect } from 'react'
import { Search, UserPlus, MessageCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { userService } from '@/services/user.service'
import { User } from '@/services/auth.service'
import { friendsService } from '@/services/friends.service'
import { useAuthStore } from '@/stores/chat.store'

interface SearchModalProps {
  onUserSelect: (user: User) => void
  onAddFriend: (user: User) => void
}

export default function SearchModal({ onUserSelect, onAddFriend }: SearchModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [addingFriend, setAddingFriend] = useState<string | null>(null)
  const { user: currentUser } = useAuthStore()

  // Search when query changes with debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (isOpen && searchQuery.trim().length >= 2) {
        try {
          setIsSearching(true)
          const results = await userService.searchUsers(searchQuery.trim())
          // Filter out current user from results
          const filteredResults = results.filter(user => user._id !== currentUser?._id)
          setSearchResults(filteredResults)
        } catch (error) {
          console.error('Search error:', error)
          setSearchResults([])
        } finally {
          setIsSearching(false)
        }
      } else {
        setSearchResults([])
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, isOpen, currentUser?._id])

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
    setSearchResults([])
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="w-full justify-start text-muted-foreground cursor-pointer">
          <Search className="w-4 h-4 mr-2" />
          Search users to chat...
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Search Users</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by username or name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {isSearching && (
              <Loader2 className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground animate-spin" />
            )}
          </div>

          <div className="max-h-60 overflow-y-auto space-y-2">
            {searchResults.length > 0 ? (
              searchResults.map((user) => (
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
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No users found for &ldquo;{searchQuery}&rdquo;</p>
              </div>
            ) : searchQuery.trim().length < 2 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Search className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>Type at least 2 characters to search</p>
              </div>
            ) : null}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
