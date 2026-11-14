import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { analyticsAPI } from '../services/api'
import { DollarSign, TrendingUp, TrendingDown, Shield, User as UserIcon, Crown, Calendar, Plus, Wallet, PieChart as PieIcon, BarChart3, Repeat, FileText, ChevronRight, Sparkles, Mail, ExternalLink, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../utils/currency'
import CountrySelectionModal from '../components/CountrySelectionModal'
import { useTranslation } from 'react-i18next'

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6']

function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const [dashboardData, setDashboardData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [showCountryModal, setShowCountryModal] = useState(false)
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)
  const [activePreset, setActivePreset] = useState('this-month')
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    endDate: new Date()
  })
  
  const isOwner = user?.role === 'ROLE_OWNER'
  const isAdmin = user?.role === 'ROLE_ADMIN'
  const isUser = user?.role === 'ROLE_USER'
  const isGroupMember = user?.isGroupMember

  useEffect(() => {
    fetchDashboardData()
    // Show country selection modal if user doesn't have country set and is not a group member
    if (user && !user.country && !isGroupMember) {
      setShowCountryModal(true)
    }
  }, [dateRange, user, isGroupMember])

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 640

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const response = await analyticsAPI.getDashboard(params)
      setDashboardData(response.data)
    } catch (error) {
      toast.error('Failed to load dashboard data')
      console.error('Dashboard error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const formatCategoryData = (categorySpending) => {
    if (!Array.isArray(categorySpending)) return []
    return categorySpending
      .filter(item => item && (Array.isArray(item) ? item[0] : item.name))
      .map((item, index) => {
        const name = Array.isArray(item) ? (item[0] || 'Other') : (item.name || 'Other')
        const rawVal = Array.isArray(item) ? item[1] : (item.value || item.amount)
        const parsed = parseFloat(rawVal)
        const value = isNaN(parsed) ? 0 : Math.max(0, parsed)
        return {
          name,
          value,
          color: COLORS[index % COLORS.length]
        }
      })
  }

  const formatTrendData = (monthlyTrend) => {
    if (!Array.isArray(monthlyTrend)) return []
    return monthlyTrend
      .filter(item => item)
      .map(item => {
        const month = Array.isArray(item) ? (item[0] || '') : (item.month || '')
        const rawVal = Array.isArray(item) ? item[1] : (item.amount || item.value)
        const parsed = parseFloat(rawVal)
        const amount = isNaN(parsed) ? 0 : parsed
        return {
          month,
          amount
        }
      })
  }

  const handleCountrySelected = () => {
    window.location.reload()
  }

  const setPresetRange = (preset) => {
    setActivePreset(preset)
    const now = new Date()
    if (preset === 'this-month') {
      setDateRange({
        startDate: new Date(now.getFullYear(), now.getMonth(), 1),
        endDate: now
      })
    } else if (preset === 'last-30') {
      const past = new Date()
      past.setDate(past.getDate() - 30)
      setDateRange({
        startDate: past,
        endDate: now
      })
    } else if (preset === 'ytd') {
      setDateRange({
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now
      })
    }
  }

  if (loading && !dashboardData) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  const totalCategoryExpenses = formatCategoryData(dashboardData?.categorySpending).reduce((sum, item) => sum + item.value, 0)
  const categoryData = formatCategoryData(dashboardData?.categorySpending)
  const trendData = formatTrendData(dashboardData?.monthlyTrend)
  const netAmount = dashboardData?.netAmount || 0

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-indigo-600 selection:text-white pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Country Selection Modal */}
        <CountrySelectionModal 
          isOpen={showCountryModal}
          onClose={() => setShowCountryModal(false)}
          onCountrySelected={handleCountrySelected}
          userProfile={user}
        />

        {/* Executive Header Banner */}
        <div className={`rounded-2xl p-5 sm:p-6 shadow-sm border transition-all ${
          isOwner
            ? 'bg-gradient-to-r from-amber-500/10 via-amber-500/5 to-white border-amber-200/80'
            : isAdmin
            ? 'bg-gradient-to-r from-purple-500/10 via-purple-500/5 to-white border-purple-200/80'
            : 'bg-white border-slate-200/80'
        }`}>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-white shadow-sm flex-shrink-0 ${
                isOwner
                  ? 'bg-gradient-to-tr from-amber-500 to-orange-500'
                  : isAdmin
                  ? 'bg-gradient-to-tr from-purple-600 to-indigo-600'
                  : 'bg-gradient-to-tr from-indigo-600 to-blue-600'
              }`}>
                {isOwner ? <Crown size={22} /> : isAdmin ? <Shield size={22} /> : <UserIcon size={22} />}
              </div>

              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {t('dashboard.welcome') || 'Welcome back'}, {user?.firstName || user?.username}!
                  </h1>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    isOwner
                      ? 'bg-amber-100 text-amber-800 border-amber-300'
                      : isAdmin
                      ? 'bg-purple-100 text-purple-800 border-purple-300'
                      : 'bg-slate-100 text-slate-700 border-slate-200'
                  }`}>
                    {isOwner ? '👑 System Owner' : isAdmin ? '🛡️ Administrator' : '👤 Member'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                  {user?.email} • Financial Overview & Live Ledger Intelligence
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
              {isOwner && (
                <button
                  onClick={() => navigate('/app/owner')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-xs font-bold border border-amber-200 transition-colors shadow-xs"
                >
                  <Crown size={14} />
                  <span>Owner Command</span>
                </button>
              )}
              {isAdmin && (
                <button
                  onClick={() => navigate('/app/admin')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-800 text-xs font-bold border border-purple-200 transition-colors shadow-xs"
                >
                  <Shield size={14} />
                  <span>Admin Center</span>
                </button>
              )}
              <button
                onClick={() => navigate('/app/transactions')}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-indigo-600/20 active:scale-95 transition-all"
              >
                <Plus size={16} />
                <span>New Transaction</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filter & Range Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 hidden sm:inline">
              Period Preset:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setPresetRange('this-month')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === 'this-month'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                This Month
              </button>
              <button
                onClick={() => setPresetRange('last-30')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === 'last-30'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Last 30 Days
              </button>
              <button
                onClick={() => setPresetRange('ytd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === 'ytd'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Year to Date
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span>Custom:</span>
            </div>
            <input
              type="date"
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setActivePreset('custom')
                setDateRange({ ...dateRange, startDate: new Date(e.target.value) })
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setActivePreset('custom')
                setDateRange({ ...dateRange, endDate: new Date(e.target.value) })
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* 3 Top Financial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {/* Inflow / Income */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.totalIncome') || 'Total Inflow (Income)'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {formatCurrency(dashboardData?.totalIncome || 0)}
              </h3>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-flex items-center gap-1">
                <ArrowUpRight size={13} />
                <span>Recorded revenue stream</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
          </div>

          {/* Outflow / Expenses */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.totalExpenses') || 'Total Outflow (Expenses)'}
              </p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                {formatCurrency(dashboardData?.totalExpenses || 0)}
              </h3>
              <span className="text-[11px] font-medium text-rose-600 mt-1 inline-flex items-center gap-1">
                <ArrowDownRight size={13} />
                <span>Recorded outgoing expenses</span>
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={24} />
            </div>
          </div>

          {/* Net Amount / Margin */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                {t('dashboard.netAmount') || 'Net Cashflow'}
              </p>
              <h3 className={`text-2xl sm:text-3xl font-black mt-1 ${netAmount >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                {formatCurrency(netAmount)}
              </h3>
              <span className={`text-[11px] font-medium mt-1 inline-flex items-center gap-1 ${
                netAmount >= 0 ? 'text-indigo-600' : 'text-rose-600'
              }`}>
                <span>{netAmount >= 0 ? 'Positive Net Margin' : 'Negative Cashflow Deficit'}</span>
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              netAmount >= 0 ? 'bg-indigo-50 text-indigo-600' : 'bg-rose-50 text-rose-600'
            }`}>
              <DollarSign size={24} />
            </div>
          </div>
        </div>

        {/* Visual Analytics Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Category Spending Donut Chart & Breakdown */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <PieIcon size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('dashboard.expensesByCategory') || 'Expenses by Category'}
                  </h3>
                  <p className="text-xs text-slate-500">Breakdown of period expenditure</p>
                </div>
              </div>
              <span className="text-xs font-mono font-bold text-slate-700 bg-slate-100 px-2.5 py-1 rounded-lg">
                {formatCurrency(totalCategoryExpenses)}
              </span>
            </div>

            {categoryData.length > 0 ? (
              <div className="space-y-4">
                <div className="h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={75}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#ffffff" />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>

                <div className="divide-y divide-slate-100 pt-2 border-t border-slate-100">
                  {categoryData.slice(0, 5).map((cat) => {
                    const pct = totalCategoryExpenses > 0 ? ((cat.value / totalCategoryExpenses) * 100).toFixed(1) : 0
                    return (
                      <div key={cat.name} className="flex items-center justify-between text-xs py-2">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cat.color }}></span>
                          <span className="font-semibold text-slate-800">{cat.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-bold text-slate-900">{formatCurrency(cat.value)}</span>
                          <span className="text-[11px] font-semibold text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs text-center">
                <PieIcon size={36} className="text-slate-300 mb-2" />
                <p className="font-medium text-slate-600">{t('dashboard.noExpenseData') || 'No category expenses recorded'}</p>
                <p className="text-slate-400 mt-0.5">Transactions added with categories will show up here</p>
              </div>
            )}
          </div>

          {/* Monthly Spending Trend Area Chart */}
          <div className="lg:col-span-6 bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <BarChart3 size={16} />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    {t('dashboard.monthlySpendingTrend') || 'Monthly Spending Trend'}
                  </h3>
                  <p className="text-xs text-slate-500">Historical velocity and cashflow trend</p>
                </div>
              </div>
            </div>

            {trendData.length > 0 ? (
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={trendData}>
                    <defs>
                      <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#6366F1" stopOpacity={0.25} />
                        <stop offset="95%" stopColor="#6366F1" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#64748B', fontSize: 11 }}
                      tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                    />
                    <Tooltip
                      formatter={(value) => [formatCurrency(value), 'Spending']}
                      contentStyle={{
                        borderRadius: '12px',
                        border: '1px solid #E2E8F0',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="amount"
                      stroke="#6366F1"
                      strokeWidth={2.5}
                      fillOpacity={1}
                      fill="url(#spendGradient)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-slate-400 text-xs text-center">
                <BarChart3 size={36} className="text-slate-300 mb-2" />
                <p className="font-medium text-slate-600">{t('dashboard.noTrendData') || 'No monthly trend data available'}</p>
                <p className="text-slate-400 mt-0.5">Historical trends display as multiple months elapse</p>
              </div>
            )}
          </div>
        </div>

        {/* Quick Command Shortcuts Hub */}
        <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {t('dashboard.quickActions') || 'Financial Management Hub'}
              </h3>
              <p className="text-xs text-slate-500">Quickly jump into actions, budgets, and schedules</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <button
              onClick={() => navigate('/app/transactions')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-indigo-50/50 hover:border-indigo-200 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Plus size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                    {t('dashboard.addNewTransaction') || 'Record Transaction'}
                  </div>
                  <div className="text-[11px] text-slate-500">New ledger entry</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-indigo-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/app/recurring-transactions')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-purple-50/50 hover:border-purple-200 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Repeat size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-purple-600 transition-colors">
                    Recurring Schedules
                  </div>
                  <div className="text-[11px] text-slate-500">Subscriptions & rent</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-purple-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/app/budgets')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-emerald-50/50 hover:border-emerald-200 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <Wallet size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">
                    {t('dashboard.setBudget') || 'Category Budgets'}
                  </div>
                  <div className="text-[11px] text-slate-500">Spending guardrails</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-emerald-600 group-hover:translate-x-0.5 transition-all" />
            </button>

            <button
              onClick={() => navigate('/app/reports')}
              className="flex items-center justify-between p-4 rounded-xl border border-slate-200/80 bg-slate-50/50 hover:bg-blue-50/50 hover:border-blue-200 text-left transition-all group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:scale-105 transition-transform">
                  <FileText size={18} />
                </div>
                <div>
                  <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                    Financial Reports
                  </div>
                  <div className="text-[11px] text-slate-500">PDF & summary analytics</div>
                </div>
              </div>
              <ChevronRight size={16} className="text-slate-400 group-hover:text-blue-600 group-hover:translate-x-0.5 transition-all" />
            </button>
          </div>
        </div>

        {/* Admin Privilege Request Card (Single Clean Banner for Regular Users) */}
        {isUser && !user?.isGroupMember && (
          <div className="p-4 sm:p-5 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 to-purple-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0 mt-0.5">
                <Shield size={18} />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-indigo-950">
                  {t('dashboard.wantAdminAccess') || 'Need Administrator Privileges?'}
                </h4>
                <p className="text-xs text-slate-600 mt-0.5">
                  {t('dashboard.adminAccessDesc') || 'Request advanced administrative permissions from the system owner to supervise teams and categories.'}
                </p>
              </div>
            </div>

            <a
              href={`mailto:experiencetracker52@gmail.com?subject=Admin Access Request&body=Hello,%0D%0A%0D%0AI would like to request administrator privileges for my account.%0D%0A%0D%0AUser Details:%0D%0AName: ${user?.firstName ? user.firstName + (user.lastName ? ' ' + user.lastName : '') : (user?.name || user?.username || 'N/A')}%0D%0AEmail: ${user?.email || 'N/A'}%0D%0A%0D%0AThank you.`}
              className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-slate-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shadow-xs shrink-0"
            >
              <Mail size={14} />
              <span>{t('dashboard.contactOwner') || 'Contact Owner'}</span>
            </a>
          </div>
        )}
      </div>
    </div>
  )
}

export default Dashboard
