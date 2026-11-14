import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { Eye, EyeOff, CreditCard, AlertCircle, ArrowLeft, ArrowRight, ShieldAlert, Lock, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import { useGoogleLogin } from '@react-oauth/google'

function Login() {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [googleLoading, setGoogleLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')
  const [isBlocked, setIsBlocked] = useState(false)
  const [countdown, setCountdown] = useState(10)
  const errorTimeoutRef = useRef(null)
  const countdownIntervalRef = useRef(null)
  
  const { login } = useAuth()
  const navigate = useNavigate()

  // Check for blocked state on mount
  useEffect(() => {
    const blockedData = sessionStorage.getItem('userBlocked')
    if (blockedData) {
      try {
        const { message, timestamp } = JSON.parse(blockedData)
        const elapsed = Math.floor((Date.now() - timestamp) / 1000)
        if (elapsed < 10) {
          setIsBlocked(true)
          setErrorMessage(message)
          setCountdown(10 - elapsed)
          startBlockedTimer(10 - elapsed)
        } else {
          sessionStorage.removeItem('userBlocked')
        }
      } catch (e) {
        sessionStorage.removeItem('userBlocked')
      }
    }
  }, [])

  // Cleanup timeouts on unmount
  useEffect(() => {
    return () => {
      if (errorTimeoutRef.current) {
        clearTimeout(errorTimeoutRef.current)
      }
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }
  }, [])

  const startBlockedTimer = (duration) => {
    let timeLeft = duration
    
    countdownIntervalRef.current = setInterval(() => {
      timeLeft -= 1
      setCountdown(timeLeft)
      if (timeLeft <= 0) {
        clearInterval(countdownIntervalRef.current)
      }
    }, 1000)
    
    errorTimeoutRef.current = setTimeout(() => {
      setErrorMessage('')
      setIsBlocked(false)
      setCountdown(10)
      sessionStorage.removeItem('userBlocked')
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current)
      }
    }, duration * 1000)
  }

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (isBlocked) {
      return false
    }
    
    if (errorTimeoutRef.current) {
      clearTimeout(errorTimeoutRef.current)
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current)
    }
    
    setLoading(true)
    setErrorMessage('')
    setIsBlocked(false)
    setCountdown(10)

    localStorage.setItem('lastUsername', formData.username)

    try {
      const result = await login(formData)
      if (result.success) {
        toast.success('Login successful!')
        navigate('/app/dashboard', { replace: true })
      } else {
        console.error('Login failed:', result.error)
        const errorMsg = typeof result.error === 'string' ? result.error : 'Login failed'
        setErrorMessage(errorMsg)
        
        if (!errorMsg.toLowerCase().includes('block')) {
          toast.error(errorMsg)
          setLoading(false)
        } else {
          setIsBlocked(true)
          setCountdown(10)
          setLoading(false)
          
          sessionStorage.setItem('userBlocked', JSON.stringify({
            message: errorMsg,
            timestamp: Date.now()
          }))
          
          startBlockedTimer(10)
        }
      }
    } catch (error) {
      const errorMsg = 'An unexpected error occurred'
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
      setLoading(false)
    }
    
    return false
  }

  // Bespoke Google OAuth Login
  const handleCustomGoogleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true)
      setErrorMessage('')
      try {
        // Fetch verified user profile with access token
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` },
        })
        const userInfo = await userInfoRes.json()

        if (!userInfo.email) {
          throw new Error('Google account did not return an email address')
        }

        const result = await login({
          email: userInfo.email,
          firstName: userInfo.given_name || userInfo.name || '',
          lastName: userInfo.family_name || '',
          isGoogleOAuth: true,
          googleToken: userInfo.sub || tokenResponse.access_token,
        })

        if (result.success) {
          toast.success('Login with Google successful!')
          navigate('/app/dashboard', { replace: true })
        } else {
          const errorMsg = typeof result.error === 'string' ? result.error : 'Google login failed'
          setErrorMessage(errorMsg)
          toast.error(errorMsg)
        }
      } catch (error) {
        console.error('Google login error:', error)
        const msg = error.message || 'Google login failed. Please try again.'
        setErrorMessage(msg)
        toast.error(msg)
      } finally {
        setGoogleLoading(false)
      }
    },
    onError: (err) => {
      console.error('Google OAuth error:', err)
      toast.error('Google login was cancelled or failed')
    },
  })

  // Blocked account screen
  if (isBlocked && errorMessage) {
    return (
      <div className="min-h-screen bg-slate-900/95 flex items-center justify-center p-4 relative overflow-hidden backdrop-blur-md">
        <div className="absolute -top-32 -left-32 w-80 h-80 bg-rose-600/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-32 -right-32 w-80 h-80 bg-orange-600/20 rounded-full blur-3xl pointer-events-none" />
        
        <div className="bg-white rounded-3xl shadow-2xl border border-rose-100 max-w-lg w-full p-6 sm:p-10 text-center relative z-10 animate-in fade-in zoom-in-95 duration-200">
          <div className="w-20 h-20 rounded-2xl bg-rose-50 border-2 border-rose-200/80 mx-auto flex items-center justify-center text-rose-600 shadow-inner mb-6">
            <ShieldAlert className="w-10 h-10 stroke-[2.2]" />
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mb-2">
            Access Temporarily Blocked
          </h1>
          <p className="text-sm text-slate-500 max-w-sm mx-auto mb-6">
            Our automated security system has placed a short hold on this account.
          </p>

          <div className="rounded-2xl bg-rose-50/80 border border-rose-200 p-4 sm:p-5 mb-6 text-left">
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-rose-900">
                  {errorMessage}
                </p>
                <p className="text-xs text-rose-700/80 mt-1">
                  Please reach out to your administrator if you believe this is in error.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl bg-slate-50 border border-slate-200 p-6 flex flex-col items-center justify-center">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Unlocking in
            </span>
            <div className="w-20 h-20 rounded-full bg-white border-4 border-rose-500 shadow-md flex items-center justify-center">
              <span className="text-3xl sm:text-4xl font-black text-rose-600 font-mono">
                {countdown}
              </span>
            </div>
            <span className="text-xs text-slate-400 mt-2 font-medium">
              Seconds remaining
            </span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/50 via-purple-50/30 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Pill */}
      <div className="w-full max-w-md mb-4 flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all group"
          title="Back to Home"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <span className="text-xs font-medium text-slate-400">
          Secure Portal
        </span>
      </div>

      {/* Main Login Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-9 relative z-10 overflow-hidden">
        {/* Brand Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 mx-auto mb-4">
          <CreditCard className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Welcome Back
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Sign in to access your financial ledger & analytics
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && !isBlocked && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-left animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Authentication Failed
              </h4>
              <p className="text-xs font-medium text-rose-700 mt-0.5">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Form */}
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label 
              htmlFor="username" 
              className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
            >
              Username or Email
            </label>
            <input
              id="username"
              name="username"
              type="text"
              required
              autoComplete="username email"
              value={formData.username}
              onChange={handleChange}
              placeholder="e.g. alex or alex@company.com"
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label 
                htmlFor="password" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700"
              >
                Password
              </label>
              <Link 
                to="/forgot-password" 
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your account password"
                className="w-full px-4 py-3 pr-11 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-1 rounded-lg focus:outline-none transition-colors"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4" />
                ) : (
                  <Eye className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || isBlocked || googleLoading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            {!loading && (
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            )}
          </button>

          {/* Unique Sleek Divider */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200/80" />
            </div>
            <div className="relative flex justify-center text-xs">
              <span className="bg-white px-3.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider text-slate-400 border border-slate-100 shadow-xs">
                or continue with
              </span>
            </div>
          </div>

          {/* Unique Full-Width Google Button */}
          <div>
            <button
              type="button"
              onClick={() => handleCustomGoogleLogin()}
              disabled={loading || isBlocked || googleLoading}
              className="w-full py-3 px-4 rounded-xl border border-slate-200/90 bg-white hover:bg-slate-50 text-slate-700 hover:text-slate-900 font-semibold text-sm shadow-xs hover:shadow-md hover:border-slate-300 transition-all flex items-center justify-center gap-3 active:scale-[0.99] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed group"
            >
              {googleLoading ? (
                <>
                  <RefreshCw size={18} className="animate-spin text-indigo-600" />
                  <span className="text-slate-600">Connecting Google...</span>
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 shrink-0 transition-transform group-hover:scale-105" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.8-2.4 3.66v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.15z" />
                    <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.27v3.14C3.26 21.26 7.34 24 12 24z" />
                    <path fill="#FBBC05" d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.59H1.27C.46 8.2.01 10.04.01 12c0 1.96.45 3.8 1.26 5.41l4.01-3.14z" />
                    <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.34 0 3.26 2.74 1.27 6.59l4.01 3.14c.95-2.83 3.6-4.98 6.72-4.98z" />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* Unique Two-Tone Footer Section */}
        <div className="mt-8 pt-4 pb-1 border-t border-slate-100 -mx-7 sm:-mx-9 -mb-7 sm:-mb-9 px-6 py-4 bg-slate-50/70 text-center flex items-center justify-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">
            Don't have an account?
          </span>
          <Link 
            to="/register" 
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            <span>Create account</span>
            <ArrowRight size={13} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default Login
