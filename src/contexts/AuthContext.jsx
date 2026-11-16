import { createContext, useContext, useState, useEffect } from 'react'
import { authAPI } from '../services/api'

const AuthContext = createContext()

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
  
  console.log('AuthProvider rendering, loading:', loading, 'user:', user)

  useEffect(() => {
    const token = localStorage.getItem('token')
    if (token) {
      // Verify token and get user info
      authAPI.verifyToken()
        .then(response => {
          setUser(response.data)
        })
        .catch((error) => {
          console.log('Token verification failed:', error)
          localStorage.removeItem('token')
        })
        .finally(() => {
          setLoading(false)
        })
    } else {
      setLoading(false)
    }
  }, [])

  const login = async (credentials) => {
    try {
      const response = await authAPI.login(credentials)
      const { token, role, isGroupMember, country, ...userData } = response.data
      
      localStorage.setItem('token', token)
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

  const logout = () => {
    localStorage.removeItem('token')
    // Keep lastLoginEmail for forgot password, only remove on explicit user request
    setUser(null)
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



