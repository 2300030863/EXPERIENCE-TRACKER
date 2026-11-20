import { NavLink, useLocation } from 'react-router-dom'
import { Home, CreditCard, Send, BarChart3, LayoutGrid } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../contexts/AuthContext'

function BottomNav({ onOpenMenu }) {
  const { t } = useTranslation()
  const { user } = useAuth()
  const location = useLocation()

  const isAllMenuActive = [
    '/app/menu',
    '/app/budgets',
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
    { 
      to: '/app/pay-and-track', 
      icon: Send, 
      label: 'Pay & Track',
      isSpecial: true,
    },
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
    <nav className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg safe-bottom">
      <div 
        className="max-w-md mx-auto px-2 py-1 flex items-center justify-around" 
        style={{ paddingBottom: 'max(0.4rem, env(safe-area-inset-bottom, 0px))' }}
      >
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
                return `flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all ${
                  item.isSpecial
                    ? active
                      ? 'text-indigo-600 font-bold'
                      : 'text-indigo-600 hover:text-indigo-700 font-semibold'
                    : active
                    ? 'text-slate-900 font-bold'
                    : 'text-slate-500 hover:text-slate-800 font-medium'
                }`
              }}
            >
              {({ isActive }) => {
                const active = item.isActiveCheck !== undefined ? item.isActiveCheck : isActive
                return (
                  <>
                    <div className={`p-1 rounded-lg transition-all ${
                      item.isSpecial
                        ? active
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-indigo-50 text-indigo-600'
                        : active
                        ? 'bg-slate-100 text-slate-900'
                        : 'text-slate-500'
                    }`}>
                      <Icon size={18} />
                    </div>
                    <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[62px]">
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
