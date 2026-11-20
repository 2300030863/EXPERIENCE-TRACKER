import { NavLink, useLocation } from 'react-router-dom'
import { Home, CreditCard, Target, BarChart3, LayoutGrid, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function BottomNav({ onOpenMenu }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()
  const isGroupMember = user?.isGroupMember && user?.role === 'ROLE_USER'

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
      label: 'Menu',
      isActiveCheck: isAllMenuActive,
      onTap: onOpenMenu
    },
  ]

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-sm">
      <div className="max-w-md mx-auto px-2 py-1 flex items-center justify-around" style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom))' }}>
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={() => {
                if (item.onTap) {
                  item.onTap()
                }
              }}
              className={({ isActive }) => {
                const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive
                return `flex flex-col items-center justify-center flex-1 py-1.5 px-1 rounded-lg transition-colors ${
                  active
                    ? 'text-slate-900 font-semibold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }}
            >
              {({ isActive }) => {
                const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive
                return (
                  <>
                    <div className={`p-1 rounded-md transition-colors ${active ? 'bg-slate-100 text-slate-900' : 'text-slate-500'}`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
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
