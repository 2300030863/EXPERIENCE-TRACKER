import { NavLink } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Tag, 
  Wallet, 
  Target, 
  BarChart3,
  Repeat,
  User,
  Menu,
  X,
  Shield,
  Crown,
  LogOut
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTranslation } from 'react-i18next'

const userNavItems = [
  { key: 'nav.dashboard',    href: '/app/dashboard',             icon: Home },
  { key: 'nav.transactions', href: '/app/transactions',           icon: CreditCard },
  { key: 'nav.recurring',    href: '/app/recurring-transactions', icon: Repeat },
  { key: 'nav.categories',   href: '/app/categories',             icon: Tag },
  { key: 'nav.accounts',     href: '/app/accounts',               icon: Wallet },
  { key: 'nav.budgets',      href: '/app/budgets',                icon: Target },
  { key: 'nav.reports',      href: '/app/reports',                icon: BarChart3 },
  { key: 'nav.profile',      href: '/app/profile',                icon: User },
]

const adminNavItems = [
  { key: 'nav.adminDashboard', href: '/app/admin', icon: Shield },
]

const ownerNavItems = [
  { key: 'nav.ownerDashboard', href: '/app/owner', icon: Crown },
]

function Sidebar({ isOpen: propIsOpen, setIsOpen: propSetIsOpen }) {
  const [localIsOpen, setLocalIsOpen] = useState(false)
  const isOpen = propIsOpen !== undefined ? propIsOpen : localIsOpen
  const setIsOpen = propSetIsOpen || setLocalIsOpen
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  
  const isOwner = user?.role === 'ROLE_OWNER'
  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isGroupMember = user?.isGroupMember
  
  // Build navigation based on role
  let navigation = [...userNavItems]
  
  // Remove budgets and recurring transactions for group members only (admins and owners can see all)
  if (isGroupMember && !isAdmin && !isOwner) {
    navigation = navigation.filter(item => item.key !== 'nav.budgets' && item.key !== 'nav.recurring')
  }
  
  if (isOwner) {
    navigation = [...ownerNavItems, ...navigation]
  } else if (isAdmin) {
    navigation = [...adminNavItems, ...navigation]
  }

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`modern-sidebar ${isOpen ? 'sidebar-open' : 'sidebar-closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <div className="sidebar-logo-icon">
              <CreditCard size={24} />
            </div>
            <h1 className="sidebar-title">Expense Tracker</h1>
          </div>
          <button 
            className="sidebar-close-btn"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {/* Mobile User Profile Summary in Drawer */}
          <div className="lg:hidden mb-4 p-3.5 bg-gradient-to-r from-purple-500/10 via-pink-500/10 to-blue-500/10 rounded-2xl border border-purple-200/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm shadow-sm flex-shrink-0">
                {user?.firstName?.[0] || user?.username?.[0] || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <div className="font-bold text-sm text-gray-800 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
                </div>
                <div className="text-xs text-gray-500 truncate">{user?.email}</div>
              </div>
            </div>
            <div className="mt-2.5 pt-2 border-t border-purple-200/40 flex items-center justify-between text-xs">
              <span className="font-semibold text-purple-700">
                {isOwner ? '👑 Owner' : isAdmin ? '🛡️ Admin' : '👤 User'}
              </span>
              <span className="text-[11px] text-gray-500 font-medium">All Navigation</span>
            </div>
          </div>

          <div className="sidebar-section-header">
            <span>Menu Options</span>
            <span className="text-[10px] bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full font-bold">{navigation.length}</span>
          </div>

          <ul className="sidebar-menu">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <li key={item.key}>
                  <NavLink
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`
                    }
                  >
                    <Icon size={20} className="sidebar-icon" />
                    <span>{t(item.key)}</span>
                  </NavLink>
                </li>
              )
            })}
          </ul>

          {/* Mobile Drawer Quick Actions */}
          <div className="lg:hidden mt-6 pt-4 pb-6 border-t border-gray-100 space-y-2">
            <button
              onClick={() => {
                setIsOpen(false)
                logout()
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-red-600 bg-red-50 hover:bg-red-100 active:scale-95 text-xs font-semibold transition-all border border-red-200/60"
            >
              <LogOut size={16} />
              <span>{t('header.signOut') || 'Sign Out'}</span>
            </button>
          </div>
        </nav>
      </div>

      <style>{`
        .sidebar-overlay {
          display: block;
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.45);
          backdrop-filter: blur(8px);
          z-index: 55;
          animation: overlayFadeIn 0.3s ease-out;
        }

        @media (min-width: 1024px) {
          .sidebar-overlay {
            display: none;
          }
        }

        @keyframes overlayFadeIn {
          from { opacity: 0; backdrop-filter: blur(0px); }
          to { opacity: 1; backdrop-filter: blur(8px); }
        }

        .modern-sidebar {
          position: fixed;
          inset-y: 0;
          left: 0;
          z-index: 60;
          width: 18rem;
          max-width: 86vw;
          background: rgba(255, 255, 255, 0.95);
          backdrop-filter: blur(24px) saturate(180%);
          box-shadow: 10px 0 40px rgba(0, 0, 0, 0.12);
          border-right: 1px solid rgba(255, 255, 255, 0.8);
          transform: translateX(-100%);
          transition: transform 0.35s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .sidebar-section-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.72rem;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          color: #94a3b8;
          font-weight: 700;
          margin-bottom: 0.6rem;
          padding: 0 0.5rem;
        }

        .sidebar-open {
          transform: translateX(0);
        }

        @media (min-width: 1024px) {
          .modern-sidebar {
            position: static;
            transform: translateX(0);
            width: 16rem;
            background: rgba(255, 255, 255, 0.6);
            border-right: 1px solid rgba(255, 255, 255, 0.5);
            box-shadow: 1px 0 0 rgba(0, 0, 0, 0.03);
          }
        }

        .sidebar-header {
          height: calc(5rem + env(safe-area-inset-top, 0px));
          padding-top: env(safe-area-inset-top, 0px);
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-left: 1.25rem;
          padding-right: 1rem;
          background: transparent;
          position: relative;
          border-bottom: 1px solid rgba(0, 0, 0, 0.05);
        }

        .sidebar-close-btn {
          background: rgba(0, 0, 0, 0.04);
          border: none;
          color: #64748b;
          cursor: pointer;
          padding: 0.4rem;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 10;
          transition: all 0.3s ease;
        }

        .sidebar-close-btn:hover {
          background: rgba(239, 68, 68, 0.1);
          color: #ef4444;
          transform: scale(1.1) rotate(90deg);
        }

        @media (min-width: 1024px) {
          .sidebar-close-btn {
            display: none;
          }
        }

        .sidebar-logo {
          display: flex;
          align-items: center;
          gap: 0.875rem;
          position: relative;
          z-index: 1;
        }

        .sidebar-logo-icon {
          width: 2.75rem;
          height: 2.75rem;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
          position: relative;
        }
        
        .sidebar-logo-icon::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          box-shadow: inset 0 2px 4px rgba(255, 255, 255, 0.3);
        }

        .sidebar-title {
          font-size: 1.2rem;
          font-weight: 800;
          background: linear-gradient(135deg, #475569 0%, #1e293b 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          letter-spacing: -0.02em;
        }

        .sidebar-nav {
          margin-top: 1rem;
          padding: 0 1rem;
          height: calc(100% - 5rem - env(safe-area-inset-top, 0px));
          overflow-y: auto;
          padding-bottom: env(safe-area-inset-bottom, 1.5rem);
        }
        
        .sidebar-nav::-webkit-scrollbar {
          width: 4px;
        }
        
        .sidebar-nav::-webkit-scrollbar-track {
          background: transparent;
        }
        
        .sidebar-nav::-webkit-scrollbar-thumb {
          background: rgba(0, 0, 0, 0.1);
          border-radius: 10px;
        }

        .sidebar-menu {
          display: flex;
          flex-direction: column;
          gap: 0.35rem;
          padding: 0;
          margin: 0;
          list-style: none;
        }

        .sidebar-link {
          display: flex;
          align-items: center;
          padding: 0.85rem 1.15rem;
          font-size: 0.95rem;
          font-weight: 600;
          border-radius: 12px;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: #64748b;
          text-decoration: none;
          position: relative;
          background: transparent;
        }

        .sidebar-link::before {
          content: '';
          position: absolute;
          left: -0.5rem;
          top: 15%;
          height: 70%;
          width: 4px;
          background: linear-gradient(to bottom, #667eea, #764ba2);
          border-radius: 4px;
          opacity: 0;
          transform: scaleY(0);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }

        .sidebar-link:hover {
          background: rgba(255, 255, 255, 0.8);
          color: #334155;
          transform: translateX(4px);
        }

        .sidebar-link-active {
          background: #ffffff;
          color: #667eea;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.03), 0 1px 2px rgba(0, 0, 0, 0.02);
        }

        .sidebar-link-active::before {
          opacity: 1;
          transform: scaleY(1);
          left: 0;
        }

        .sidebar-icon {
          margin-right: 0.875rem;
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
          color: inherit;
          opacity: 0.8;
        }

        .sidebar-link:hover .sidebar-icon {
          transform: scale(1.15);
          color: #667eea;
          opacity: 1;
        }
        
        .sidebar-link-active .sidebar-icon {
          color: #667eea;
          opacity: 1;
        }
      `}</style>
    </>
  )
}

export default Sidebar



