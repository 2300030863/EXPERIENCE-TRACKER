import { useAuth } from '../contexts/AuthContext'
import { LogOut, User, Shield, Sparkles, CreditCard } from 'lucide-react'
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
    // Navigate after a small delay to ensure logout completes
    setTimeout(() => {
      navigate('/', { replace: true })
    }, 100)
  }

  const toggleDropdown = () => {
    console.log('Dropdown clicked, current state:', showDropdown)
    setShowDropdown(!showDropdown)
  }

  return (
    <header className="header-root">
      <div className="header-shimmer"></div>
      <div className="header-inner">
        <div className="header-left">
          {/* Logo on Left Side */}
          <Link
            to="/app/dashboard"
            className="header-brand-logo flex items-center gap-2 mr-1 sm:mr-2 flex-shrink-0 group"
            title="Expense Tracker"
          >
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-pink-500 flex items-center justify-center text-white shadow-md shadow-purple-500/25 group-hover:scale-105 active:scale-95 transition-all">
              <CreditCard size={18} className="text-white" />
            </div>
            <span className="font-extrabold text-sm sm:text-base tracking-tight bg-gradient-to-r from-purple-700 via-indigo-700 to-pink-600 bg-clip-text text-transparent hidden sm:inline lg:hidden">
              Expense Tracker
            </span>
          </Link>

          <Sparkles className="header-sparkle" />
          <h2 className="header-welcome">
            {t('header.welcomeBack')} <span className="header-username">{user?.firstName || user?.username}</span>!
          </h2>
          {isAdmin && (
            <span className="header-admin-badge">
              <Shield size={12} className="mr-1" />
              {t('header.admin')}
            </span>
          )}
        </div>
        
        <div className="header-right">
          {/* Language Switcher */}
          <LanguageSwitcher />

          {/* User Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={toggleDropdown}
              className="header-user-btn"
              type="button"
            >
              <div className={`header-avatar ${
                isAdmin 
                  ? 'bg-gradient-to-r from-purple-300 to-pink-300' 
                  : 'bg-gradient-to-r from-sky-300 to-purple-300'
              }`}>
                <User size={18} className="text-white" />
              </div>
              <span className="header-user-name">{user?.username}</span>
            </button>
            
            {showDropdown && (
              <div className="header-dropdown">
                <div className="header-dropdown-info">
                  <div className="font-semibold text-gray-700 mb-1">
                    {user?.firstName} {user?.lastName}
                  </div>
                  <div className="text-sm text-gray-500 break-all">
                    {user?.email}
                  </div>
                  {isAdmin && (
                    <div className="flex items-center text-purple-500 text-xs font-semibold mt-2">
                      <Shield size={10} className="mr-1" />
                      {t('header.administrator')}
                    </div>
                  )}
                </div>
                <button
                  onClick={handleLogout}
                  className="header-logout-btn"
                >
                  <LogOut size={16} className="mr-2" />
                  {t('header.signOut')}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .header-root {
          background: linear-gradient(to right, #f0f9ff, #faf5ff, #fdf2f8);
          backdrop-filter: blur(20px);
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
          border-bottom: 1px solid rgba(233, 213, 255, 0.5);
          position: relative;
          overflow: visible;
          z-index: 40;
        }

        .header-shimmer {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, transparent, rgba(255,255,255,0.3), transparent);
          pointer-events: none;
        }

        .header-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 4rem;
          padding: 0 1.5rem;
          position: relative;
          z-index: 10;
        }

        /* On mobile, standard padding */
        @media (max-width: 1023px) {
          .header-inner {
            padding-left: 1rem;
            padding-right: 1rem;
          }
        }

        @media (max-width: 480px) {
          .header-inner {
            padding-left: 0.75rem;
            padding-right: 0.75rem;
            gap: 0.5rem;
          }
        }

        .header-left {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          min-width: 0;
          flex: 1;
        }

        .header-sparkle {
          width: 1.25rem;
          height: 1.25rem;
          color: #fbbf24;
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
          flex-shrink: 0;
        }

        .header-welcome {
          font-size: 1.125rem;
          font-weight: 600;
          color: #374151;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          min-width: 0;
        }

        @media (max-width: 640px) {
          .header-welcome {
            font-size: 0.875rem;
          }
        }

        @media (max-width: 400px) {
          .header-welcome {
            display: none;
          }
          .header-sparkle {
            display: none;
          }
        }

        .header-username {
          background: linear-gradient(to right, #c084fc, #f472b6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          font-weight: 700;
        }

        .header-admin-badge {
          display: none;
          align-items: center;
          padding: 0.25rem 0.75rem;
          background: linear-gradient(to right, #d8b4fe, #f9a8d4);
          color: #6b21a8;
          font-size: 0.75rem;
          font-weight: 600;
          border-radius: 9999px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.05);
          flex-shrink: 0;
        }

        @media (min-width: 768px) {
          .header-admin-badge {
            display: inline-flex;
          }
        }

        .header-right {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          flex-shrink: 0;
        }

        @media (min-width: 640px) {
          .header-right {
            gap: 0.75rem;
          }
        }

        .header-user-btn {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.5rem;
          border-radius: 9999px;
          transition: all 0.3s ease;
          cursor: pointer;
          border: none;
          background: transparent;
        }

        .header-user-btn:hover {
          background: rgba(233, 213, 255, 0.5);
        }

        .header-user-btn:focus {
          outline: none;
          box-shadow: 0 0 0 2px #d8b4fe, 0 0 0 4px white;
        }

        .header-avatar {
          width: 2.5rem;
          height: 2.5rem;
          border-radius: 9999px;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
          transition: transform 0.3s ease;
          flex-shrink: 0;
        }

        @media (max-width: 480px) {
          .header-avatar {
            width: 2rem;
            height: 2rem;
          }
        }

        .header-avatar:hover {
          transform: scale(1.1);
        }

        .header-user-name {
          display: none;
          font-weight: 600;
          color: #4b5563;
        }

        @media (min-width: 768px) {
          .header-user-name {
            display: block;
          }
        }

        .header-dropdown {
          position: absolute;
          right: 0;
          margin-top: 0.5rem;
          width: 14rem;
          background: rgba(255,255,255,0.95);
          backdrop-filter: blur(20px);
          border-radius: 0.75rem;
          box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1);
          border: 1px solid rgba(233, 213, 255, 0.5);
          overflow: hidden;
          z-index: 9999;
          animation: fadeIn 0.2s ease-out;
        }

        .header-dropdown-info {
          padding: 1rem;
          border-bottom: 1px solid rgba(250, 245, 255, 0.8);
        }

        .header-logout-btn {
          display: flex;
          align-items: center;
          width: 100%;
          padding: 0.75rem 1rem;
          font-size: 0.875rem;
          color: #ef4444;
          font-weight: 600;
          transition: all 0.3s ease;
          border: none;
          background: transparent;
          cursor: pointer;
        }

        .header-logout-btn:hover {
          background: #fef2f2;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.5; }
        }
      `}</style>
    </header>
  )
}

export default Header
