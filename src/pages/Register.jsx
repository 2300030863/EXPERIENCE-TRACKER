import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { authAPI } from '../services/api'
import { 
  Eye, 
  EyeOff, 
  CreditCard, 
  Globe, 
  Briefcase, 
  Mail, 
  ShieldCheck, 
  CheckCircle, 
  ArrowLeft, 
  ArrowRight, 
  Check, 
  User, 
  Sparkles,
  RefreshCw,
  Clock,
  AlertTriangle,
  Clipboard
} from 'lucide-react'
import toast from 'react-hot-toast'
import { COUNTRIES } from '../utils/currency'
import OccupationSelector from '../components/OccupationSelector'

function Register() {
  const [step, setStep] = useState(1) // Step 1: Email Verification, Step 2: Personal Info, Step 3: Occupation
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    country: 'India',
    occupationId: null
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  
  // OTP State
  const [otpSent, setOtpSent] = useState(false)
  const [otpValues, setOtpValues] = useState(['', '', '', '', '', ''])
  const [otpSending, setOtpSending] = useState(false)
  const [otpVerifying, setOtpVerifying] = useState(false)
  const [otpVerified, setOtpVerified] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [otpExpiryTime, setOtpExpiryTime] = useState(0) // 5-minute countdown in seconds
  const [otpError, setOtpError] = useState('')
  const otpRefs = useRef([])
  const cooldownRef = useRef(null)
  const expiryRef = useRef(null)
  
  const { register } = useAuth()
  const navigate = useNavigate()

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (cooldownRef.current) clearInterval(cooldownRef.current)
      if (expiryRef.current) clearInterval(expiryRef.current)
    }
  }, [])

  const startCooldown = () => {
    setResendCooldown(60)
    if (cooldownRef.current) clearInterval(cooldownRef.current)
    cooldownRef.current = setInterval(() => {
      setResendCooldown(prev => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current)
          return 0
        }
        return prev - 1
      })
    }, 1000)
  }

  // 5-minute (300 seconds) OTP expiration timer
  const startExpiryTimer = () => {
    setOtpExpiryTime(300)
    if (expiryRef.current) clearInterval(expiryRef.current)
    expiryRef.current = setInterval(() => {
      setOtpExpiryTime(prev => {
        if (prev <= 1) {
          clearInterval(expiryRef.current)
          setOtpError('Verification code expired (5-minute limit). Please click Resend to get a fresh code.')
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

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSendOtp = async () => {
    if (!formData.email) {
      toast.error('Please enter an email address first')
      return
    }
    setOtpSending(true)
    setOtpError('')
    try {
      const response = await authAPI.sendOtp(formData.email)
      const data = response.data || {}
      if (data.devOtp) {
        toast.success(`Verification code: ${data.devOtp}`, { duration: 10000 })
        const digits = data.devOtp.toString().split('').slice(0, 6)
        const newVals = ['', '', '', '', '', '']
        digits.forEach((d, i) => { newVals[i] = d })
        setOtpValues(newVals)
      } else {
        toast.success('Verification code sent! Code expires in 5 minutes.')
      }
      setOtpSent(true)
      startCooldown()
      startExpiryTimer()
      setTimeout(() => {
        if (otpRefs.current[0]) otpRefs.current[0].focus()
      }, 300)
    } catch (error) {
      const msg = error.response?.data?.message || error.response?.data || 'Failed to send verification code'
      toast.error(typeof msg === 'string' ? msg : 'Failed to send verification code')
    } finally {
      setOtpSending(false)
    }
  }

  const handleNextPersonalDetails = (e) => {
    e.preventDefault()
    
    // Validate step 2
    if (!formData.username || !formData.firstName || !formData.password) {
      toast.error('Please fill in all required fields')
      return
    }
    
    if (formData.username.length < 3) {
      toast.error('Username must be at least 3 characters long')
      return
    }
    
    if (formData.password.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    setStep(3)
  }

  // Web OTP API detection (for automatic OTP filling from Gmail / mobile)
  useEffect(() => {
    if (step !== 1 || otpVerified || !('OTPCredential' in window)) return

    const ac = new AbortController()
    navigator.credentials?.get({
      otp: { transport: ['email', 'sms'] },
      signal: ac.signal
    }).then(content => {
      if (content?.code) {
        const cleanCode = content.code.replace(/\D/g, '').slice(0, 6)
        if (cleanCode.length === 6) {
          setOtpValues(cleanCode.split(''))
          setOtpError('')
          toast.success('Code detected! Verifying...')
          verifyOtp(cleanCode)
        }
      }
    }).catch(() => {})

    return () => {
      try { ac.abort() } catch (_) {}
    }
  }, [step, otpVerified])

  // Window paste listener: if user copies from Gmail and pastes anywhere on the page
  useEffect(() => {
    if (step !== 1 || otpVerified) return

    const handleGlobalPaste = (e) => {
      const activeEl = document.activeElement
      const isInput = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA')
      const isOurOtpBox = otpRefs.current.includes(activeEl)
      if (isInput && !isOurOtpBox) return

      const text = (e.clipboardData || window.clipboardData)?.getData('text') || ''
      const cleanCode = text.replace(/\D/g, '').slice(0, 6)
      if (cleanCode.length === 6) {
        e.preventDefault()
        setOtpValues(cleanCode.split(''))
        setOtpError('')
        toast.success(`Pasted code ${cleanCode}! Verifying...`)
        verifyOtp(cleanCode)
      }
    }

    window.addEventListener('paste', handleGlobalPaste)
    return () => window.removeEventListener('paste', handleGlobalPaste)
  }, [step, otpVerified, otpExpiryTime])

  const handleOtpChange = (index, value) => {
    if (otpExpiryTime <= 0) {
      setOtpError('Verification code has expired. Please click Resend Code.')
      return
    }

    const digits = value.replace(/\D/g, '')
    if (digits.length > 1) {
      // Browser autofill or user paste into single box
      const newValues = [...otpValues]
      for (let i = 0; i < 6; i++) {
        newValues[i] = digits[i] || ''
      }
      setOtpValues(newValues)
      setOtpError('')
      const fullOtp = newValues.join('')
      if (fullOtp.length === 6) {
        verifyOtp(fullOtp)
      } else {
        const nextIdx = Math.min(digits.length, 5)
        otpRefs.current[nextIdx]?.focus()
      }
      return
    }

    const newValues = [...otpValues]
    newValues[index] = digits
    setOtpValues(newValues)
    setOtpError('')

    // Auto-focus next input
    if (digits && index < 5) {
      otpRefs.current[index + 1]?.focus()
    }

    // Auto-verify when all 6 digits entered
    const fullOtp = newValues.join('')
    if (fullOtp.length === 6) {
      verifyOtp(fullOtp)
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
      setOtpError('Verification code has expired. Please click Resend Code.')
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
      setOtpError('')
      const lastIndex = Math.min(cleanDigits.length, 6) - 1
      otpRefs.current[lastIndex]?.focus()
      if (cleanDigits.length === 6) {
        verifyOtp(cleanDigits)
      }
    }
  }

  const handlePasteClipboard = async () => {
    if (otpExpiryTime <= 0) {
      setOtpError('Verification code has expired. Please click Resend Code.')
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
        const newValues = cleanDigits.split('')
        setOtpValues(newValues)
        setOtpError('')
        toast.success(`Pasted code ${cleanDigits}! Verifying...`)
        verifyOtp(cleanDigits)
      } else if (cleanDigits.length > 0) {
        const newValues = ['', '', '', '', '', '']
        for (let i = 0; i < cleanDigits.length; i++) newValues[i] = cleanDigits[i]
        setOtpValues(newValues)
        setOtpError('')
        otpRefs.current[cleanDigits.length]?.focus()
      } else {
        toast.error('No 6-digit verification code found in clipboard')
      }
    } catch (err) {
      toast.error('Please tap and paste inside the box')
    }
  }

  const verifyOtp = async (otp) => {
    if (otpExpiryTime <= 0) {
      setOtpError('Verification code has expired. Please click Resend Code.')
      return
    }

    setOtpVerifying(true)
    setOtpError('')
    try {
      const response = await authAPI.verifyOtp(formData.email, otp)
      if (response.data.verified) {
        if (expiryRef.current) clearInterval(expiryRef.current)
        setOtpVerified(true)
        toast.success('Email verified successfully!')
        setTimeout(() => setStep(2), 1200)
      } else {
        setOtpError('Invalid verification code')
        setOtpValues(['', '', '', '', '', ''])
        otpRefs.current[0]?.focus()
      }
    } catch (error) {
      const msg = error.response?.data?.message || 'Invalid or expired code'
      setOtpError(typeof msg === 'string' ? msg : 'Invalid or expired code')
      setOtpValues(['', '', '', '', '', ''])
      otpRefs.current[0]?.focus()
    } finally {
      setOtpVerifying(false)
    }
  }

  const handleResendOtp = async () => {
    if (resendCooldown > 0) return
    setOtpSending(true)
    setOtpError('')
    setOtpValues(['', '', '', '', '', ''])
    try {
      const response = await authAPI.sendOtp(formData.email)
      const data = response.data || {}
      if (data.devOtp) {
        toast.success(`New verification code: ${data.devOtp}`, { duration: 10000 })
        const digits = data.devOtp.toString().split('').slice(0, 6)
        const newVals = ['', '', '', '', '', '']
        digits.forEach((d, i) => { newVals[i] = d })
        setOtpValues(newVals)
      } else {
        toast.success('New 5-minute code sent!')
      }
      startCooldown()
      startExpiryTimer()
      otpRefs.current[0]?.focus()
    } catch (error) {
      toast.error('Failed to resend code')
    } finally {
      setOtpSending(false)
    }
  }

  const handleSkip = async () => {
    await submitRegistration(null)
  }

  const handleOccupationSelect = (occupationId) => {
    setFormData({
      ...formData,
      occupationId
    })
  }

  const submitRegistration = async (occId = formData.occupationId) => {
    setLoading(true)

    try {
      const { confirmPassword, ...registerData } = formData
      const dataToSubmit = occId ? { ...registerData, occupationId: occId } : registerData
      
      const result = await register(dataToSubmit)
      
      if (result.success) {
        toast.success('Account created successfully!')
        navigate('/app/dashboard', { replace: true })
      } else {
        console.error('Registration failed:', result.error)
        toast.error(typeof result.error === 'string' ? result.error : 'Registration failed')
      }
    } catch (error) {
      console.error('Registration exception:', error)
      toast.error('An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    await submitRegistration()
  }

  const getStepTitle = () => {
    if (step === 1) return otpVerified ? 'Email Verified' : 'Verify Your Email'
    if (step === 2) return 'Personal Details'
    return 'Choose Your Occupation'
  }

  const getStepSubtitle = () => {
    if (step === 1) return otpVerified ? 'Redirecting to your account details...' : 'We will send a 6-digit verification code to your inbox (valid for 5 minutes)'
    if (step === 2) return 'Set up your account profile and currency preference'
    return 'We will generate personalized financial categories for your role'
  }

  return (
    <div className="min-h-screen bg-slate-50 relative flex flex-col justify-center items-center py-10 px-4 sm:px-6 lg:px-8 overflow-hidden selection:bg-indigo-500 selection:text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-indigo-100/50 via-purple-50/30 to-transparent blur-3xl pointer-events-none -z-10" />
      <div className="absolute -top-32 -right-32 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Navigation Pill */}
      <div className="w-full max-w-xl mb-4 flex justify-between items-center z-10">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white text-xs font-semibold text-slate-600 hover:text-indigo-600 shadow-sm border border-slate-200/80 hover:border-slate-300 transition-all group"
          title="Back to Home"
        >
          <ArrowLeft size={14} className="text-slate-400 group-hover:text-indigo-600 group-hover:-translate-x-0.5 transition-transform" />
          <span>Back to Home</span>
        </Link>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 text-indigo-700 text-xs font-semibold border border-indigo-100">
          <span>Step {step} of 3</span>
        </div>
      </div>

      {/* Main Register Card */}
      <div className="w-full max-w-xl bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-6 sm:p-9 relative z-10 transition-all overflow-hidden">
        {/* Step Progress Bar */}
        <div className="mb-8">
          <div className="grid grid-cols-3 gap-2 sm:gap-4 relative">
            {/* Step 1 Pill */}
            <div className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
              step === 1 ? 'bg-indigo-50/80 text-indigo-700' : step > 1 ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-sm transition-all ${
                step > 1 
                  ? 'bg-emerald-500 text-white' 
                  : step === 1 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 1 ? <Check size={14} className="stroke-[3]" /> : <Mail size={14} />}
              </div>
              <span className="text-[11px] font-bold tracking-tight">1. Verification</span>
            </div>

            {/* Step 2 Pill */}
            <div className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
              step === 2 ? 'bg-indigo-50/80 text-indigo-700' : step > 2 ? 'text-emerald-600' : 'text-slate-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-sm transition-all ${
                step > 2 
                  ? 'bg-emerald-500 text-white' 
                  : step === 2 
                    ? 'bg-indigo-600 text-white' 
                    : 'bg-slate-100 text-slate-400'
              }`}>
                {step > 2 ? <Check size={14} className="stroke-[3]" /> : <User size={14} />}
              </div>
              <span className="text-[11px] font-bold tracking-tight">2. Profile</span>
            </div>

            {/* Step 3 Pill */}
            <div className={`flex flex-col items-center text-center p-2 rounded-xl transition-all ${
              step === 3 ? 'bg-indigo-50/80 text-indigo-700' : 'text-slate-400'
            }`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs mb-1.5 shadow-sm transition-all ${
                step === 3 
                  ? 'bg-indigo-600 text-white' 
                  : 'bg-slate-100 text-slate-400'
              }`}>
                <Briefcase size={14} />
              </div>
              <span className="text-[11px] font-bold tracking-tight">3. Occupation</span>
            </div>
          </div>
          
          {/* Progress bar line */}
          <div className="mt-3 w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
            <div 
              className="bg-gradient-to-r from-indigo-600 to-purple-600 h-full transition-all duration-300 rounded-full"
              style={{ width: step === 1 ? '33.3%' : step === 2 ? '66.6%' : '100%' }}
            />
          </div>
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            {getStepTitle()}
          </h1>
          <p className="text-sm text-slate-500 mt-1.5 max-w-md mx-auto">
            {getStepSubtitle()}
          </p>
        </div>

        {/* STEP 1: Email Verification */}
        {step === 1 && (
          <div className="space-y-5 animate-in fade-in duration-200">
            <div>
              <label 
                htmlFor="email" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Work or Personal Email *
              </label>
              <div className="flex gap-2.5">
                <input
                  id="email"
                  name="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="name@company.com"
                  disabled={otpVerified || otpSending || otpSent}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white disabled:opacity-60 transition-all"
                />
                {!otpVerified && (
                  <button
                    type="button"
                    onClick={handleSendOtp}
                    disabled={otpSending || !formData.email || (resendCooldown > 0 && otpSent)}
                    className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-xs uppercase tracking-wider shadow-sm hover:shadow active:scale-[0.99] disabled:opacity-50 transition-all shrink-0 cursor-pointer disabled:cursor-not-allowed"
                  >
                    {otpSending ? (
                      <span className="flex items-center gap-1.5">
                        <RefreshCw size={13} className="animate-spin" />
                        Sending
                      </span>
                    ) : (resendCooldown > 0 && otpSent) ? (
                      `Wait ${resendCooldown}s`
                    ) : otpSent ? (
                      'Resend'
                    ) : (
                      'Send OTP'
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* OTP Input Section */}
            {otpSent && !otpVerified && (
              <div className="p-5 rounded-2xl bg-slate-50/80 border border-slate-200/80 animate-in fade-in duration-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Enter 6-Digit Code
                  </span>
                  
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

                <p className="text-xs text-slate-500 mb-3">
                  A 5-minute code was dispatched to <strong className="text-slate-700 font-semibold">{formData.email}</strong>.
                </p>

                <div className="flex justify-center gap-2 sm:gap-3 my-3">
                  {otpValues.map((val, idx) => (
                    <input
                      key={idx}
                      ref={el => (otpRefs.current[idx] = el)}
                      type="text"
                      inputMode="numeric"
                      pattern="[0-9]*"
                      maxLength={1}
                      value={val}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                      onPaste={handleOtpPaste}
                      disabled={otpVerifying || otpExpiryTime <= 0}
                      autoComplete="one-time-code"
                      className={`w-10 h-12 sm:w-12 sm:h-14 text-center text-xl font-bold font-mono rounded-xl border-2 transition-all focus:outline-none ${
                        otpError 
                          ? 'border-rose-400 bg-rose-50/50 text-rose-700' 
                          : val 
                            ? 'border-indigo-600 bg-indigo-50/30 text-indigo-900 shadow-sm' 
                            : 'border-slate-200 bg-white text-slate-900 focus:border-indigo-600 focus:ring-2 focus:ring-indigo-500/20'
                      }`}
                    />
                  ))}
                </div>

                {/* Quick Paste Code Action */}
                <div className="flex justify-center my-2">
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    disabled={otpVerifying || otpExpiryTime <= 0}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 hover:text-indigo-700 rounded-lg border border-indigo-200 transition-all cursor-pointer disabled:opacity-50"
                  >
                    <Clipboard size={13} />
                    <span>Paste Code from Clipboard</span>
                  </button>
                </div>

                {otpError && (
                  <p className="text-xs font-bold text-rose-600 text-center mt-2 animate-in fade-in">
                    {otpError}
                  </p>
                )}

                {otpVerifying && (
                  <div className="flex items-center justify-center gap-2 text-xs font-semibold text-indigo-600 mt-2">
                    <RefreshCw size={13} className="animate-spin" />
                    <span>Verifying code...</span>
                  </div>
                )}

                <div className="text-center mt-4 pt-3 border-t border-slate-200/60">
                  <p className="text-xs text-slate-500">
                    Didn't receive code or expired?{' '}
                    {resendCooldown > 0 ? (
                      <span className="font-semibold text-slate-700">Resend available in {resendCooldown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResendOtp}
                        disabled={otpSending}
                        className="font-bold text-indigo-600 hover:text-indigo-700 hover:underline cursor-pointer"
                      >
                        Resend New Code
                      </button>
                    )}
                  </p>
                </div>
              </div>
            )}

            {/* OTP Verified State */}
            {otpVerified && (
              <div className="p-6 rounded-2xl bg-emerald-50 border border-emerald-200 text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-7 h-7 stroke-[2.5]" />
                </div>
                <h4 className="text-sm font-bold text-emerald-900">
                  Email Verified Successfully
                </h4>
                <p className="text-xs text-emerald-700 mt-1">
                  Advancing to personal details...
                </p>
              </div>
            )}
          </div>
        )}

        {/* STEP 2: Personal Details */}
        {step === 2 && (
          <form className="space-y-4 animate-in fade-in duration-200" onSubmit={handleNextPersonalDetails}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label 
                  htmlFor="firstName" 
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  First Name *
                </label>
                <input
                  id="firstName"
                  name="firstName"
                  type="text"
                  required
                  value={formData.firstName}
                  onChange={handleChange}
                  placeholder="e.g. Alex"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>

              <div>
                <label 
                  htmlFor="lastName" 
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Last Name
                </label>
                <input
                  id="lastName"
                  name="lastName"
                  type="text"
                  value={formData.lastName}
                  onChange={handleChange}
                  placeholder="e.g. Morgan"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                />
              </div>
            </div>

            <div>
              <label 
                htmlFor="username" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                value={formData.username}
                onChange={handleChange}
                placeholder="Choose a unique handle (min 3 chars)"
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label 
                htmlFor="country" 
                className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
              >
                <span className="flex items-center gap-1.5">
                  <Globe size={14} className="text-slate-400" />
                  <span>Country of Residence *</span>
                </span>
              </label>
              <select
                id="country"
                name="country"
                required
                value={formData.country}
                onChange={handleChange}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1 font-medium">
                Used to determine default currency symbols across your ledger.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label 
                  htmlFor="password" 
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Password *
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Min 6 characters"
                    className="w-full px-4 py-2.5 pr-10 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-900 text-sm placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 focus:bg-white transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              <div>
                <label 
                  htmlFor="confirmPassword" 
                  className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5"
                >
                  Confirm Password *
                </label>
                <div className="relative">
                  <input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    required
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    placeholder="Repeat password"
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
            </div>

            <button
              type="submit"
              className="w-full mt-3 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] transition-all flex items-center justify-center gap-2 group cursor-pointer"
            >
              <span>Next: Customize Categories</span>
              <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
            </button>
          </form>
        )}

        {/* STEP 3: Occupation Selection */}
        {step === 3 && (
          <div className="space-y-6 animate-in fade-in duration-200">
            <OccupationSelector 
              onSelect={handleOccupationSelect}
              selectedOccupationId={formData.occupationId}
            />
            
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                disabled={loading}
                className="order-2 sm:order-1 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-50 font-semibold text-sm transition-all text-center cursor-pointer"
              >
                Back
              </button>
              
              <button
                type="button"
                onClick={handleSkip}
                disabled={loading}
                className="order-3 sm:order-2 flex-1 px-4 py-2.5 rounded-xl border border-slate-200 text-slate-500 hover:text-slate-800 hover:bg-slate-50 font-medium text-sm transition-all text-center cursor-pointer"
              >
                Skip for now
              </button>

              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading || !formData.occupationId}
                className="order-1 sm:order-3 flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 transition-all text-center cursor-pointer disabled:cursor-not-allowed"
              >
                {loading ? 'Creating...' : 'Create Account'}
              </button>
            </div>
          </div>
        )}

        {/* Two-Tone Footer on Step 1 */}
        {step === 1 && (
          <div className="mt-8 pt-4 pb-1 border-t border-slate-100 -mx-6 sm:-mx-9 -mb-6 sm:-mb-9 px-6 py-4 bg-slate-50/70 text-center flex items-center justify-center gap-1.5">
            <span className="text-xs text-slate-500 font-medium">
              Already have an account?
            </span>
            <Link 
              to="/login" 
              className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 transition-colors group"
            >
              <span>Sign in</span>
              <ArrowRight size={13} className="stroke-[2.5] group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </div>
        )}
      </div>
    </div>
  )
}

export default Register
