import React, { createContext, useContext, useState, useEffect } from 'react'
import { supabase, dbHelpers } from '../lib/supabase.js'

const AuthContext = createContext()

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [session, setSession] = useState(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        if (error) throw error
        
        setSession(session)
        
        if (session?.user) {
          await loadUserProfile(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email)
        
        setSession(session)
        
        if (session?.user) {
          await loadUserProfile(session.user)
        } else {
          setUser(null)
          setProfile(null)
        }
        
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const loadUserProfile = async (authUser) => {
    try {
      // Set basic user info from auth
      setUser(authUser)
      
      // Load extended profile from database
      const userProfile = await dbHelpers.getUserProfile(authUser.id)
      setProfile(userProfile)
    } catch (error) {
      console.error('Error loading user profile:', error)
      // If profile doesn't exist, create it
      try {
        await dbHelpers.upsertUserProfile(authUser.id, {
          email: authUser.email,
          subscription_tier: 'free',
          connected_social_accounts: { instagram: false, tiktok: false }
        })
        
        // Retry loading profile
        const userProfile = await dbHelpers.getUserProfile(authUser.id)
        setProfile(userProfile)
      } catch (createError) {
        console.error('Error creating user profile:', createError)
      }
    }
  }

  const signUp = async (email, password, options = {}) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            ...options
          }
        }
      })
      
      if (error) throw error
      
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Error signing up:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signIn = async (email, password) => {
    try {
      setLoading(true)
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) throw error
      
      return { user: data.user, session: data.session }
    } catch (error) {
      console.error('Error signing in:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      setUser(null)
      setProfile(null)
      setSession(null)
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email) => {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })
      if (error) throw error
    } catch (error) {
      console.error('Error resetting password:', error)
      throw error
    }
  }

  const updatePassword = async (newPassword) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })
      if (error) throw error
    } catch (error) {
      console.error('Error updating password:', error)
      throw error
    }
  }

  const updateProfile = async (updates) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      // Update profile in database
      const updatedProfile = await dbHelpers.upsertUserProfile(user.id, updates)
      setProfile(updatedProfile)
      
      return updatedProfile
    } catch (error) {
      console.error('Error updating profile:', error)
      throw error
    }
  }

  const connectSocialAccount = async (platform, accountData) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const currentAccounts = profile?.connected_social_accounts || {}
      const updatedAccounts = {
        ...currentAccounts,
        [platform]: {
          connected: true,
          ...accountData,
          connectedAt: new Date().toISOString()
        }
      }
      
      await updateProfile({
        connected_social_accounts: updatedAccounts
      })
      
      return updatedAccounts
    } catch (error) {
      console.error('Error connecting social account:', error)
      throw error
    }
  }

  const disconnectSocialAccount = async (platform) => {
    try {
      if (!user) throw new Error('No user logged in')
      
      const currentAccounts = profile?.connected_social_accounts || {}
      const updatedAccounts = {
        ...currentAccounts,
        [platform]: {
          connected: false,
          disconnectedAt: new Date().toISOString()
        }
      }
      
      await updateProfile({
        connected_social_accounts: updatedAccounts
      })
      
      return updatedAccounts
    } catch (error) {
      console.error('Error disconnecting social account:', error)
      throw error
    }
  }

  // Legacy method for backward compatibility
  const login = signIn
  const logout = signOut
  const updateUser = updateProfile

  const value = {
    // User state
    user,
    profile,
    session,
    loading,
    
    // Auth methods
    signUp,
    signIn,
    signOut,
    resetPassword,
    updatePassword,
    
    // Profile methods
    updateProfile,
    connectSocialAccount,
    disconnectSocialAccount,
    
    // Legacy methods (for backward compatibility)
    login,
    logout,
    updateUser,
    
    // Computed values
    isAuthenticated: !!user,
    subscriptionTier: profile?.subscription_tier || 'free',
    connectedAccounts: profile?.connected_social_accounts || {},
    hasActiveSubscription: profile?.subscriptions?.[0]?.status === 'active'
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
