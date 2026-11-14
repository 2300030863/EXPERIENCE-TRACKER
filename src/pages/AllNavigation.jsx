import { useAuth } from '../contexts/AuthContext'
import { Link, useNavigate } from 'react-router-dom'
import { 
  Home, 
  CreditCard, 
  Repeat, 
  Tag, 
  Wallet, 
  Target, 
  BarChart3, 
  User, 
  Shield, 
  Crown, 
  ArrowRight, 
  Sparkles,
  LogOut,
  Globe
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import LanguageSwitcher from '../components/LanguageSwitcher'

function AllNavigation() {
  const { user, logout } = useAuth()
  const { t } = useTranslation()
  const navigate = useNavigate()

  const isOwner = user?.role === 'ROLE_OWNER'
  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isGroupMember = user?.isGroupMember && !isAdmin && !isOwner

  const navSections = [
    {
      title: 'Daily Finance',
      description: 'Record and track your transactions',
      items: [
        {
          title: t('nav.dashboard') || 'Dashboard',
          desc: 'Overview of income, expenses, and monthly trends',
          href: '/app/dashboard',
          icon: Home,
          gradient: 'from-blue-500 to-indigo-600',
          bgLight: 'bg-blue-50',
          textColor: 'text-blue-600',
          borderColor: 'border-blue-200'
        },
        {
          title: t('nav.transactions') || 'Transactions',
          desc: 'Complete ledger with search, filters, and edit options',
          href: '/app/transactions',
          icon: CreditCard,
          gradient: 'from-emerald-500 to-teal-600',
          bgLight: 'bg-emerald-50',
          textColor: 'text-emerald-600',
          borderColor: 'border-emerald-200'
        },
        ...(!isGroupMember ? [
          {
            title: t('nav.recurring') || 'Recurring Transactions',
            desc: 'Subscriptions, regular bills, and automated expenses',
            href: '/app/recurring-transactions',
            icon: Repeat,
            gradient: 'from-purple-500 to-indigo-600',
            bgLight: 'bg-purple-50',
            textColor: 'text-purple-600',
            borderColor: 'border-purple-200'
          }
        ] : []),
        {
          title: t('nav.categories') || 'Categories',
          desc: 'Manage custom expense categories and color coding',
          href: '/app/categories',
          icon: Tag,
          gradient: 'from-pink-500 to-rose-600',
          bgLight: 'bg-pink-50',
          textColor: 'text-pink-600',
          borderColor: 'border-pink-200'
        },
        {
          title: t('nav.accounts') || 'Accounts',
          desc: 'Bank accounts, credit cards, cash, and digital wallets',
          href: '/app/accounts',
          icon: Wallet,
          gradient: 'from-cyan-500 to-blue-600',
          bgLight: 'bg-cyan-50',
          textColor: 'text-cyan-600',
          borderColor: 'border-cyan-200'
        }
      ]
    },
    {
      title: 'Planning & Insights',
      description: 'Budgets and deep analytical reports',
      items: [
        ...(!isGroupMember ? [
          {
            title: t('nav.budgets') || 'Budgets',
            desc: 'Set limits, alerts, and monitor category thresholds',
            href: '/app/budgets',
            icon: Target,
            gradient: 'from-amber-500 to-orange-600',
            bgLight: 'bg-amber-50',
            textColor: 'text-amber-600',
            borderColor: 'border-amber-200'
          }
        ] : []),
        {
          title: t('nav.reports') || 'Reports & Analytics',
          desc: 'Visual spending breakdowns, export to PDF and CSV',
          href: '/app/reports',
          icon: BarChart3,
          gradient: 'from-rose-500 to-fuchsia-600',
          bgLight: 'bg-rose-50',
          textColor: 'text-rose-600',
          borderColor: 'border-rose-200'
        },
        {
          title: t('nav.profile') || 'User Profile',
          desc: 'Account details, country currency, and password',
          href: '/app/profile',
          icon: User,
          gradient: 'from-violet-500 to-purple-600',
          bgLight: 'bg-violet-50',
          textColor: 'text-violet-600',
          borderColor: 'border-violet-200'
        }
      ]
    },
    ...((isOwner || isAdmin) ? [
      {
        title: 'Administration',
        description: 'Privileged system and group controls',
        items: [
          ...(isAdmin ? [
            {
              title: t('nav.adminDashboard') || 'Admin Dashboard',
              desc: 'Manage users, access permissions, and audit logs',
              href: '/app/admin',
              icon: Shield,
              gradient: 'from-purple-600 to-indigo-700',
              bgLight: 'bg-purple-50',
              textColor: 'text-purple-700',
              borderColor: 'border-purple-300'
            }
          ] : []),
          ...(isOwner ? [
            {
              title: t('nav.ownerDashboard') || 'Owner Dashboard',
              desc: 'Global system overview, analytics, and admin controls',
              href: '/app/owner',
              icon: Crown,
              gradient: 'from-amber-500 to-yellow-600',
              bgLight: 'bg-amber-50',
              textColor: 'text-amber-700',
              borderColor: 'border-amber-300'
            }
          ] : [])
        ]
      }
    ] : [])
  ]

  const handleLogout = () => {
    logout()
    navigate('/', { replace: true })
  }

  return (
    <div className="all-nav-container max-w-4xl mx-auto pb-16">
      {/* User Card */}
      <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-3xl p-5 sm:p-6 text-white shadow-xl mb-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12 pointer-events-none" />
        <div className="flex items-center justify-between gap-4 relative z-10">
          <div className="flex items-center gap-3.5 min-w-0">
            <div className="w-13 h-13 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white border border-white/30 shadow-inner flex-shrink-0 p-3">
              <User size={26} />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold truncate">
                  {user?.firstName ? `${user.firstName} ${user.lastName || ''}` : user?.username}
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-white/25 border border-white/30">
                  {isOwner ? '👑 Owner' : isAdmin ? '🛡️ Admin' : '👤 User'}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-purple-100 truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/15 hover:bg-white/25 active:scale-95 transition-all text-xs font-semibold backdrop-blur-md border border-white/20 flex-shrink-0"
          >
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>
        </div>
      </div>

      {/* Navigation Sections */}
      <div className="space-y-6">
        {navSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-3">
            <div className="px-1">
              <h3 className="text-base sm:text-lg font-bold text-gray-800 flex items-center gap-2">
                <span>{section.title}</span>
                <span className="text-xs font-normal text-gray-500">({section.items.length})</span>
              </h3>
              <p className="text-xs text-gray-500">{section.description}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {section.items.map((item, iIdx) => {
                const Icon = item.icon
                return (
                  <Link
                    key={iIdx}
                    to={item.href}
                    className="group bg-white/90 backdrop-blur-md p-4 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all duration-200 active:scale-[0.98] flex items-center justify-between gap-3"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-tr ${item.gradient} flex items-center justify-center text-white shadow-md flex-shrink-0 group-hover:scale-105 transition-transform duration-200`}>
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-gray-900 group-hover:text-purple-700 transition-colors truncate">
                          {item.title}
                        </h4>
                        <p className="text-xs text-gray-500 line-clamp-1">
                          {item.desc}
                        </p>
                      </div>
                    </div>
                    <div className="w-8 h-8 rounded-full bg-gray-50 group-hover:bg-purple-50 group-hover:text-purple-600 flex items-center justify-center text-gray-400 flex-shrink-0 transition-colors">
                      <ArrowRight size={15} />
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Language Switcher Footer Box */}
      <div className="mt-8 bg-white/70 backdrop-blur-md rounded-2xl p-4 border border-gray-100 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2.5">
          <Globe size={18} className="text-gray-500" />
          <span className="text-xs font-semibold text-gray-700">Display Language</span>
        </div>
        <LanguageSwitcher />
      </div>
    </div>
  )
}

export default AllNavigation
