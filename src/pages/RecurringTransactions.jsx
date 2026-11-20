import { useState, useEffect, useRef, useCallback } from 'react'
import { recurringTransactionAPI, categoryAPI, accountAPI } from '../services/api'
import { Plus, Edit, Loader2, AlertTriangle, Trash2, Play, Pause, Calendar, Repeat, Info, AlertCircle, CheckCircle, X, ArrowDownRight, ArrowUpRight, Wallet, Tag, FileText, Sparkles, Clock, DollarSign, TrendingDown, TrendingUp } from 'lucide-react'
import { format } from 'date-fns'
import { getServerMessage } from '../utils/errorHandler'
import { parseLocalDate, toDateInputValue, todayString, formatDisplayDate, isBeforeToday } from '../utils/dates'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil, getCurrencySymbol } from '../utils/currency'

// Recurring Transactions Page
function RecurringTransactions() {
  const { user } = useAuth()
  const isSubmittingRef = useRef(false)
  const [recurringTransactions, setRecurringTransactions] = useState([])
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingTransaction, setEditingTransaction] = useState(null)
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    type: 'EXPENSE',
    recurrenceType: 'MONTHLY',
    startDate: todayString(),
    endDate: '',
    notes: '',
    categoryId: '',
    accountId: ''
  })
  const [formErrors, setFormErrors] = useState({})
  const [showHelp, setShowHelp] = useState(false)
  const [busyId, setBusyId] = useState(null) // schedule currently being toggled/executed/deleted

  useEffect(() => {
    fetchData()
  }, [])

  // Modal: close with Escape and stop the page behind it from scrolling
  const closeModal = useCallback(() => {
    setShowModal(false)
    setEditingTransaction(null)
    setFormErrors({})
  }, [])

  useEffect(() => {
    if (!showModal) return undefined
    const onKey = (e) => {
      if (e.key === 'Escape' && !isSubmittingRef.current) closeModal()
    }
    document.addEventListener('keydown', onKey)
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKey)
      document.body.style.overflow = previousOverflow
    }
  }, [showModal, closeModal])

  const fetchData = async () => {
    try {
      const [recurringRes, categoriesRes, accountsRes] = await Promise.all([
        recurringTransactionAPI.getAll(),
        categoryAPI.getAll(),
        accountAPI.getAll()
      ])
      
      setRecurringTransactions(Array.isArray(recurringRes.data) ? recurringRes.data : [])
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
      setAccounts(Array.isArray(accountsRes.data) ? accountsRes.data : [])
    } catch (error) {
      toast.error(getServerMessage(error, 'Failed to load recurring transactions'))
    } finally {
      setLoading(false)
    }
  }

  const validateForm = () => {
    const errors = {}
    
    // Description validation
    if (!formData.description.trim()) {
      errors.description = 'Description is required'
    } else if (formData.description.trim().length < 3) {
      errors.description = 'Description must be at least 3 characters long'
    } else if (formData.description.trim().length > 200) {
      errors.description = 'Description must be less than 200 characters'
    }
    
    // Amount validation
    const amount = Number(formData.amount)
    if (formData.amount === '' || !Number.isFinite(amount) || amount <= 0) {
      errors.amount = 'Amount must be greater than 0'
    } else if (amount > 999999.99) {
      errors.amount = 'Amount must be less than 9,99,999.99'
    }

    // Date validation (compare plain YYYY-MM-DD strings - no time zone surprises)
    if (!formData.startDate) {
      errors.startDate = 'Start date is required'
    } else if (!editingTransaction && formData.startDate < todayString()) {
      // Existing schedules keep their original start date, so only new ones are checked
      errors.startDate = 'Start date cannot be in the past'
    }

    // End date validation (same day as the start is allowed: it runs exactly once)
    if (formData.endDate && formData.startDate && formData.endDate < formData.startDate) {
      errors.endDate = 'End date must be on or after the start date'
    }
    
    // Category validation
    if (!formData.categoryId) {
      errors.categoryId = 'Category is required'
    }
    
    // Account validation
    if (!formData.accountId) {
      errors.accountId = 'Account is required'
    }
    
    // Notes validation
    if (formData.notes && formData.notes.length > 500) {
      errors.notes = 'Notes must be less than 500 characters'
    }
    
    setFormErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (!validateForm()) {
      toast.error('Please fix the form errors before submitting')
      return
    }
    
    // Double protection against multiple submissions
    if (submitting || isSubmittingRef.current) return
    
    isSubmittingRef.current = true
    setSubmitting(true)
    
    try {
      const data = {
        ...formData,
        description: formData.description.trim(),
        amount: parseFloat(formData.amount),
        categoryId: Number(formData.categoryId),
        accountId: Number(formData.accountId),
        endDate: formData.endDate || null
      }

      if (editingTransaction) {
        await recurringTransactionAPI.update(editingTransaction.id, data)
        toast.success('Recurring transaction updated successfully')
      } else {
        await recurringTransactionAPI.create(data)
        toast.success('Recurring transaction created successfully')
      }

      closeModal()
      resetForm()
      await fetchData()
    } catch (error) {
      toast.error(getServerMessage(error, 'Failed to save recurring transaction'))
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction)
    setFormData({
      description: transaction.description,
      amount: String(transaction.amount ?? ''),
      type: transaction.type,
      recurrenceType: transaction.recurrenceType,
      startDate: toDateInputValue(transaction.startDate),
      endDate: toDateInputValue(transaction.endDate),
      notes: transaction.notes || '',
      categoryId: transaction.categoryId?.toString() || '',
      accountId: transaction.accountId?.toString() || ''
    })
    setShowModal(true)
  }

  const handleDelete = async (tx) => {
    if (busyId) return
    if (!window.confirm(`Delete "${tx.description}"? Transactions it already created are kept.`)) return
    setBusyId(tx.id)
    try {
      await recurringTransactionAPI.delete(tx.id)
      toast.success('Recurring transaction deleted successfully')
      await fetchData()
    } catch (error) {
      toast.error(getServerMessage(error, 'Failed to delete recurring transaction'))
    } finally {
      setBusyId(null)
    }
  }

  const handleToggle = async (tx) => {
    if (busyId) return
    setBusyId(tx.id)
    try {
      await recurringTransactionAPI.toggle(tx.id)
      toast.success(tx.isActive ? 'Schedule paused' : 'Schedule resumed')
      await fetchData()
    } catch (error) {
      toast.error(getServerMessage(error, 'Failed to update recurring transaction status'))
    } finally {
      setBusyId(null)
    }
  }

  const handleExecute = async (tx) => {
    if (busyId) return
    const label = `${tx.type === 'INCOME' ? 'Add' : 'Deduct'} ${formatCurrency(tx.amount)} now for "${tx.description}"?`
    if (!window.confirm(`${label}\n\nThis posts one transaction dated today and moves the next due date forward.`)) return
    setBusyId(tx.id)
    try {
      await recurringTransactionAPI.execute(tx.id)
      toast.success('Transaction posted successfully')
      await fetchData()
    } catch (error) {
      toast.error(getServerMessage(error, 'Failed to execute recurring transaction'))
    } finally {
      setBusyId(null)
    }
  }

  const resetForm = () => {
    setFormData({
      description: '',
      amount: '',
      type: 'EXPENSE',
      recurrenceType: 'MONTHLY',
      startDate: todayString(),
      endDate: '',
      notes: '',
      categoryId: '',
      accountId: ''
    })
    setFormErrors({})
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const getRecurrenceLabel = (type) => {
    const labels = {
      DAILY: 'Daily',
      WEEKLY: 'Weekly',
      MONTHLY: 'Monthly',
      YEARLY: 'Yearly'
    }
    return labels[type] || type
  }

  const activeCount = recurringTransactions.filter(t => t.isActive).length
  const totalMonthlyExpense = recurringTransactions
    .filter(t => t.isActive && t.type === 'EXPENSE')
    .reduce((sum, t) => {
      const amt = parseFloat(t.amount) || 0
      if (t.recurrenceType === 'DAILY') return sum + amt * 30
      if (t.recurrenceType === 'WEEKLY') return sum + amt * 4.33
      if (t.recurrenceType === 'MONTHLY') return sum + amt
      if (t.recurrenceType === 'YEARLY') return sum + amt / 12
      return sum + amt
    }, 0)
  const totalMonthlyIncome = recurringTransactions
    .filter(t => t.isActive && t.type === 'INCOME')
    .reduce((sum, t) => {
      const amt = parseFloat(t.amount) || 0
      if (t.recurrenceType === 'DAILY') return sum + amt * 30
      if (t.recurrenceType === 'WEEKLY') return sum + amt * 4.33
      if (t.recurrenceType === 'MONTHLY') return sum + amt
      if (t.recurrenceType === 'YEARLY') return sum + amt / 12
      return sum + amt
    }, 0)

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="text-slate-900 selection:bg-purple-600 selection:text-white pb-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles size={14} className="text-purple-600" />
              <span>Automated Financial Schedules</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Recurring Transactions
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5 max-w-2xl">
              Automate repeat expenses and scheduled income like bills, rent, subscriptions, and salaries.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowHelp(!showHelp)}
              className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-xs sm:text-sm font-semibold transition-all shadow-xs"
            >
              <Info size={16} className="text-purple-600" />
              <span>{showHelp ? 'Hide Tips' : 'Rules & Tips'}</span>
            </button>
            <button
              onClick={() => {
                resetForm()
                setEditingTransaction(null)
                setShowModal(true)
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white text-xs sm:text-sm font-bold shadow-sm shadow-purple-600/20 active:scale-95 transition-all"
            >
              <Plus size={18} />
              <span>New Schedule</span>
            </button>
          </div>
        </div>

        {/* Tips / Rules Card */}
        {showHelp && (
          <div className="bg-white rounded-2xl p-5 border border-purple-100 shadow-sm animate-in fade-in duration-200 space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Info size={16} className="text-purple-600" />
                <span>How Recurring Execution Cycles Work</span>
              </h3>
              <button onClick={() => setShowHelp(false)} className="text-slate-400 hover:text-slate-600">
                <X size={16} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100">
                <strong className="text-purple-900 block font-bold mb-1">Daily</strong>
                <p className="text-slate-600">Runs every 24 hours. Ideal for daily commuting or coffee allowances.</p>
              </div>
              <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-100">
                <strong className="text-indigo-900 block font-bold mb-1">Weekly</strong>
                <p className="text-slate-600">Runs every 7 days. Useful for groceries, fuel, and weekly stipends.</p>
              </div>
              <div className="p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                <strong className="text-blue-900 block font-bold mb-1">Monthly</strong>
                <p className="text-slate-600">Runs monthly. Perfect for rent, Netflix, gym memberships, and salaries.</p>
              </div>
              <div className="p-3 bg-emerald-50/50 rounded-xl border border-emerald-100">
                <strong className="text-emerald-900 block font-bold mb-1">Yearly</strong>
                <p className="text-slate-600">Runs annually. Best for insurance premiums, SaaS licenses, and taxes.</p>
              </div>
            </div>
          </div>
        )}

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Schedules</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">
                {activeCount} <span className="text-xs font-medium text-slate-400">/ {recurringTransactions.length} total</span>
              </h3>
              <span className="text-[11px] font-medium text-purple-600 mt-1 inline-block">Automated Triggers</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Repeat size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Est. Outflow</p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                {formatCurrency(totalMonthlyExpense)}
              </h3>
              <span className="text-[11px] font-medium text-rose-600 mt-1 inline-block">Automated Expenses</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Est. Inflow</p>
              <h3 className="text-2xl sm:text-3xl font-black text-emerald-600 mt-1">
                {formatCurrency(totalMonthlyIncome)}
              </h3>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-block">Recurring Revenue</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <TrendingUp size={24} />
            </div>
          </div>
        </div>

        {/* Recurring Schedules Directory */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">Configured Schedules</h3>
              <p className="text-xs text-slate-500">View upcoming auto-executions and cycle details</p>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
              {recurringTransactions.length} configured
            </span>
          </div>

          {recurringTransactions.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Repeat className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-700">No recurring transactions found</p>
              <p className="text-xs text-slate-400 mt-0.5 mb-4">Set up your first repeating expense or income schedule</p>
              <button
                onClick={() => {
                  resetForm()
                  setEditingTransaction(null)
                  setShowModal(true)
                }}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold hover:bg-purple-700 transition-all shadow-sm"
              >
                <Plus size={16} />
                <span>Create Schedule</span>
              </button>
            </div>
          ) : (
            <div>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4">Description & Context</th>
                      <th className="py-3 px-4">Amount</th>
                      <th className="py-3 px-4">Frequency</th>
                      <th className="py-3 px-4">Next Due</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {recurringTransactions.map((tx) => {
                      const isIncome = tx.type === 'INCOME'
                      return (
                        <tr key={tx.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-slate-900">{tx.description}</div>
                            <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                              {tx.categoryName && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                                  <Tag size={11} />
                                  {tx.categoryName}
                                </span>
                              )}
                              {tx.accountName && (
                                <span className="inline-flex items-center gap-1 bg-slate-100 px-2 py-0.5 rounded-md font-medium text-slate-700">
                                  <Wallet size={11} />
                                  {tx.accountName}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 font-mono font-bold">
                            <span className={isIncome ? 'text-emerald-600' : 'text-rose-600'}>
                              {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                              <Repeat size={11} />
                              {getRecurrenceLabel(tx.recurrenceType)}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-600 font-medium">
                            <div className="flex items-center gap-1.5">
                              <Calendar size={13} className="text-slate-400" />
                              <span>{formatDisplayDate(tx.nextDueDate)}</span>
                              {tx.isActive && isBeforeToday(tx.nextDueDate) && (
                                <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200" title="Waiting to post - usually because the account balance is too low">
                                  <AlertTriangle size={10} />
                                  Overdue
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            {tx.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                Active
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-400"></span>
                                Paused
                              </span>
                            )}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleEdit(tx)}
                                className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Edit Schedule"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleToggle(tx)} disabled={busyId === tx.id}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  tx.isActive
                                    ? 'text-amber-600 hover:bg-amber-50'
                                    : 'text-emerald-600 hover:bg-emerald-50'
                                }`}
                                title={tx.isActive ? 'Pause Schedule' : 'Resume Schedule'}
                              >
                                {tx.isActive ? <Pause size={15} /> : <Play size={15} />}
                              </button>
                              {tx.isActive && (
                                <button
                                  onClick={() => handleExecute(tx)} disabled={busyId === tx.id}
                                  className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                  title="Execute Now Manually"
                                >
                                  <Sparkles size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(tx)} disabled={busyId === tx.id}
                                className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                                title="Delete Schedule"
                              >
                                <Trash2 size={15} />
                              </button>
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
                {recurringTransactions.map((tx) => {
                  const isIncome = tx.type === 'INCOME'
                  return (
                    <div key={tx.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{tx.description}</div>
                          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                            <span>{tx.categoryName || 'Uncategorized'}</span>
                            <span>•</span>
                            <span>{tx.accountName || 'Default Wallet'}</span>
                          </div>
                        </div>
                        <div className={`text-base font-black font-mono ${isIncome ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {isIncome ? '+' : '-'}{formatCurrency(tx.amount)}
                        </div>
                      </div>

                      <div className="flex items-center justify-between gap-2 text-xs">
                        <div className="flex items-center gap-1.5">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-purple-50 text-purple-700 border border-purple-100">
                            <Repeat size={10} />
                            {getRecurrenceLabel(tx.recurrenceType)}
                          </span>
                          {tx.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                              Paused
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
                          <Calendar size={11} />
                          <span>Due: {formatDisplayDate(tx.nextDueDate, 'MMM dd')}</span>
                          {tx.isActive && isBeforeToday(tx.nextDueDate) && (
                            <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                              <AlertTriangle size={10} />
                              Overdue
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => handleEdit(tx)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                        >
                          <Edit size={12} />
                          <span>Edit</span>
                        </button>
                        <button
                          onClick={() => handleToggle(tx)} disabled={busyId === tx.id}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                            tx.isActive
                              ? 'bg-amber-50 text-amber-700 hover:bg-amber-100'
                              : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          }`}
                        >
                          {tx.isActive ? <Pause size={12} /> : <Play size={12} />}
                          <span>{tx.isActive ? 'Pause' : 'Resume'}</span>
                        </button>
                        {tx.isActive && (
                          <button
                            onClick={() => handleExecute(tx)} disabled={busyId === tx.id}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                          >
                            <Sparkles size={12} />
                            <span>Run</span>
                          </button>
                        )}
                        <button
                          onClick={() => handleDelete(tx)} disabled={busyId === tx.id}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>

      {/* Modern High-End Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-auto max-h-[92vh] flex flex-col">
            {/* Modal Header */}
            <div className="px-6 py-5 sm:px-8 sm:py-6 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-white">
              <div className="flex items-center gap-3.5">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-purple-500/20 flex-shrink-0">
                  <Repeat size={22} />
                </div>
                <div>
                  <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                    {editingTransaction ? 'Edit Recurring Schedule' : 'New Recurring Transaction'}
                  </h2>
                  <p className="text-xs sm:text-sm text-slate-500">
                    Automate repeating expenses and recurring income streams
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors"
                aria-label="Close modal"
              >
                <X size={18} />
              </button>
            </div>

            {/* Modal Form Content */}
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-6 overflow-y-auto flex-1">
              {/* Type Switcher (Pill Style) */}
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

              {/* Description & Amount Row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-4">
                {/* Description */}
                <div className="sm:col-span-7">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Description <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      className={`w-full px-4 py-3 rounded-xl border font-medium text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 ${
                        formErrors.description
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300 focus:border-purple-600 focus:ring-purple-600/15 bg-slate-50/50 focus:bg-white'
                      }`}
                      placeholder="e.g. Netflix Subscription, Office Rent, Monthly Salary"
                      maxLength={200}
                    />
                  </div>
                  <div className="flex justify-between items-center mt-1 text-[11px]">
                    {formErrors.description ? (
                      <span className="text-rose-600 font-semibold flex items-center gap-1">
                        <AlertCircle size={12} />
                        {formErrors.description}
                      </span>
                    ) : (
                      <span className="text-slate-400">Clear title to easily recognize this schedule</span>
                    )}
                    <span className="text-slate-400 font-medium">{formData.description.length}/200</span>
                  </div>
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
                      max="999999.99"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      className={`w-full pl-16 pr-4 py-3 rounded-xl border text-base font-bold text-slate-900 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 ${
                        formErrors.amount
                          ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                          : 'border-slate-200 hover:border-slate-300 focus:border-purple-600 focus:ring-purple-600/15 bg-slate-50/50 focus:bg-white'
                      }`}
                      placeholder="0.00"
                    />
                  </div>
                  {formErrors.amount && (
                    <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {formErrors.amount}
                    </span>
                  )}
                </div>
              </div>

              {/* Recurrence Frequency & Timing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {/* Frequency */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Repeat Cycle <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.recurrenceType}
                    onChange={(e) => setFormData({ ...formData, recurrenceType: e.target.value })}
                    className="w-full px-3.5 py-3 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-800 font-semibold text-sm focus:outline-none focus:ring-4 focus:ring-purple-600/15 focus:border-purple-600 transition-all cursor-pointer"
                  >
                    <option value="DAILY">Daily (Every day)</option>
                    <option value="WEEKLY">Weekly (Every 7 days)</option>
                    <option value="MONTHLY">Monthly (Once a month)</option>
                    <option value="YEARLY">Yearly (Annual)</option>
                  </select>
                </div>

                {/* Start Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    min={editingTransaction ? undefined : todayString()}
                    className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold text-slate-800 transition-all focus:outline-none focus:ring-4 ${
                      formErrors.startDate
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-purple-600/15'
                    }`}
                  />
                  {formErrors.startDate && (
                    <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {formErrors.startDate}
                    </span>
                  )}
                </div>

                {/* End Date */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    End Date <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    min={formData.startDate}
                    className={`w-full px-3.5 py-3 rounded-xl border text-sm font-semibold text-slate-800 transition-all focus:outline-none focus:ring-4 ${
                      formErrors.endDate
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-purple-600/15'
                    }`}
                  />
                  {formErrors.endDate && (
                    <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {formErrors.endDate}
                    </span>
                  )}
                </div>
              </div>

              {/* Category & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Category <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className={`w-full px-3.5 py-3 rounded-xl border font-semibold text-sm text-slate-800 transition-all focus:outline-none focus:ring-4 ${
                      formErrors.categoryId
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-purple-600/15'
                    }`}
                  >
                    <option value="">Select Category...</option>
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                  {formErrors.categoryId && (
                    <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {formErrors.categoryId}
                    </span>
                  )}
                </div>

                {/* Account */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                    Account / Wallet <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.accountId}
                    onChange={(e) => setFormData({ ...formData, accountId: e.target.value })}
                    className={`w-full px-3.5 py-3 rounded-xl border font-semibold text-sm text-slate-800 transition-all focus:outline-none focus:ring-4 ${
                      formErrors.accountId
                        ? 'border-rose-300 focus:border-rose-500 focus:ring-rose-500/15 bg-rose-50/20'
                        : 'border-slate-200 bg-slate-50/50 focus:bg-white focus:border-purple-600 focus:ring-purple-600/15'
                    }`}
                  >
                    <option value="">Select Account...</option>
                    {accounts.map((account) => (
                      <option key={account.id} value={account.id}>
                        {account.name} ({account.type})
                      </option>
                    ))}
                  </select>
                  {formErrors.accountId && (
                    <span className="text-rose-600 font-semibold text-[11px] flex items-center gap-1 mt-1">
                      <AlertCircle size={12} />
                      {formErrors.accountId}
                    </span>
                  )}
                </div>
              </div>

              {accounts.length === 0 && (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle size={14} />
                  <span>You have no accounts yet. Create one on the Accounts page before scheduling a transaction.</span>
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                  Additional Notes <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  rows="2"
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-sm text-slate-800 placeholder-slate-400 transition-all focus:outline-none focus:ring-4 focus:ring-purple-600/15 focus:border-purple-600"
                  placeholder="e.g. Account number, cancellation link, or reminder details..."
                  maxLength={500}
                />
              </div>

              {/* Live Preview Summary Card */}
              {formData.description && formData.amount && (
                <div className="p-4 rounded-2xl bg-gradient-to-r from-purple-50/70 via-indigo-50/50 to-slate-50 border border-purple-100 flex items-start gap-3">
                  <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center flex-shrink-0 font-bold shadow-sm">
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
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">
                        {formData.recurrenceType}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs">
                      Auto-posts <strong className="text-slate-900">{formatCurrency(formData.amount)}</strong> on every {formData.recurrenceType.toLowerCase()} cycle starting {formData.startDate ? formatDisplayDate(formData.startDate) : 'start date'}.
                    </p>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold text-sm transition-all"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-7 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold text-sm shadow-md shadow-purple-600/25 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : editingTransaction ? (
                    <>
                      <CheckCircle size={16} />
                      <span>Update Schedule</span>
                    </>
                  ) : (
                    <>
                      <Plus size={16} />
                      <span>Save Recurring Transaction</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      </div>
    </div>
  )
}

export default RecurringTransactions
