import { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

const AuthContext = createContext()

// Auto logout after 5 minutes of inactivity or leaving the website
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000 // 5 minutes

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const isLoggingOutRef = useRef(false)

  const getLastActiveTime = () => {
    const saved = localStorage.getItem('last_active_time')
    return saved ? parseInt(saved, 10) : Date.now()
  }

  const setLastActiveTime = (time = Date.now()) => {
    localStorage.setItem('last_active_time', String(time))
  }

  const logout = (reason) => {
    if (isLoggingOutRef.current) return
    isLoggingOutRef.current = true

    localStorage.removeItem('token')
    localStorage.removeItem('last_active_time')
    setUser(null)

    if (reason === 'inactivity') {
      toast('Session expired due to 5 minutes of inactivity', {
        icon: '⏱️',
        duration: 5000,
      })
    }

    setTimeout(() => {
      isLoggingOutRef.current = false
    }, 1000)
  }

  // 1. Initial auth check with session expiry check
  useEffect(() => {
    const token = localStorage.getItem('token')
    const lastActive = getLastActiveTime()
    const now = Date.now()

    if (token) {
      // If user was away/closed site for longer than 5 minutes
      if (now - lastActive > INACTIVITY_TIMEOUT_MS) {
        console.log('Session expired due to inactivity (> 5 minutes)')
        localStorage.removeItem('token')
        localStorage.removeItem('last_active_time')
        setLoading(false)
        return
      }

      // Valid session within 5 mins, record active time and verify token
      setLastActiveTime(now)
      authAPI.verifyToken()
        .then(response => {
          setUser(response.data)
        })
        .catch((error) => {
          console.log('Token verification failed:', error)
          localStorage.removeItem('token')
          localStorage.removeItem('last_active_time')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  // 2. Track activity while logged in and auto-logout after 5 minutes of inactivity/leaving
  useEffect(() => {
    if (!user) return

    let lastRecorded = Date.now()
    setLastActiveTime(lastRecorded)

    // Throttled activity updater (at most once every 5 seconds to avoid performance degradation)
    const handleActivity = () => {
      const now = Date.now()
      if (now - lastRecorded > 5000) {
        lastRecorded = now
        setLastActiveTime(now)
      }
    }

    // Check if user left the site or was inactive for > 5 minutes
    const checkTimeout = () => {
      const lastActive = getLastActiveTime()
      const now = Date.now()
      if (now - lastActive >= INACTIVITY_TIMEOUT_MS) {
        console.log('Inactivity timeout reached (5 mins). Logging out...')
        logout('inactivity')
      }
    }

    // When tab visibility changes (user switches tabs, minimizes window, or navigates away)
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        checkTimeout()
      } else {
        // User switched away / left the tab
        setLastActiveTime(Date.now())
      }
    }

    // Sync across browser tabs
    const handleStorageChange = (e) => {
      if (e.key === 'token' && !e.newValue) {
        setUser(null)
      } else if (e.key === 'last_active_time' && e.newValue) {
        lastRecorded = parseInt(e.newValue, 10)
      }
    }

    // Event listeners for user interaction
    const activityEvents = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll', 'click']
    activityEvents.forEach(evt => window.addEventListener(evt, handleActivity, { passive: true }))

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('focus', checkTimeout)

    // Periodic heartbeat check every 10 seconds
    const intervalId = setInterval(checkTimeout, 10000)

    return () => {
      activityEvents.forEach(evt => window.removeEventListener(evt, handleActivity))
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('focus', checkTimeout)
      clearInterval(intervalId)
    }
  }, [user])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, role, isGroupMember, country, ...userData } = response.data
      
      localStorage.setItem('token', token)
      setLastActiveTime(Date.now())
      // Store user email for forgot password functionality
      if (userData.email) {
        localStorage.setItem('lastLoginEmail', userData.email)
      }
      setUser({ ...userData, role, isGroupMember, country })
      
      return { success: true }
    } catch (error) {
      console.error('Login error:', error)
      const status = error.response?.status
      const rawCode = error.response?.data?.code || (status ? String(status) : (error.code || '401'))
      const errorCodeDisplay = `Error Code: ${rawCode}`
      
      return { 
        success: false, 
        error: errorCodeDisplay,
        errorCode: rawCode,
        status: status || 401
      }
    }
  }

  const register = async (userData) => {
    try {
      const response = await authAPI.register(userData)
      const { token, role, isGroupMember, country, ...user } = response.data
      
      localStorage.setItem('token', token)
      setLastActiveTime(Date.now())
      // Store user email for forgot password functionality
      if (user.email) {
        localStorage.setItem('lastLoginEmail', user.email)
      }
      setUser({ ...user, role, isGroupMember, country })
      
      return { success: true }
    } catch (error) {
      console.error('Registration error:', error)
      const status = error.response?.status
      const rawCode = error.response?.data?.code || (status ? String(status) : (error.code || '400'))
      const errorCodeDisplay = `Error Code: ${rawCode}`
      
      return { 
        success: false, 
        error: errorCodeDisplay,
        errorCode: rawCode,
        status: status || 400
      }
    }
  }

  const value = {
    user,
    login,
    register,
    logout,
    loading
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}



