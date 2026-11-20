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
  
  // Remove budgets and recurring transactions for group members only
  if (isGroupMember && !isAdmin && !isOwner) {
    navigation = navigation.filter(item => item.key !== 'nav.budgets' && item.key !== 'nav.recurring')
  }
  
  if (isOwner) {
    navigation = [...ownerNavItems, ...navigation]
  } else if (isAdmin) {
    navigation = [...adminNavItems, ...navigation]
  }

  const userInitial = user?.firstName?.[0] || user?.username?.[0] || 'U'

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden transition-opacity"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-white border-r border-slate-200/90 flex flex-col transition-transform duration-200 ease-in-out lg:static lg:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        {/* Sidebar Header / Logo */}
        <div className="h-16 px-5 flex items-center justify-between border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center shadow-xs">
              <CreditCard size={17} />
            </div>
            <div>
              <span className="font-bold text-sm tracking-tight text-slate-900 block leading-tight">
                Expense Tracker
              </span>
              <span className="text-[10px] font-semibold text-slate-400 block tracking-wide uppercase">
                Finance Workspace
              </span>
            </div>
          </div>
          <button 
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
            onClick={() => setIsOpen(false)}
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Links */}
        <div className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {/* Mobile Profile Summary */}
          <div className="lg:hidden p-3 rounded-lg bg-slate-50 border border-slate-200/80 mb-2">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-slate-900 text-white flex items-center justify-center text-xs font-bold uppercase shadow-xs">
                {userInitial}
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-semibold text-slate-900 truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}`.trim() : user?.username}
                </div>
                <div className="text-[11px] text-slate-500 truncate">{user?.email}</div>
              </div>
            </div>
          </div>

          <div>
            <div className="px-3 mb-2 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              <span>Navigation</span>
              <span className="text-[10px] font-mono bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded font-medium">
                {navigation.length}
              </span>
            </div>

            <nav className="space-y-1">
              {navigation.map((item) => {
                const Icon = item.icon
                return (
                  <NavLink
                    key={item.key}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        isActive
                          ? 'bg-slate-900 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      }`
                    }
                  >
                    <Icon size={17} className="shrink-0" />
                    <span className="truncate">{t(item.key)}</span>
                  </NavLink>
                )
              })}
            </nav>
          </div>
        </div>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 shrink-0">
          <button
            onClick={() => {
              setIsOpen(false)
              logout()
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
          >
            <LogOut size={16} />
            <span>{t('header.signOut') || 'Sign Out'}</span>
          </button>
        </div>
      </aside>
    </>
  )
}

export default Sidebar
