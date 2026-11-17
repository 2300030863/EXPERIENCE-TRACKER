import { useState, useEffect, useRef } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { 
  KeyRound, 
  Lock, 
  Unlock, 
  Mail, 
  AlertCircle, 
  CheckCircle2, 
  ArrowLeft, 
  ArrowRight, 
  Eye, 
  EyeOff, 
  RefreshCw,
  ShieldCheck,
  Clock,
  AlertTriangle,
  Clipboard 
} from 'lucide-react'
import toast from 'react-hot-toast'
import { authAPI } from '../services/api'

function ForgotPassword() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [identifier, setIdentifier] = useState('')
  const [isLocked, setIsLocked] = useState(false)
  const [lockedEmail, setLockedEmail] = useState('')
  const [lockedUsername, setLockedUsername] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [resetting, setResetting] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  // OTP State
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpExpiryTime, setOtpExpiryTime] = useState(0) // 5-minute countdown in seconds
  const otpRefs = useRef([])
  const cooldownRef = useRef(null)
  const expiryRef = useRef(null)

  // Password fields
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  // Auto-populate from last login
  useEffect(() => {
    const saved = localStorage.getItem('lastUsername')
    if (saved) {
      setIdentifier(saved)
    }
  }, [])

  // Auto-fill code, email, and synchronized timer from URL (e.g. from "Copy & Auto-Fill Code" in email)
  useEffect(() => {
    const urlCode = searchParams.get('code') || searchParams.get('otp')
    const urlIdentifier = searchParams.get('identifier') || searchParams.get('email') || searchParams.get('username')
    const urlExp = searchParams.get('exp') || searchParams.get('expiresAt')

    if (urlCode || urlIdentifier) {
      if (urlIdentifier) {
        const ident = urlIdentifier.trim()
        setIdentifier(ident)
        setLockedEmail(ident)
        setLockedUsername(ident)
        setIsLocked(true)
      } else if (urlCode) {
        setIsLocked(true)
      }

      // Synchronize exact real-time remaining countdown from expiration timestamp
      let remainingSeconds = 300
      if (urlExp) {
        const expTime = parseInt(urlExp, 10)
        if (!isNaN(expTime)) {
          remainingSeconds = Math.max(0, Math.floor((expTime - Date.now()) / 1000))
        }
      }

      // Start the live ticking countdown
      startExpiryTimer(remainingSeconds)
      startCooldown()

      if (urlCode) {
        const clean = urlCode.toString().trim()
        if (/^\d{6}$/.test(clean)) {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(clean).catch(() => {})
          }
          setOtpValues(clean.split(''))
          toast.success(`Verification code ${clean} auto-filled! Enter new password below.`)
        }
      }
    }
  }, [searchParams])

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      if (expiryRef.current) clearInterval(expiryRef.current)
    }
  }, [])

  const startCooldown = (initialCooldown = 60) => {
    setResendCooldown(initialCooldown)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // Live OTP expiration timer with custom start time in seconds
  const startExpiryTimer = (initialSeconds = 300) => {
    const startVal = Math.max(0, parseInt(initialSeconds, 10) || 300)
    setOtpExpiryTime(startVal)
    if (expiryRef.current) clearInterval(expiryRef.current)

    if (startVal <= 0) {
      setErrorMessage('Verification code expired (5-minute limit). Please click Resend Code to get a fresh code.')
      return
    }

    expiryRef.current = setInterval(() => {
      setOtpExpiryTime((prev) => {
        if (prev <= 1) {
          clearInterval(expiryRef.current)
          setErrorMessage('Verification code expired (5-minute limit). Please click Resend Code to get a fresh code.')
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Handle Find User & Send OTP
  const handleFindUserAndSendOtp = async (e) => {
    if (e) e.preventDefault()
    
    const query = identifier.trim()
    if (!query) {
      toast.error('Please enter your username or email address')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const response = await authAPI.forgotPassword(query)
      const data = response.data

      // User found in database! Lock the email/username and show OTP
      setIsLocked(true)
      setLockedEmail(data.email || query)
      setLockedUsername(data.username || query)

      if (data.devOtp) {
        toast.success(`Account located! Verification code: ${data.devOtp}`, { duration: 10000 })
        const digits = data.devOtp.toString().split('').slice(0, 6)
        const newVals = ['', '', '', '', '', '']
        digits.forEach((d, i) => { newVals[i] = d })
        setOtpValues(newVals)
      } else {
        toast.success(data.message || 'Account located! 5-minute verification code sent to your registered email.')
      }

      startCooldown(60)
      if (data.expiresAtTimestamp) {
        const remaining = Math.max(0, Math.floor((data.expiresAtTimestamp - Date.now()) / 1000))
        startExpiryTimer(remaining || 300)
      } else {
        startExpiryTimer(300)
      }

      // Focus first OTP field
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus()
      }, 300)
    } catch (error) {
      console.error('Forgot password lookup error:', error)
      const msg = error.response?.data?.error || error.response?.data?.message || 'User was not found. Please check your username or email.'
      setErrorMessage(msg)
      toast.error(msg)
      setIsLocked(false)
    } finally {
      setLoading(false)
    }
  }

  // Unlock to allow editing username/email again
  const handleUnlock = () => {
    setIsLocked(false)
    setOtpValues(['', '', '', '', '', ''])
    setNewPassword('')
    setConfirmPassword('')
    setErrorMessage('')
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    if (expiryRef.current) clearInterval(expiryRef.current)
    setResendCooldown(0)
    setOtpExpiryTime(0)
  }

  // Resend OTP
  const handleResendOtp = async () => {
    if (resendCooldown > 0 || loading) return
    setLoading(true)
    setErrorMessage('')
    setOtpValues(['', '', '', '', '', ''])

    try {
      const response = await authAPI.forgotPassword(lockedEmail || identifier)
      const data = response.data || {}
      if (data.devOtp) {
        toast.success(`New verification code: ${data.devOtp}`, { duration: 10000 })
        const digits = data.devOtp.toString().split('').slice(0, 6)
        const newVals = ['', '', '', '', '', '']
        digits.forEach((d, i) => { newVals[i] = d })
        setOtpValues(newVals)
      } else {
        toast.success('A new 5-minute verification code has been sent!')
      }
      startCooldown(60)
      if (data.expiresAtTimestamp) {
        const remaining = Math.max(0, Math.floor((data.expiresAtTimestamp - Date.now()) / 1000))
        startExpiryTimer(remaining || 300)
      } else {
        startExpiryTimer(300)
      }
      if (otpRefs.current[0]) otpRefs.current[0].focus()
    } catch (error) {
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to resend verification code'
      toast.error(msg)
      setErrorMessage(msg)
    } finally {
      setLoading(false)
    }
  }

  // Web OTP API detection (for automatic OTP filling from Gmail / mobile)
  useEffect(() => {
    if (!isLocked || !('OTPCredential' in window)) return

    const ac = new AbortController()
    navigator.credentials?.get({
      otp: { transport: ['email', 'sms'] },
      signal: ac.signal
    }).then(content => {
      if (content?.code) {
        const cleanCode = content.code.replace(/\D/g, '').slice(0, 6)
        if (cleanCode.length === 6) {
          setOtpValues(cleanCode.split(''))
          setErrorMessage('')
          toast.success('Code detected! Ready for password update.')
        }
      }
    }).catch(() => {})

    return () => {
      try { ac.abort() } catch (_) {}
    }
  }, [isLocked])

  // Window paste listener: if user copies from Gmail and pastes anywhere on the page
  useEffect(() => {
    if (!isLocked) return

    const handleGlobalPaste = (e) => {
      const activeEl = document.activeElement
      const isOtpInput = otpRefs.current.includes(activeEl)
      if (activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA') && !isOtpInput) {
        return
      }

      const text = (e.clipboardData || window.clipboardData)?.getData('text') || ''
      const cleanCode = text.replace(/\D/g, '').slice(0, 6)
      if (cleanCode.length === 6) {
        e.preventDefault()
        setOtpValues(cleanCode.split(''))
        setErrorMessage('')
        toast.success(`Pasted code ${cleanCode}!`)
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [isLocked, otpExpiryTime])

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    if (otpExpiryTime <= 0) {
      setErrorMessage('Verification code has expired. Please click Resend Code to request a new one.')
      return
    }

    const digits = value.replace(/\D/g, '')
    if (digits.length > 1) {
      // Browser autofilled or user pasted multi-digit OTP into one box
      const newValues = [...otpValues]
      for (let i = 0; i < 6; i++) {
        newValues[i] = digits[i] || ''
      }
      setOtpValues(newValues)
      setErrorMessage('')
      const nextIdx = Math.min(digits.length, 5)
      otpRefs.current[nextIdx]?.focus()
      return
    }

    const newValues = [...otpValues]
    newValues[index] = digits
    setOtpValues(newValues)
    setErrorMessage('')

    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }
  }

  const handleOtpKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otpValues[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  const handleOtpPaste = (e) => {
    e.preventDefault()
    if (otpExpiryTime <= 0) {
      setErrorMessage('Verification code has expired. Please click Resend Code to request a new one.')
      return
    }
    const paste = (e.clipboardData || window.clipboardData)?.getData('text') || ''
    const cleanDigits = paste.replace(/\D/g, '').slice(0, 6)
    if (cleanDigits.length > 0) {
      const newValues = ['', '', '', '', '', '']
      for (let i = 0; i < cleanDigits.length; i++) {
        newValues[i] = cleanDigits[i]
      }
      setOtpValues(newValues)
      setErrorMessage('')
      const lastIndex = Math.min(cleanDigits.length, 6) - 1
      otpRefs.current[lastIndex]?.focus()
    }
  }

  const handlePasteClipboard = async () => {
    if (otpExpiryTime <= 0) {
      setErrorMessage('Verification code has expired. Please click Resend Code to request a new one.')
      return
    }
    try {
      if (!navigator.clipboard?.readText) {
        toast.error('Clipboard access not supported. Please paste directly into the box.')
        return
      }
      const text = await navigator.clipboard.readText()
      const cleanDigits = text.replace(/\D/g, '').slice(0, 6)
      if (cleanDigits.length === 6) {
        setOtpValues(cleanDigits.split(''))
        setErrorMessage('')
        toast.success(`Pasted code ${cleanDigits}!`)
      } else if (cleanDigits.length > 0) {
        const newValues = ['', '', '', '', '', '']
        for (let i = 0; i < cleanDigits.length; i++) newValues[i] = cleanDigits[i]
        setOtpValues(newValues)
        setErrorMessage('')
        otpRefs.current[cleanDigits.length]?.focus()
      } else {
        toast.error('No 6-digit verification code found in clipboard')
      }
    } catch (err) {
      toast.error('Please tap and paste inside the box')
    }
  }

  // Submit Password Reset
  const handleResetPassword = async (e) => {
    e.preventDefault()

    if (otpExpiryTime <= 0) {
      toast.error('Verification code has expired. Please click Resend Code.')
      setErrorMessage('Verification code has expired (5-minute limit). Please click Resend Code to receive a fresh code.')
      return
    }

    const otp = otpValues.join('').trim()

    if (otp.length < 6) {
      toast.error('Please enter the full 6-digit verification code')
      return
    }

    if (!newPassword) {
      toast.error('Please enter a new password')
      return
    }

    if (newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    if (newPassword !== confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setResetting(true)
    setErrorMessage('')

    try {
      await authAPI.resetPassword({
        email: lockedEmail || identifier,
        otp,
        newPassword
      })

      if (expiryRef.current) clearInterval(expiryRef.current)
      toast.success('Password has been reset successfully! Redirecting to login...')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      console.error('Reset password error:', error)
      const msg = error.response?.data?.error || error.response?.data?.message || 'Failed to reset password. Please check your code.'
      setErrorMessage(msg)
      toast.error(msg)
    } finally {
      setResetting(false)
    }
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
          to="/login"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all group"
          title="Back to Login"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Login</span>
        </Link>
        <span className="text-xs font-medium text-slate-400">
          Account Recovery
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-9 relative z-10 transition-all overflow-hidden">
        {/* Brand Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 mx-auto mb-4">
          <KeyRound className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {isLocked ? 'Enter Verification Code' : 'Forgot Password'}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            {isLocked 
              ? 'We sent a 5-minute code to your registered email' 
              : 'Enter your username or email to locate your account'}
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-2xl bg-rose-50 border border-rose-200/80 flex items-start gap-3 text-left animate-in fade-in duration-150">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-xs font-bold uppercase tracking-wider text-rose-800">
                Action Required
              </h4>
              <p className="text-xs font-medium text-rose-700 mt-0.5">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* STEP 1: Search and Lock Email */}
        {!isLocked ? (
          <form className="space-y-4" onSubmit={handleFindUserAndSendOtp}>
            <div>
              <label 
                htmlFor="identifier" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username or Registered Email *
              </label>
              <div className="relative">
                <input
                  id="identifier"
                  name="identifier"
                  type="text"
                  required
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="e.g. alex or alex@company.com"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
              <p className="text-[11px] text-slate-400 mt-1.5">
                We will verify your account in the database and dispatch a 5-minute one-time code.
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Checking database...</span>
                </>
              ) : (
                <>
                  <span>Find Account & Send OTP</span>
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </>
              )}
            </button>
          </form>
        ) : (
          /* STEP 2: Email Locked + Direct OTP with 5-Min Expiry + New Password */
          <form className="space-y-4 animate-in fade-in duration-200" onSubmit={handleResetPassword}>
            {/* Locked Email Indicator */}
            <div className="p-3.5 rounded-2xl bg-slate-100/90 border border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                  <Lock size={15} className="stroke-[2.5]" />
                </div>
                <div className="truncate">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">
                      Account Verified
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-slate-800 truncate mt-0.5" title={lockedEmail}>
                    {lockedEmail}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={handleUnlock}
                className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1 rounded-lg hover:bg-white transition-colors shrink-0 flex items-center gap-1 cursor-pointer"
                title="Change username or email"
              >
                <Unlock size={12} />
                <span>Change</span>
              </button>
            </div>

            {/* 6-Digit OTP Section with 5-Minute Countdown */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                  Verification Code *
                </label>

                {/* Live 5-Minute Countdown Badge */}
                {otpExpiryTime > 0 ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-semibold">
                    <Clock size={12} className="animate-pulse text-amber-600" />
                    <span>Expires in <strong className="font-mono font-bold text-amber-800">{formatTime(otpExpiryTime)}</strong></span>
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold animate-pulse">
                    <AlertTriangle size={12} />
                    <span>Code Expired</span>
                  </span>
                )}
              </div>

              <div className="flex justify-center gap-2 my-2">
                {otpValues.map((val, idx) => (
                  <input
                    key={idx}
                    ref={(el) => (otpRefs.current[idx] = el)}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={1}
                    value={val}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                    onPaste={handleOtpPaste}
                    disabled={resetting || otpExpiryTime <= 0}
                    autoComplete="one-time-code"
                    className={`w-10 h-12 text-center text-xl font-bold font-mono rounded-xl border-2 transition-all focus:outline-none ${
                      val 
                        ? 'border-indigo-600 bg-indigo-50/40 text-indigo-900 shadow-sm' 
                        : 'border-slate-200 bg-slate-50/50 text-slate-900 focus:border-indigo-600 focus:bg-white focus:ring-2 focus:ring-indigo-500/20'
                    }`}
                  />
                ))}
              </div>

              {/* Paste Code Button */}
              <div className="flex justify-center mb-3">
                <button
                  type="button"
                  onClick={handlePasteClipboard}
                  disabled={resetting || otpExpiryTime <= 0}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                >
                  <Clipboard size={13} />
                  <span>Paste Code from Clipboard</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-500 mt-2 px-1">
                <span>Didn't receive code?</span>
                {resendCooldown > 0 ? (
                  <span className="font-medium text-slate-400">
                    Resend in {resendCooldown}s
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                  >
                    Resend Code
                  </button>
                )}
              </div>
            </div>

            {/* New Password */}
            <div>
              <label 
                htmlFor="newPassword" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                New Password *
              </label>
              <div className="relative">
                <input
                  id="newPassword"
                  name="newPassword"
                  type={showNewPassword ? 'text' : 'password'}
                  required
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Min 6 characters"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showNewPassword ? 'Hide password' : 'Show password'}
                >
                  {showNewPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div>
              <label 
                htmlFor="confirmPassword" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Confirm New Password *
              </label>
              <div className="relative">
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter new password"
                  className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={resetting || (isLocked && otpExpiryTime <= 0)}
              className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
            >
              {resetting ? (
                <>
                  <RefreshCw size={16} className="animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : otpExpiryTime <= 0 ? (
                <>
                  <AlertTriangle size={16} />
                  <span>Code Expired — Resend to Continue</span>
                </>
              ) : (
                <>
                  <ShieldCheck size={16} />
                  <span>Reset Password</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* Two-Tone Footer */}
        <div className="mt-8 pt-4 pb-1 border-t border-slate-100 -mx-7 sm:-mx-9 -mb-7 sm:-mb-9 px-6 py-4 bg-slate-50/70 text-center flex items-center justify-center gap-1.5">
          <span className="text-xs text-slate-500 font-medium">
            Remember your credentials?
          </span>
          <Link 
            to="/login" 
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group"
          >
            <span>Sign in now</span>
            <ArrowRight size={13} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  )
}

export default ForgotPassword
