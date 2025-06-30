'use client'

import { useState } from 'react'
import { Settings, User, Bell, Palette, Shield, LogOut, Eye, EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { useAuthStore } from '@/stores/chat.store'
import { authService } from '@/services/auth.service'
import { userService } from '@/services/user.service'

interface SettingsModalProps {
  onUserUpdate?: () => void
}

export default function SettingsModal({ onUserUpdate }: SettingsModalProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [activeTab, setActiveTab] = useState('profile')
  const [isLoading, setIsLoading] = useState(false)
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const { user, logout } = useAuthStore()
  
  // Profile form state
  const [profileData, setProfileData] = useState({
    name: user?.name || '',
    username: user?.username || '',
    email: user?.email || '',
    bio: user?.bio || '',
    profilePic: user?.profilePic || ''
  })

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    messageNotifications: true,
    friendRequests: true,
    roomInvites: true,
    soundEnabled: true
  })

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: 'public',
    allowFriendRequests: true,
    showOnlineStatus: true
  })

  const handleProfileUpdate = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      if (!profileData.name.trim() || !profileData.username.trim()) {
        setError('Name and username are required')
        return
      }

      // Update profile
      const updatedUser = await userService.updateProfile({
        name: profileData.name.trim(),
        username: profileData.username.trim(),
        email: profileData.email.trim(),
        bio: profileData.bio.trim(),
        profilePic: profileData.profilePic.trim()
      })

      // Update the auth store with the new user data
      const { setUser } = useAuthStore.getState()
      setUser(updatedUser)

      setSuccess('Profile updated successfully!')
      onUserUpdate?.()
    } catch (error: unknown) {
      console.error('Error updating profile:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Failed to update profile')
      } else {
        setError('Failed to update profile')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handlePasswordChange = async () => {
    try {
      setIsLoading(true)
      setError('')
      setSuccess('')

      if (!passwordData.currentPassword || !passwordData.newPassword) {
        setError('All password fields are required')
        return
      }

      if (passwordData.newPassword !== passwordData.confirmPassword) {
        setError('New passwords do not match')
        return
      }

      if (passwordData.newPassword.length < 6) {
        setError('New password must be at least 6 characters long')
        return
      }

      // Change password
      await authService.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword
      })

      setSuccess('Password changed successfully!')
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error: unknown) {
      console.error('Error changing password:', error)
      if (error && typeof error === 'object' && 'response' in error) {
        const axiosError = error as { response?: { data?: { message?: string } } }
        setError(axiosError.response?.data?.message || 'Failed to change password')
      } else {
        setError('Failed to change password')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      setIsOpen(false)
    } catch (error) {
      console.error('Error logging out:', error)
    }
  }

  const resetForm = () => {
    setProfileData({
      name: user?.name || '',
      username: user?.username || '',
      email: user?.email || '',
      bio: user?.bio || '',
      profilePic: user?.profilePic || ''
    })
    setPasswordData({
      currentPassword: '',
      newPassword: '',
      confirmPassword: ''
    })
    setError('')
    setSuccess('')
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      setIsOpen(open)
      if (open) resetForm()
    }}>
      <DialogTrigger asChild>
        <Button size="sm" variant="ghost" className="w-8 h-8 p-0 hover:bg-muted/30 hover:backdrop-blur-sm transition-all">
          <Settings className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4 bg-muted/30 border border-border/50">
            <TabsTrigger value="profile" className="flex items-center space-x-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Profile</span>
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center space-x-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Shield className="w-4 h-4" />
              <span className="hidden sm:inline">Security</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center space-x-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Bell className="w-4 h-4" />
              <span className="hidden sm:inline">Notifications</span>
            </TabsTrigger>
            <TabsTrigger value="appearance" className="flex items-center space-x-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary">
              <Palette className="w-4 h-4" />
              <span className="hidden sm:inline">Appearance</span>
            </TabsTrigger>
          </TabsList>

          {/* Error/Success Messages */}
          {(error || success) && (
            <div className="mt-4">
              {error && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-red-500/10 to-red-600/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                    <span>{error}</span>
                  </div>
                </div>
              )}
              {success && (
                <div className="p-4 rounded-lg bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 text-green-600 dark:text-green-400 text-sm backdrop-blur-sm">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span>{success}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6 mt-6">
            <div className="space-y-4">
              <div className="flex flex-col items-center space-y-4">
                <div className="relative">
                  <Avatar className="w-24 h-24 border-4 border-primary/20">
                    <AvatarImage src={profileData.profilePic} alt={profileData.name} />
                    <AvatarFallback className="text-2xl bg-gradient-to-br from-primary/20 to-secondary/20">
                      {profileData.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="w-full max-w-sm space-y-2">
                  <Label htmlFor="profilePic">Profile Picture URL</Label>
                  <Input
                    id="profilePic"
                    value={profileData.profilePic}
                    onChange={(e) => setProfileData(prev => ({ ...prev, profilePic: e.target.value }))}
                    placeholder="https://example.com/image.jpg"
                    className="text-center"
                  />
                  <p className="text-xs text-muted-foreground text-center">
                    Enter a valid image URL
                  </p>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Display Name</Label>
                  <Input
                    id="name"
                    value={profileData.name}
                    onChange={(e) => setProfileData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Your display name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={profileData.username}
                    onChange={(e) => setProfileData(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="Your username"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={profileData.email}
                  onChange={(e) => setProfileData(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="your.email@example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={profileData.bio}
                  onChange={(e) => setProfileData(prev => ({ ...prev, bio: e.target.value }))}
                  placeholder="Tell others about yourself..."
                  rows={3}
                />
              </div>

              <Button 
                onClick={handleProfileUpdate} 
                disabled={isLoading} 
                className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
              >
                {isLoading ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6 mt-6">              <div className="space-y-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Change Password</h3>
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={passwordData.currentPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))}
                      placeholder="Enter current password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    >
                      {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={passwordData.newPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))}
                      placeholder="Enter new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                    >
                      {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={passwordData.confirmPassword}
                      onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))}
                      placeholder="Confirm new password"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 p-0"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    >
                      {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                </div>

                <Button 
                  onClick={handlePasswordChange} 
                  disabled={isLoading} 
                  className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 transition-all duration-200"
                >
                  {isLoading ? 'Changing...' : 'Change Password'}
                </Button>
              </div>

              <Separator />

              <div className="space-y-4">
                <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Privacy Settings</h3>
                
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Allow Friend Requests</p>
                      <p className="text-sm text-muted-foreground">Allow others to send you friend requests</p>
                    </div>
                    <Switch
                      checked={privacySettings.allowFriendRequests}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, allowFriendRequests: checked }))}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Show Online Status</p>
                      <p className="text-sm text-muted-foreground">Let others see when you&apos;re online</p>
                    </div>
                    <Switch
                      checked={privacySettings.showOnlineStatus}
                      onCheckedChange={(checked) => setPrivacySettings(prev => ({ ...prev, showOnlineStatus: checked }))}
                    />
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Notification Preferences</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Message Notifications</p>
                    <p className="text-sm text-muted-foreground">Get notified when you receive new messages</p>
                  </div>
                  <Switch
                    checked={notificationSettings.messageNotifications}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, messageNotifications: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Friend Requests</p>
                    <p className="text-sm text-muted-foreground">Get notified when someone sends you a friend request</p>
                  </div>
                  <Switch
                    checked={notificationSettings.friendRequests}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, friendRequests: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Room Invites</p>
                    <p className="text-sm text-muted-foreground">Get notified when you&apos;re invited to a room</p>
                  </div>
                  <Switch
                    checked={notificationSettings.roomInvites}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, roomInvites: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Sound Effects</p>
                    <p className="text-sm text-muted-foreground">Play sounds for notifications</p>
                  </div>
                  <Switch
                    checked={notificationSettings.soundEnabled}
                    onCheckedChange={(checked) => setNotificationSettings(prev => ({ ...prev, soundEnabled: checked }))}
                  />
                </div>
              </div>
            </div>
          </TabsContent>

          {/* Appearance Tab */}
          <TabsContent value="appearance" className="space-y-6 mt-6">
            <div className="space-y-4">
              <h3 className="text-lg font-semibold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent">Theme & Appearance</h3>
              <p className="text-sm text-muted-foreground">
                Theme settings are handled by your system preferences.
              </p>
              
              <div className="space-y-4">
                <div className="p-4 rounded-lg border bg-muted/20">
                  <h4 className="font-medium mb-2">Theme</h4>
                  <p className="text-sm text-muted-foreground">
                    The app automatically adapts to your system&apos;s light or dark mode preference.
                  </p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer Actions */}
        <div className="flex justify-between items-center pt-6 border-t border-border/50 bg-gradient-to-r from-card/50 to-card/30 -mx-6 -mb-6 px-6 pb-6 rounded-b-lg">
          <Button 
            variant="outline" 
            onClick={handleLogout} 
            className="flex items-center space-x-2 border-red-500/30 text-red-600 hover:bg-red-500/10 hover:border-red-500/50 transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout</span>
          </Button>
          
          <div className="text-xs text-muted-foreground font-medium">
            NoirChat v1.0.0
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
