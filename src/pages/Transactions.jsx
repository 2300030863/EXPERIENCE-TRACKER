import { useState, useEffect, useRef } from 'react'
import { transactionAPI, categoryAPI, accountAPI } from '../services/api'
import { Plus, Edit, Trash2, Filter, Search, X, ArrowDownRight, ArrowUpRight, Wallet, Tag, Calendar, Sparkles, TrendingUp, TrendingDown, DollarSign, XCircle, FileText, CheckCircle, RotateCcw } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../utils/currency'

function Transactions() {
  const { user } = useAuth()
  const isSubmittingRef = useRef(false)
  const [transactions, setTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [filters, setFilters] = useState({
    startDate: '',
    endDate: '',
    categoryId: '',
    accountId: '',
    search: ''
  })
  const [formData, setFormData] = useState({
    amount: '',
    description: '',
    type: 'EXPENSE',
    transactionDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    categoryId: '',
    accountId: ''
  })

  useEffect(() => {
    fetchData()
  }, [])

  useEffect(() => {
    fetchTransactions()
  }, [filters])

  const fetchData = async () => {
    try {
      const [transactionsRes, categoriesRes, accountsRes] = await Promise.all([
        transactionAPI.getAll(),
        categoryAPI.getAll(),
        accountAPI.getAll()
      ])
      
      setTransactions(transactionsRes.data.content || transactionsRes.data)
      setCategories(categoriesRes.data)
      setAccounts(accountsRes.data)
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const fetchTransactions = async () => {
    try {
      const params = {}
      if (filters.startDate) params.startDate = filters.startDate
      if (filters.endDate) params.endDate = filters.endDate
      if (filters.categoryId) params.categoryId = filters.categoryId
      if (filters.accountId) params.accountId = filters.accountId

      const response = await transactionAPI.search(params)
      let filteredTransactions = response.data

      if (filters.search) {
        filteredTransactions = filteredTransactions.filter(transaction =>
          transaction.description.toLowerCase().includes(filters.search.toLowerCase()) ||
          transaction.notes?.toLowerCase().includes(filters.search.toLowerCase())
        )
      }

      setTransactions(filteredTransactions)
    } catch (error) {
      toast.error('Failed to fetch transactions')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Double protection against multiple submissions
    if (submitting || isSubmittingRef.current) return
    
    isSubmittingRef.current = true
    setSubmitting(true)
    
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount)
      }

      if (editingTransaction) {
        await transactionAPI.update(editingTransaction.id, data)
        toast.success('Transaction updated successfully')
      } else {
        await transactionAPI.create(data)
        toast.success('Transaction created successfully')
      }

      setShowModal(false)
      setEditingTransaction(null)
      resetForm()
      
      // Wait a bit before refetching to avoid race conditions
      setTimeout(() => {
        fetchTransactions()
      }, 100)
    } catch (error) {
      // Extract and display the actual error message from backend
      const errorMessage = error.response?.data?.message || 
                          error.response?.data || 
                          error.message || 
                          'Failed to save transaction'
      toast.error(errorMessage)
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      amount: transaction.amount.toString(),
      description: transaction.description,
      type: transaction.type,
      transactionDate: format(new Date(transaction.transactionDate), 'yyyy-MM-dd'),
      notes: transaction.notes || '',
      categoryId: transaction.categoryId?.toString() || '',
      accountId: transaction.accountId?.toString() || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await transactionAPI.delete(id)
        toast.success('Transaction deleted successfully')
        fetchTransactions()
      } catch (error) {
        // Extract and display the actual error message from backend
        const errorMessage = error.response?.data?.message || 
                            error.response?.data || 
                            error.message || 
                            'Failed to delete transaction'
        toast.error(errorMessage)
      }
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      description: '',
      type: 'EXPENSE',
      transactionDate: format(new Date(), 'yyyy-MM-dd'),
      notes: '',
      categoryId: '',
      accountId: ''
    })
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const totalIncome = transactions
    .filter(t => t.type === 'INCOME')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const totalExpense = transactions
    .filter(t => t.type === 'EXPENSE')
    .reduce((sum, t) => sum + (parseFloat(t.amount) || 0), 0)

  const netBalance = totalIncome - totalExpense

  const hasActiveFilters = Boolean(
    filters.startDate || filters.endDate || filters.categoryId || filters.accountId || filters.search
  )

  const resetFilters = () => {
    setFilters({
      startDate: '',
      endDate: '',
      categoryId: '',
      accountId: '',
      search: ''
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-emerald-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Transactions & Records
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              View, record, and filter all income and expenses across your accounts.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => {
                resetForm()
                setEditingTransaction(null)
                setShowModal(true)
              }}
              className="btn-primary"
            >
              <Plus size={16} className="mr-1.5" />
              <span>Record Transaction</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Income</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-emerald-700 tabular-nums mt-1">
                {formatCurrency(totalIncome)}
              </h3>
              <span className="text-xs text-emerald-700 mt-1 inline-block font-medium">Recorded Inflow</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold">
              <TrendingUp size={22} />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Expenses</p>
              <h3 className="text-2xl sm:text-3xl font-bold text-rose-700 tabular-nums mt-1">
                {formatCurrency(totalExpense)}
              </h3>
              <span className="text-xs text-rose-700 mt-1 inline-block font-medium">Recorded Outflow</span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-700 flex items-center justify-center font-bold">
              <TrendingDown size={22} />
            </div>
          </div>

          <div className="card flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Balance</p>
              <h3 className={`text-2xl sm:text-3xl font-bold tabular-nums mt-1 ${netBalance >= 0 ? 'text-slate-900' : 'text-rose-700'}`}>
                {formatCurrency(netBalance)}
              </h3>
              <span className="text-xs text-slate-500 mt-1 inline-block font-medium">
                {transactions.length} record{transactions.length !== 1 ? 's' : ''} listed
              </span>
            </div>
            <div className="w-11 h-11 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center font-bold">
              <DollarSign size={22} />
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter size={15} className="text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-800">Filter Transactions</h3>
            </div>
            {hasActiveFilters && (
              <button
                onClick={resetFilters}
                className="inline-flex items-center gap-1.5 text-xs font-medium text-rose-600 hover:text-rose-700 p-1 rounded-md hover:bg-rose-50 transition-colors"
              >
                <RotateCcw size={13} />
                <span>Reset Filters</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search description / notes..."
                value={filters.search}
                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
              />
            </div>

            <div>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => setFilters({ ...filters, startDate: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700"
                title="Start Date"
              />
            </div>

            <div>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => setFilters({ ...filters, endDate: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700"
                title="End Date"
              />
            </div>

            <div>
              <select
                value={filters.categoryId}
                onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700"
              >
                <option value="">All Categories</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <select
                value={filters.accountId}
                onChange={(e) => setFilters({ ...filters, accountId: e.target.value })}
                className="w-full px-3 py-2 text-xs sm:text-sm bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all text-slate-700"
              >
                <option value="">All Accounts</option>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Transactions Table & Mobile Cards */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Ledger History</h3>
              <p className="text-xs text-slate-500">Sorted by transaction occurrence date</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {transactions.length} entries
            </span>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Search className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No transactions recorded</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">
                {hasActiveFilters ? 'Try adjusting your filters' : 'Record your first transaction to get started'}
              </p>
              <button
                onClick={() => {
                  resetForm()
                  setEditingTransaction(null)
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold hover:bg-emerald-700 transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Add Transaction</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Description</th>
                      <th className="py-3 px-4">Category</th>
                      <th className="py-3 px-4">Account / Wallet</th>
                      <th className="py-3 px-4">Type</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {transactions.map((t) => {
                      const isIncome = t.type === 'INCOME'
                      return (
                        <tr key={t.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4 text-xs font-medium text-slate-600 whitespace-nowrap">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{format(new Date(t.transactionDate), 'MMM dd, yyyy')}</span>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900 leading-tight">{t.description}</div>
                            {t.notes && (
                              <div className="text-xs text-slate-400 truncate max-w-xs mt-0.5">{t.notes}</div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold"
                              style={{
                                backgroundColor: (t.categoryColor || '#10b981') + '15',
                                color: t.categoryColor || '#10b981'
                              }}
                            >
                              <Tag size={11} />
                              {t.categoryName || 'General'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                            <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                              <Wallet size={11} className="text-slate-400" />
                              {t.accountName || 'Cash Account'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                              isIncome ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}>
                              {isIncome ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                              {isIncome ? 'Income' : 'Expense'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold whitespace-nowrap">
                            <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                              {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              {t.canEdit !== false && (
                                <button
                                  onClick={() => handleEdit(t)}
                                  className="p-1.5 text-slate-500 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                  title="Edit Transaction"
                                >
                                  <Edit size={15} />
                                </button>
                              )}
                              {t.canDelete !== false && (
                                <button
                                  onClick={() => handleDelete(t.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                  title="Delete Transaction"
                                >
                                  <Trash2 size={15} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Cards */}
              <div className="md:hidden space-y-3">
                {transactions.map((t) => {
                  const isIncome = t.type === 'INCOME'
                  return (
                    <div key={t.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm leading-tight">{t.description}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-1">
                            <Calendar size={11} className="text-slate-400" />
                            <span>{format(new Date(t.transactionDate), 'MMM dd, yyyy')}</span>
                          </div>
                        </div>
                        <div className={`text-base font-black font-mono whitespace-nowrap ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(t.amount)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs flex-wrap">
                        <div className="flex items-center gap-1.5">
                          <span
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold"
                            style={{
                              backgroundColor: (t.categoryColor || '#10b981') + '15',
                              color: t.categoryColor || '#10b981'
                            }}
                          >
                            <Tag size={10} />
                            {t.categoryName || 'General'}
                          </span>
                          <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-700">
                            <Wallet size={10} className="text-slate-400" />
                            {t.accountName || 'Cash'}
                          </span>
                        </div>

                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isIncome ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                        }`}>
                          {isIncome ? 'Income' : 'Expense'}
                        </span>
                      </div>

                      {t.notes && (
                        <div className="text-xs text-slate-500 bg-slate-50 p-2 rounded-lg italic">
                          {t.notes}
                        </div>
                      )}

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        {t.canEdit !== false && (
                          <button
                            onClick={() => handleEdit(t)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                          >
                            <Edit size={12} />
                            <span>Edit</span>
                          </button>
                        )}
                        {t.canDelete !== false && (
                          <button
                            onClick={() => handleDelete(t.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        {/* High-End Modern Transaction Modal */}
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
              {/* Modal Header */}
              <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-white">
                <div className="flex items-center gap-3.5">
                  <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20 flex-shrink-0">
                    <FileText size={22} />
                  </div>
                  <div>
                    <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                      {editingTransaction ? 'Edit Transaction Entry' : 'New Transaction Entry'}
                    </h2>
                    <p className="text-xs sm:text-sm text-slate-500">
                      Record detailed income or expense into your ledger
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingTransaction(null)
                  }}
                  className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                  aria-label="Close modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Modal Form */}
              <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-5 overflow-y-auto flex-1">
                {/* Type Switcher Pills */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
                    Transaction Type <span className="text-rose-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3 p-1.5 bg-slate-100/80 rounded-2xl border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'EXPENSE' })}
                      className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'EXPENSE'
                          ? 'bg-white text-rose-700 shadow-md shadow-rose-500/10 border border-rose-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowDownRight size={18} className={formData.type === 'EXPENSE' ? 'text-rose-600' : 'text-slate-400'} />
                      <span>Expense (Outgoing)</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, type: 'INCOME' })}
                      className={`py-3 px-4 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        formData.type === 'INCOME'
                          ? 'bg-white text-emerald-700 shadow-md shadow-emerald-500/10 border border-emerald-200'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      <ArrowUpRight size={18} className={formData.type === 'INCOME' ? 'text-emerald-600' : 'text-slate-400'} />
                      <span>Income (Incoming)</span>
                    </button>
                  </div>
                </div>

                {/* Amount & Description */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                  {/* Description */}
                  <div className="sm:col-span-7">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Description <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 bg-slate-50/50 focus:bg-white font-medium text-slate-800 placeholder-slate-400 transition-all outline-none"
                      placeholder="e.g. Grocery store, Client invoice, Fuel"
                      maxLength={200}
                    />
                  </div>

                  {/* Amount */}
                  <div className="sm:col-span-5">
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Amount <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                        <span className="text-slate-500 font-bold text-sm bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-200">
                          {getCurrencySymbol(user?.country || 'India')}
                        </span>
                      </div>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        max="99999999.99"
                        required
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                        className="w-full pl-16 pr-4 py-3 rounded-xl border border-slate-200 hover:border-slate-300 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 bg-slate-50/50 focus:bg-white text-base font-bold text-slate-900 placeholder-slate-400 transition-all outline-none"
                        placeholder="0.00"
                      />
                    </div>
                  </div>
                </div>

                {/* Date, Category & Account */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Date <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.transactionDate}
                      onChange={(e) => setFormData({ ...formData, transactionDate: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 font-semibold text-sm text-slate-800 transition-all outline-none"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.categoryId}
                      onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 font-semibold text-sm text-slate-800 transition-all outline-none"
                    >
                      <option value="">Select Category...</option>
                      {categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Account */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                      Account / Wallet <span className="text-rose-500">*</span>
                    </label>
                    <select
                      required
                      value={formData.accountId}
                      onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                      className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:border-emerald-600 focus:ring-4 focus:ring-emerald-600/15 font-semibold text-sm text-slate-800 transition-all outline-none"
                    >
                      <option value="">Select Account...</option>
                      {accounts.map((a) => (
                        <option key={a.id} value={a.id}>
                          {a.name} ({a.type})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Additional Notes <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-emerald-600/15 focus:border-emerald-600 resize-y"
                    placeholder="e.g. Receipt #9821, client milestone, shared split details..."
                    maxLength={500}
                  />
                </div>

                {/* Live Preview Card */}
                {formData.description && formData.amount && (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-teal-50/50 to-slate-50 border border-emerald-100 flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
                      <Sparkles size={16} />
                    </div>
                    <div className="flex-1 text-xs sm:text-sm text-slate-700">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <span className="font-bold text-slate-900">{formData.description}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                          formData.type === 'INCOME' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {formData.type}
                        </span>
                      </div>
                      <p className="text-slate-600 text-xs">
                        Posting <strong className="text-slate-900 font-bold">{formatCurrency(formData.amount)}</strong> on{' '}
                        {formData.transactionDate ? format(new Date(formData.transactionDate), 'MMM dd, yyyy') : 'selected date'}.
                      </p>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowModal(false)
                      setEditingTransaction(null)
                    }}
                    className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-all"
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-sm shadow-md shadow-emerald-600/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <span>Saving...</span>
                    ) : editingTransaction ? (
                      <>
                        <CheckCircle size={16} />
                        <span>Update Transaction</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Record Transaction</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
  )
}

export default Transactions

