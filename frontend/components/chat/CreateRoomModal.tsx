'use client'

import { useState } from 'react'
import { Plus, Hash, Globe, Lock, Search, X, Users } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { roomService } from '@/services/room.service'
import { userService } from '@/services/user.service'
import { User } from '@/services/auth.service'
import { useAuthStore } from '@/stores/chat.store'

interface CreateRoomModalProps {
  onRoomCreated: () => void
}

export default function CreateRoomModal({ onRoomCreated }: CreateRoomModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    isPrivate: false
  })
  const [selectedMembers, setSelectedMembers] = useState<User[]>([])
  const [memberSearch, setMemberSearch] = useState('')
  const [searchResults, setSearchResults] = useState<User[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [error, setError] = useState('')
  const { user } = useAuthStore()

  // Search for users to add as members
  const handleMemberSearch = async (query: string) => {
    setMemberSearch(query)
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    try {
      setIsSearching(true)
      const results = await userService.searchUsers(query)
      // Filter out current user and already selected members
      const filteredResults = results.filter(searchUser => 
        searchUser._id !== user?._id && 
        !selectedMembers.some(member => member._id === searchUser._id)
      )
      setSearchResults(filteredResults)
    } catch (error) {
      console.error('Error searching users:', error)
      setSearchResults([])
    } finally {
      setIsSearching(false)
    }
  }

  // Add a member to the selected list
  const handleAddMember = (memberToAdd: User) => {
    setSelectedMembers(prev => [...prev, memberToAdd])
    setMemberSearch('')
    setSearchResults([])
  }

  // Remove a member from the selected list
  const handleRemoveMember = (memberId: string) => {
    setSelectedMembers(prev => prev.filter(member => member._id !== memberId))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!formData.name.trim()) {
      setError('Room name is required')
      return
    }

    // Validate room name format
    const roomNameRegex = /^[a-z0-9-]+$/
    if (!roomNameRegex.test(formData.name.toLowerCase())) {
      setError('Room names must be lowercase and can contain dashes')
      return
    }

    try {
      setIsLoading(true)
      
      // Create room with current user and selected members
      const memberIds = selectedMembers.map(member => member._id)
      const allMembers = user?._id ? [user._id, ...memberIds] : memberIds
      
      const roomData = {
        name: formData.name.toLowerCase(),
        description: formData.description.trim() || undefined,
        members: allMembers,
        isPrivate: formData.isPrivate
      }

      await roomService.createRoom(roomData)
      
      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        isPrivate: false
      })
      setSelectedMembers([])
      setMemberSearch('')
      setSearchResults([])
      setIsOpen(false)
      onRoomCreated()
    } catch (error: unknown) {
      console.error('Error creating room:', error)
      // Handle axios-like error responses
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Failed to create room')
      } else {
        setError('Failed to create room')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setIsOpen(false)
    setFormData({
      name: '',
      description: '',
      isPrivate: false
    })
    setSelectedMembers([])
    setMemberSearch('')
    setSearchResults([])
    setError('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open) handleClose()
      else setIsOpen(open)
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="w-6 h-6 p-0 hover:bg-primary/10 hover:text-primary transition-colors">
          <Plus className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Hash className="w-5 h-5" />
            <span>Create New Room</span>
          </DialogTitle>
          <p className="text-sm text-muted-foreground">
            Set up a new channel for your team to collaborate
          </p>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              {error}
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="roomName">Room Name</Label>
            <Input
              id="roomName"
              placeholder="e.g. design-team, random"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              className="font-mono"
              required
            />
            <p className="text-xs text-muted-foreground">
              Room names must be lowercase and can contain dashes
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="What's this room about?"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              rows={3}
              className="resize-none"
            />
          </div>

          {/* Member Selection */}
          <div className="space-y-3">
            <Label>Add Members (Optional)</Label>
            
            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search for users to add..."
                value={memberSearch}
                onChange={(e) => handleMemberSearch(e.target.value)}
                className="pl-9"
              />
              {isSearching && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="border rounded-lg p-2 space-y-1 max-h-32 overflow-y-auto">
                {searchResults.map((searchUser) => (
                  <button
                    key={searchUser._id}
                    type="button"
                    onClick={() => handleAddMember(searchUser)}
                    className="w-full flex items-center space-x-3 p-2 rounded-md hover:bg-muted/50 transition-colors text-left"
                  >
                    <Avatar className="w-6 h-6">
                      <AvatarImage src={searchUser.profilePic} alt={searchUser.name} />
                      <AvatarFallback className="text-xs">
                        {searchUser.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{searchUser.name}</p>
                      <p className="text-xs text-muted-foreground truncate">@{searchUser.username}</p>
                    </div>
                    <Plus className="w-4 h-4 text-muted-foreground" />
                  </button>
                ))}
              </div>
            )}

            {/* Selected Members */}
            {selectedMembers.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Selected Members ({selectedMembers.length})</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedMembers.map((member) => (
                    <div
                      key={member._id}
                      className="flex items-center space-x-2 bg-muted/50 rounded-full pl-1 pr-3 py-1"
                    >
                      <Avatar className="w-5 h-5">
                        <AvatarImage src={member.profilePic} alt={member.name} />
                        <AvatarFallback className="text-xs">
                          {member.name.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <span className="text-xs font-medium">{member.name}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveMember(member._id)}
                        className="w-4 h-4 rounded-full bg-muted-foreground/20 hover:bg-destructive/20 hover:text-destructive transition-colors flex items-center justify-center"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-3">
            <Label>Privacy Settings</Label>
            <RadioGroup
              value={formData.isPrivate ? 'private' : 'public'}
              onValueChange={(value) => setFormData(prev => ({ ...prev, isPrivate: value === 'private' }))}
            >
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="public" id="public" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4" />
                    <Label htmlFor="public" className="font-medium cursor-pointer">Public</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Anyone in the workspace can join
                  </p>
                </div>
              </div>
              
              <div className="flex items-start space-x-3 p-3 rounded-lg border hover:bg-muted/20 transition-colors">
                <RadioGroupItem value="private" id="private" className="mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <Lock className="w-4 h-4" />
                    <Label htmlFor="private" className="font-medium cursor-pointer">Private</Label>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Only invited members can access
                  </p>
                </div>
              </div>
            </RadioGroup>
          </div>

          <div className="flex justify-end space-x-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !formData.name.trim()}
              className="min-w-[100px]"
            >
              {isLoading ? 'Creating...' : 'Create Room'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
