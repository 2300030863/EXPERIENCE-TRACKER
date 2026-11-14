import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import { Lock, Eye, EyeOff, KeyRound, ArrowLeft, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../services/api'

function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const token = searchParams.get('token')

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    if (!token) {
      toast.error('Invalid or missing reset token')
      navigate('/login')
    }
  }, [token, navigate])

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
    setErrorMessage('')
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (formData.newPassword !== formData.confirmPassword) {
      toast.error('Passwords do not match')
      return
    }

    if (formData.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setLoading(true)
    setErrorMessage('')

    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword: formData.newPassword
      })
      toast.success(response.data.message || 'Password reset successfully')
      setTimeout(() => {
        navigate('/login')
      }, 1500)
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Failed to reset password'
      setErrorMessage(errorMsg)
      toast.error(errorMsg)
    } finally {
      setLoading(false)
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
          Security Verification
        </span>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl shadow-slate-200/60 border border-slate-200/80 p-7 sm:p-9 relative z-10 transition-all">
        {/* Brand Icon Badge */}
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-600/25 mx-auto mb-4">
          <KeyRound className="w-7 h-7 stroke-[2.2]" />
        </div>

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Set New Password
          </h1>
          <p className="text-sm text-slate-500 mt-1.5">
            Choose a strong, unique password for your account
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

        <form className="space-y-4" onSubmit={handleSubmit}>
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
                type={showPassword ? 'text' : 'password'}
                required
                value={formData.newPassword}
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
            disabled={loading}
            className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm shadow-md shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-60 transition-all flex items-center justify-center gap-2 group cursor-pointer disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <RefreshCw size={16} className="animate-spin" />
                <span>Updating Password...</span>
              </>
            ) : (
              <>
                <ShieldCheck size={16} />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            Remember your password?{' '}
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-700 font-bold hover:underline transition-all"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default ResetPassword
