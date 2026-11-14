import { useState, useEffect, useRef } from 'react'
import { budgetAPI, categoryAPI, analyticsAPI } from '../services/api'
import { Plus, Edit, Trash2, Target, AlertTriangle } from 'lucide-react'
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
    
    // Double protection against multiple submissions
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
      
      // Wait a bit before refetching to avoid race conditions
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
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="budgets-wrapper">
      <div className="budgets-background">
        <div className="budgets-orb budgets-orb-1"></div>
        <div className="budgets-orb budgets-orb-2"></div>
      </div>
      
      <div className="space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-orange-600 via-amber-600 to-yellow-600 bg-clip-text text-transparent">Budgets</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingBudget(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center justify-center bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Budget
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {budgets.map((budget) => {
          const { spent, percentage } = calculateProgress(budget)
          const isOverBudget = percentage > 100
          const isNearLimit = percentage >= budget.alertThreshold

          return (
            <div key={budget.id} className="card bg-gradient-to-br from-white to-amber-50/50 border-2 border-amber-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:-translate-y-1">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <div className="bg-gradient-to-br from-orange-100 to-amber-100 p-2 rounded-xl shadow-md mr-2">
                    <Target size={20} className="text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold bg-gradient-to-r from-orange-700 to-amber-700 bg-clip-text text-transparent">
                      {budget.category ? budget.category.name : 'Total Budget'}
                    </h3>
                    <p className="text-sm text-gray-600 capitalize">
                      {(budget.type || 'MONTHLY').toLowerCase()} budget
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleEdit(budget)}
                    className="text-orange-600 hover:text-orange-900 p-2 hover:bg-orange-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(budget.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Budget</span>
                  <span className="font-medium">{formatCurrency(budget.amount)}</span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Spent</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-gray-900'}`}>
                    {formatCurrency(spent)}
                  </span>
                </div>
                
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600">Remaining</span>
                  <span className={`font-medium ${isOverBudget ? 'text-red-600' : 'text-green-600'}`}>
                    {formatCurrency(budget.amount - spent)}
                  </span>
                </div>

                <div className="w-full bg-gray-200 rounded-full h-3 shadow-inner">
                  <div
                    className={`h-3 rounded-full transition-all duration-300 shadow-lg ${
                      isOverBudget ? 'bg-gradient-to-r from-red-500 to-rose-600' : isNearLimit ? 'bg-gradient-to-r from-yellow-500 to-amber-600' : 'bg-gradient-to-r from-green-500 to-emerald-600'
                    }`}
                    style={{ width: `${Math.min(percentage, 100)}%` }}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">
                    {percentage.toFixed(1)}% used
                  </span>
                  {isNearLimit && (
                    <div className="flex items-center text-yellow-600">
                      <AlertTriangle size={16} className="mr-1" />
                      <span className="text-xs">Near limit</span>
                    </div>
                  )}
                  {isOverBudget && (
                    <div className="flex items-center text-red-600">
                      <AlertTriangle size={16} className="mr-1" />
                      <span className="text-xs">Over budget</span>
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500">
                  {format(new Date(budget.startDate), 'MMM dd')} - {format(new Date(budget.endDate), 'MMM dd, yyyy')}
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Budget Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 sm:p-6 border-2 border-white/60 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl bg-white/95 backdrop-blur-lg animate-fadeIn">
            <div className="mt-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent mb-4">
                {editingBudget ? 'Edit Budget' : 'Add New Budget'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Amount *</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Type *</label>
                  <select
                    required
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="MONTHLY">Monthly</option>
                    <option value="WEEKLY">Weekly</option>
                    <option value="YEARLY">Yearly</option>
                    <option value="CUSTOM">Custom</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Category</label>
                  <select
                    value={formData.categoryId}
                    onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
                    className="input-field mt-1"
                  >
                    <option value="">Total Budget (All Categories)</option>
                    {categories.map(category => (
                      <option key={category.id} value={category.id}>
                        {category.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Start Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">End Date *</label>
                  <input
                    type="date"
                    required
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Alert Threshold (%)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={formData.alertThreshold}
                    onChange={(e) => setFormData({ ...formData, alertThreshold: e.target.value })}
                    className="input-field mt-1"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Get notified when spending reaches this percentage of your budget
                  </p>
                </div>
                
                <div className="flex justify-end space-x-3">
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
                    {submitting ? 'Saving...' : (editingBudget ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <style>{`
        .budgets-wrapper {
          position: relative;
          min-height: 100vh;
        }
        
        .budgets-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #FEF3C7 0%, #FDE68A 50%, #FCD34D 100%);
          z-index: -1;
        }
        
        .budgets-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(65px);
          opacity: 0.4;
          animation: float-budgets 20s ease-in-out infinite;
        }
        
        .budgets-orb-1 {
          width: 430px;
          height: 430px;
          background: linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%);
          top: -110px;
          right: -110px;
        }
        
        .budgets-orb-2 {
          width: 380px;
          height: 380px;
          background: linear-gradient(135deg, #F97316 0%, #FB923C 100%);
          bottom: -100px;
          left: -100px;
          animation-delay: 10s;
        }
        
        @keyframes float-budgets {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% { 
            transform: translate(35px, -35px) scale(1.08) rotate(5deg);
          }
        }
        
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  )
}

export default Budgets



