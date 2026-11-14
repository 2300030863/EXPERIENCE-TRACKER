import { NavLink, useLocation } from 'react-router-dom'
import { Home, CreditCard, Target, BarChart3, LayoutGrid, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function BottomNav({ onOpenMenu }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const isGroupMember = user?.isGroupMember && user?.role === 'ROLE_USER'

  // Determine if the current route is one of the secondary pages accessed via All Menu
  const isAllMenuActive = [
    '/app/menu',
    '/app/categories',
    '/app/recurring-transactions',
    '/app/accounts',
    '/app/profile',
    '/app/admin',
    '/app/owner'
  ].some(path => location.pathname.startsWith(path))

  const navItems = [
    { to: '/app/dashboard', icon: Home, label: t('nav.dashboard') || 'Dashboard' },
    { to: '/app/transactions', icon: CreditCard, label: t('nav.transactions') || 'Expenses' },
    ...(!isGroupMember
      ? [{ to: '/app/budgets', icon: Target, label: t('nav.budgets') || 'Budgets' }]
      : [{ to: '/app/accounts', icon: Wallet, label: t('nav.accounts') || 'Accounts' }]),
    { to: '/app/reports', icon: BarChart3, label: t('nav.reports') || 'Reports' },
    { 
      to: '/app/menu', 
      icon: LayoutGrid, 
      label: 'All Menu',
      isActiveCheck: isAllMenuActive,
      onTap: onOpenMenu
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/90 backdrop-blur-xl border-t border-white/70 shadow-[0_-8px_30px_rgba(0,0,0,0.08)]">
      <div className="max-w-md mx-auto px-2 py-1.5 flex items-center justify-around" style={{ paddingBottom: 'max(0.5rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (item.onTap) {
                  // Optionally trigger menu
                }
              }}
              className={({ isActive }) => {
                const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive
                return `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-xl transition-all duration-200 active:scale-90 ${
                  active
                    ? 'text-purple-600 font-bold'
                    : 'text-gray-500 hover:text-gray-800 font-medium'
                }`
              }}
            >
              {({ isActive }) => {
                const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive
                return (
                  <>
                    <div
                      className={`relative p-1.5 rounded-xl transition-all duration-300 ${
                        active
                          ? 'bg-gradient-to-tr from-purple-100 to-pink-100 shadow-sm'
                          : 'bg-transparent'
                      }`}
                    >
                      <Icon
                        size={20}
                        className={`transition-transform duration-200 ${
                          active ? 'scale-110 text-purple-600' : 'text-gray-500'
                        }`}
                      />
                      {active && (
                        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 shadow-sm" />
                      )}
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[64px]">
                      {item.label}
                    </span>
                  </>
                )
              }}
            </NavLink>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNav