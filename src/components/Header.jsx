import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Shield, CreditCard } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from './LanguageSwitcher'

function Header() {
  const { user, logout } = useAuth()
  const [showDropdown, setShowDropdown] = useState(false)
  const navigate = useNavigate()
  const dropdownRef = useRef(null)
  const { t } = useTranslation()
  
  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isOwner = user?.role === 'ROLE_OWNER'

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false)
      }
    }

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showDropdown])

  const handleLogout = () => {
    setShowDropdown(false)
    logout()
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 100)
  }

  const toggleDropdown = () => {
    setShowDropdown(!showDropdown)
  }

  const userInitial = user?.firstName?.[0] || user?.username?.[0] || 'U'

  return (
    <header className="h-16 bg-white border-b border-slate-200/90 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        {/* Logo on Left for small screens where sidebar is hidden */}
        <Link
          to="/app/dashboard"
          className="flex items-center gap-2 lg:hidden flex-shrink-0"
          title="Expense Tracker"
        >
          <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center font-bold shadow-xs">
            <CreditCard size={16} />
          </div>
          <span className="font-bold text-sm tracking-tight text-slate-900 hidden sm:inline">
            Expense Tracker
          </span>
        </Link>

        {/* Human greeting / context */}
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-sm text-slate-500 hidden sm:inline">
            {t('header.welcomeBack') || 'Welcome back,'}
          </span>
          <span className="text-sm font-semibold text-slate-900 truncate">
            {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
          </span>
          {(isAdmin || isOwner) && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
              <Shield size={11} className="text-slate-500" />
              <span>{isOwner ? 'Owner' : 'Admin'}</span>
            </span>
          )}
        </div>
      </div>
      
      <div className="flex items-center gap-3 flex-shrink-0">
        <LanguageSwitcher />

        {/* User Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={toggleDropdown}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-lg hover:bg-slate-100 border border-slate-200/80 transition-colors text-slate-700"
            type="button"
            aria-expanded={showDropdown}
          >
            <div className="w-7 h-7 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
              {userInitial}
            </div>
            <span className="text-xs font-semibold text-slate-700 hidden sm:inline max-w-[120px] truncate">
              {user?.username}
            </span>
          </button>
          
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-56 bg-white border border-slate-200 rounded-xl shadow-lg p-2 z-50 animate-fadeIn">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <div className="font-semibold text-sm text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
                </div>
                <div className="text-xs text-slate-500 truncate mt-0.5">
                  {user?.email}
                </div>
                {(isAdmin || isOwner) && (
                  <div className="inline-flex items-center gap-1 mt-1.5 text-[10px] font-semibold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                    <Shield size={10} />
                    <span>{isOwner ? 'System Owner' : 'Administrator'}</span>
                  </div>
                )}
              </div>
              <button
                onClick={handleLogout}
                className="w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition-colors text-left"
              >
                <LogOut size={14} />
                <span>{t('header.signOut') || 'Sign Out'}</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

export default Header
