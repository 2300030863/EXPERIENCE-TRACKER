import { useState, useEffect, useRef } from 'react'
import { budgetAPI, categoryAPI, analyticsAPI } from '../services/api'
import { Plus, Edit, Trash2, Target, AlertTriangle, CheckCircle } from 'lucide-react'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil } from '../utils/currency'

function Budgets() {
  const { user } = useAuth()
  const isSubmittingRef = useRef(false)
  const [budgets, setBudgets] = useState([])
  const [categories, setCategories] = useState([])
  const [budgetStatus, setBudgetStatus] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingBudget, setEditingBudget] = useState(null)
  const [formData, setFormData] = useState({
    amount: '',
    startDate: format(new Date(), 'yyyy-MM-dd'),
    endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
    type: 'MONTHLY',
    categoryId: '',
    alertThreshold: 80
  })

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [budgetsRes, categoriesRes, statusRes] = await Promise.all([
        budgetAPI.getAll(),
        categoryAPI.getAll(),
        analyticsAPI.getBudgetStatus()
      ])

      setBudgets(budgetsRes.data)
      setCategories(categoriesRes.data)
      setBudgetStatus(statusRes.data || [])
    } catch (error) {
      toast.error('Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    
    if (submitting || isSubmittingRef.current) return
    
    isSubmittingRef.current = true
    setSubmitting(true)
    try {
      const data = {
        ...formData,
        amount: parseFloat(formData.amount),
        alertThreshold: parseInt(formData.alertThreshold)
      }

      if (editingBudget) {
        await budgetAPI.update(editingBudget.id, data)
        toast.success('Budget updated successfully')
      } else {
        await budgetAPI.create(data)
        toast.success('Budget created successfully')
      }

      setShowModal(false)
      setEditingBudget(null)
      resetForm()
      
      setTimeout(() => {
        fetchData()
      }, 100)
    } catch (error) {
      toast.error('Failed to save budget')
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleEdit = (budget) => {
    setEditingBudget(budget)
    setFormData({
      amount: budget.amount.toString(),
      startDate: format(new Date(budget.startDate), 'yyyy-MM-dd'),
      endDate: format(new Date(budget.endDate), 'yyyy-MM-dd'),
      type: budget.type || 'MONTHLY',
      categoryId: budget.category?.id?.toString() || '',
      alertThreshold: budget.alertThreshold.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await budgetAPI.delete(id)
        toast.success('Budget deleted successfully')
        fetchData()
      } catch (error) {
        toast.error('Failed to delete budget')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      amount: '',
      startDate: format(new Date(), 'yyyy-MM-dd'),
      endDate: format(new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0), 'yyyy-MM-dd'),
      type: 'MONTHLY',
      categoryId: '',
      alertThreshold: 80
    })
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const calculateProgress = (budget) => {
    const status = budgetStatus.find(s => s.budget && s.budget.id === budget.id)
    if (status) {
      const spent = Number(status.spent) || 0
      const amount = Number(budget.amount) || 0
      const percentage = amount > 0 ? (spent / amount) * 100 : 0
      return { spent, percentage }
    }
    return { spent: 0, percentage: 0 }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Budgets & Limits</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Set and monitor periodic spending thresholds across your expense categories.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingBudget(null)
            setShowModal(true)
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={16} className="mr-1.5" />
          Create Budget
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {budgets.map((budget) => {
          const { spent, percentage } = calculateProgress(budget)
          const isOverBudget = percentage > 100
          const isNearLimit = percentage >= budget.alertThreshold && !isOverBudget
          const remaining = budget.amount - spent

          return (
            <div key={budget.id} className="card hover:border-slate-300 transition-colors flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                      <Target size={18} className="text-slate-700" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                        {budget.category ? budget.category.name : 'Total Budget (All)'}
                      </h3>
                      <span className="text-xs text-slate-500 capitalize">
                        {(budget.type || 'MONTHLY').toLowerCase()} period
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleEdit(budget)}
                      className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                      title="Edit budget"
                    >
                      <Edit size={15} />
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                      title="Delete budget"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-medium text-slate-600">Spent: {formatCurrency(spent)}</span>
                    <span className="font-semibold text-slate-900">{percentage.toFixed(0)}%</span>
                  </div>
                  
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        isOverBudget
                          ? 'bg-rose-500'
                          : isNearLimit
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] pt-1">
                    <span className="text-slate-400">Cap: {formatCurrency(budget.amount)}</span>
                    <span className={`font-medium ${remaining < 0 ? 'text-rose-600' : 'text-slate-600'}`}>
                      {remaining < 0 ? `Over by ${formatCurrency(Math.abs(remaining))}` : `${formatCurrency(remaining)} left`}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-3 mt-4 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-400">
                  {format(new Date(budget.startDate), 'MMM dd')} - {format(new Date(budget.endDate), 'MMM dd, yyyy')}
                </span>
                {isOverBudget ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded">
                    <AlertTriangle size={11} />
                    Exceeded
                  </span>
                ) : isNearLimit ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                    <AlertTriangle size={11} />
                    Near Limit
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                    <CheckCircle size={11} />
                    On Track
                  </span>
                )}
              </div>
            </div>
          )
        })}

        {budgets.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Target size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No active budgets</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Set monthly or category spending limits to get automated warnings before overspending.
            </p>
            <button
              onClick={() => {
                resetForm()
                setEditingBudget(null)
                setShowModal(true)
              }}
              className="mt-4 btn-primary inline-flex text-xs"
            >
              <Plus size={14} className="mr-1" />
              Create First Budget
            </button>
          </div>
        )}
      </div>

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                  <Target size={18} />
                </div>
                <h3 className="text-base font-bold text-slate-900">
                  {editingBudget ? 'Edit Budget' : 'Add New Budget'}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <Plus size={18} className="rotate-45" />
              </button>
            </div>

            {/* Scrollable Form Body */}
            <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Budget Amount *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    placeholder="e.g. 5000"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field"
                  />
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Recurrence Cycle *
                  </label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom Range</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Category Scope
                  </label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field"
                  >
                    <option value="">All Categories (Total Spending)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      Start Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.startDate}
                      onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                      End Date *
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.endDate}
                      onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                      className="input-field"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                    Warning Alert Threshold ({formData.alertThreshold}%)
                  </label>
                  <input
                    type="range"
                    min="50"
                    max="100"
                    step="5"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                    className="w-full accent-slate-900"
                  />
                  <div className="flex justify-between text-[11px] text-slate-400 mt-0.5">
                    <span>50%</span>
                    <span>Warn at {formData.alertThreshold}%</span>
                    <span>100%</span>
                  </div>
                </div>
              </div>
              
              {/* Fixed Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 shrink-0 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn-secondary"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : (editingBudget ? 'Update Budget' : 'Create Budget')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Budgets
