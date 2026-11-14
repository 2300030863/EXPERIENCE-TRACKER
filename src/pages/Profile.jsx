import { useState, useEffect } from 'react'
import { profileAPI, occupationAPI } from '../services/api'
import { User, Mail, Lock, Save, Eye, EyeOff, Globe, Briefcase, Users, Shield, Sparkles, CheckCircle, KeyRound, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { COUNTRIES } from '../utils/currency'
import { useAuth } from '../contexts/AuthContext'

function Profile() {
  const { user } = useAuth()
  const [profile, setProfile] = useState({
    username: '',
    email: '',
    firstName: '',
    lastName: '',
    country: '',
    occupationId: null,
    isOAuthUser: false,
    userGroup: null
  })
  const [initialOccupationId, setInitialOccupationId] = useState(null)
  const [occupations, setOccupations] = useState([])
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)

  useEffect(() => {
    fetchProfile()
    fetchOccupations()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await profileAPI.get()
      const profileData = {
        ...profile,
        ...response.data,
        occupationId: response.data.occupationId || null,
        isOAuthUser: response.data.isOAuthUser || false
      }
      setProfile(profileData)
      setInitialOccupationId(response.data.occupationId || null)
    } catch (error) {
      console.error('Failed to load profile:', error)
      toast.error('Failed to load profile')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchOccupations = async () => {
    try {
      const response = await occupationAPI.getAll()
      setOccupations(response.data || [])
    } catch (error) {
      console.error('Failed to load occupations:', error)
      toast.error('Failed to load occupations')
    }
  }

  const handleProfileSubmit = async (e) => {
    e.preventDefault()
    
    if (saving) return
    setSaving(true)
    
    try {
      const occupationChanged = initialOccupationId !== profile.occupationId
      const hasNewOccupation = profile.occupationId !== null
      
      const updateResponse = await profileAPI.update(profile)
      const newProfile = {
        ...profile,
        ...updateResponse.data,
        occupationId: updateResponse.data.occupationId || null
      }
      setProfile(newProfile)
      
      if (occupationChanged && hasNewOccupation) {
        try {
          const loadingToast = toast.loading('Updating occupation categories...')
          await occupationAPI.updateUserOccupation(newProfile.occupationId)
          toast.dismiss(loadingToast)
          setInitialOccupationId(newProfile.occupationId)
          toast.success('Profile updated! Your categories have been refreshed based on your new occupation.', {
            duration: 5000
          })
        } catch (err) {
          console.error('Failed to update categories:', err)
          const errorMessage = err.response?.data?.message || 'Failed to update categories'
          toast.error(`Profile updated, but ${errorMessage}. Please try again.`)
        }
      } else {
        setInitialOccupationId(newProfile.occupationId)
        toast.success('Profile updated successfully!')
      }
      
      await fetchProfile()
    } catch (error) {
      console.error('Profile update error:', error)
      toast.error(error.response?.data?.message || 'Failed to update profile')
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error('New passwords do not match')
      return
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error('Password must be at least 6 characters long')
      return
    }

    setSaving(true)
    try {
      const requestData = {
        newPassword: passwordForm.newPassword
      }
      
      if (!profile.isOAuthUser || passwordForm.currentPassword) {
        requestData.currentPassword = passwordForm.currentPassword
      }
      
      await profileAPI.changePassword(requestData)
      
      if (profile.isOAuthUser) {
        toast.success('Password set successfully! You can now login with email and password.')
        setProfile({ ...profile, isOAuthUser: false })
      } else {
        toast.success('Password changed successfully')
      }
      
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      })
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to change password')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  const isOwner = user?.role === 'ROLE_OWNER'
  const isAdmin = user?.role === 'ROLE_ADMIN'
  const currentOccupation = occupations.find(o => o.id === profile.occupationId)

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white pb-16">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Profile Hero Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-sm border border-slate-200/80">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="flex items-center gap-5">
              <div className="relative">
                <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-3xl flex items-center justify-center text-white text-3xl sm:text-4xl font-black shadow-md ${
                  isOwner
                    ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                    : isAdmin
                    ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                    : 'bg-gradient-to-tr from-indigo-600 to-blue-600'
                }`}>
                  {profile.firstName ? profile.firstName.charAt(0).toUpperCase() : profile.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center text-white" title="Active">
                  <CheckCircle size={14} />
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
                    {profile.firstName || profile.lastName 
                      ? `${profile.firstName || ''} ${profile.lastName || ''}`.trim() 
                      : profile.username}
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-bold border ${
                    isOwner
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : isAdmin
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  }`}>
                    {isOwner ? '👑 System Owner' : isAdmin ? '🛡️ Administrator' : '👤 Member'}
                  </span>
                </div>

                <div className="flex items-center gap-3 text-xs sm:text-sm text-slate-500 mt-1.5 flex-wrap">
                  <span className="flex items-center gap-1 text-slate-700 font-medium">
                    <User size={14} className="text-slate-400" />
                    @{profile.username}
                  </span>
                  <span>•</span>
                  <span className="flex items-center gap-1 text-slate-700">
                    <Mail size={14} className="text-slate-400" />
                    {profile.email}
                  </span>
                  {profile.country && (
                    <>
                      <span>•</span>
                      <span className="flex items-center gap-1 text-slate-700">
                        <Globe size={14} className="text-slate-400" />
                        {profile.country}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Quick Status Chips */}
            <div className="flex flex-col sm:items-end gap-2 text-xs">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-semibold border ${
                profile.isOAuthUser
                  ? 'bg-blue-50 text-blue-700 border-blue-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              }`}>
                <Shield size={14} />
                <span>{profile.isOAuthUser ? 'Google OAuth Account' : 'Password Protected'}</span>
              </span>
              {currentOccupation && (
                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700 border border-slate-200 font-medium">
                  <Briefcase size={14} className="text-slate-500" />
                  <span>{currentOccupation.name}</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* 2-Column Profile Configuration Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Personal Information & Settings */}
          <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <User size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Personal & Regional Identity</h2>
                  <p className="text-xs text-slate-500">Manage account information, locale, and profession</p>
                </div>
              </div>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    value={profile.username || ''}
                    onChange={(e) => setProfile({ ...profile, username: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    value={profile.email || ''}
                    onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    First Name
                  </label>
                  <input
                    type="text"
                    value={profile.firstName || ''}
                    onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Last Name
                  </label>
                  <input
                    type="text"
                    value={profile.lastName || ''}
                    onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                    placeholder="Last name"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Country & Currency Display *
                </label>
                <select
                  value={profile.country || 'India'}
                  onChange={(e) => setProfile({ ...profile, country: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium"
                  required
                >
                  {COUNTRIES.map(country => (
                    <option key={country} value={country}>{country}</option>
                  ))}
                </select>
                <p className="mt-1 text-[11px] text-slate-400">
                  Controls your default currency symbol (e.g. ₹, $, €) across dashboards and ledgers.
                </p>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                    Occupation
                  </label>
                  {profile.userGroup && (
                    <span className="text-[10px] bg-indigo-50 text-indigo-700 border border-indigo-200 px-2 py-0.5 rounded-full font-bold">
                      Group Managed
                    </span>
                  )}
                </div>
                <select
                  value={profile.occupationId || ''}
                  onChange={(e) => setProfile({ ...profile, occupationId: e.target.value ? Number(e.target.value) : null })}
                  className="w-full px-3.5 py-2.5 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={profile.userGroup != null}
                >
                  <option value="">Select occupation (optional)</option>
                  {occupations && occupations.length > 0 ? (
                    occupations.map(occupation => (
                      <option key={occupation.id} value={occupation.id}>
                        {occupation.name}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>Loading occupations...</option>
                  )}
                </select>

                {profile.userGroup ? (
                  <div className="mt-2.5 p-3 bg-indigo-50/60 border border-indigo-100 rounded-xl flex items-start gap-2.5 text-xs text-indigo-900">
                    <Shield size={16} className="text-indigo-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Managed by Group Administrator</span>
                      <p className="text-indigo-700 text-[11px] mt-0.5">
                        Member of <strong className="font-semibold">{profile.userGroup.name || 'User Group'}</strong>. Categories synchronize automatically with your supervisor.
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-2.5 p-3 bg-amber-50/60 border border-amber-200/80 rounded-xl flex items-start gap-2.5 text-xs text-amber-900">
                    <Briefcase size={16} className="text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-bold block">Smart Occupation Categories</span>
                      <p className="text-amber-800 text-[11px] mt-0.5">
                        Selecting a profession automatically seeds tailored expense tags designed for your industry.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm shadow-sm shadow-indigo-600/20 transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Save size={16} />
                  )}
                  <span>Save Profile Changes</span>
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Security & Password Management */}
          <div className="lg:col-span-5 bg-white rounded-3xl p-6 sm:p-7 shadow-sm border border-slate-200/80 space-y-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <KeyRound size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">
                    {profile.isOAuthUser ? 'Set Account Password' : 'Change Password'}
                  </h2>
                  <p className="text-xs text-slate-500">Security credentials & authentication</p>
                </div>
              </div>
            </div>

            {profile.isOAuthUser && (
              <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-2xl flex items-start gap-2.5 text-xs text-blue-900">
                <Shield size={16} className="text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold block">Google OAuth Linked</span>
                  <p className="text-blue-700 text-[11px] mt-0.5">
                    Setting a password allows logging in with your email and password in addition to Google Sign-In.
                  </p>
                </div>
              </div>
            )}

            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              {!profile.isOAuthUser && (
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                    Current Password *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={passwordForm.currentPassword}
                      onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                      className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                      placeholder="Enter current password"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  New Password *
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    placeholder="Minimum 6 characters"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showNewPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                  Confirm New Password *
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                    className="w-full px-3.5 py-2.5 pr-10 text-sm bg-slate-50/70 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                    placeholder="Repeat new password"
                    minLength="6"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="w-full inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {saving ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  ) : (
                    <Lock size={16} />
                  )}
                  <span>{profile.isOAuthUser ? 'Set Password' : 'Confirm Password Update'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Profile
