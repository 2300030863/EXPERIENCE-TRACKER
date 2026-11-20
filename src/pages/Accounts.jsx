import { useState, useEffect, useRef } from 'react'
import { accountAPI } from '../services/api'
import { Plus, Edit, Trash2, Wallet, Landmark, CreditCard as CardIcon, PiggyBank, TrendingUp, CircleDollarSign } from 'lucide-react'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil } from '../utils/currency'

function Accounts() {
  const { user } = useAuth()
  const isSubmittingRef = useRef(false)
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingAccount, setEditingAccount] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'CASH',
    balance: '0.00'
  })

  useEffect(() => {
    fetchAccounts()
  }, [])

  const fetchAccounts = async () => {
    try {
      const response = await accountAPI.getAll()
      setAccounts(response.data)
    } catch (error) {
      toast.error('Failed to load accounts')
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
        balance: parseFloat(formData.balance)
      }

      if (editingAccount) {
        await accountAPI.update(editingAccount.id, data)
        toast.success('Account updated successfully')
      } else {
        await accountAPI.create(data)
        toast.success('Account created successfully')
      }

      setShowModal(false)
      setEditingAccount(null)
      resetForm()
      
      setTimeout(() => {
        fetchAccounts()
      }, 100)
    } catch (error) {
      toast.error('Failed to save account')
    } finally {
      setSubmitting(false)
      isSubmittingRef.current = false
    }
  }

  const handleEdit = (account) => {
    setEditingAccount(account)
    setFormData({
      name: account.name,
      description: account.description || '',
      type: account.type,
      balance: account.balance.toString()
    })
    setShowModal(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this account?')) {
      try {
        await accountAPI.delete(id)
        toast.success('Account deleted successfully')
        fetchAccounts()
      } catch (error) {
        toast.error('Failed to delete account')
      }
    }
  }

  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'CASH',
      balance: '0.00'
    })
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const getAccountIcon = (type) => {
    switch (type) {
      case 'BANK':
        return <Landmark size={20} className="text-slate-700" />
      case 'CREDIT_CARD':
        return <CardIcon size={20} className="text-slate-700" />
      case 'WALLET':
        return <Wallet size={20} className="text-slate-700" />
      case 'SAVINGS':
        return <PiggyBank size={20} className="text-slate-700" />
      case 'INVESTMENT':
        return <TrendingUp size={20} className="text-slate-700" />
      default:
        return <CircleDollarSign size={20} className="text-slate-700" />
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-slate-900 border-t-transparent"></div>
      </div>
    )
  }

  const totalBalance = accounts.reduce((sum, acc) => sum + (parseFloat(acc.balance) || 0), 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">Accounts & Wallets</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage your payment sources, checking accounts, and available balances.
          </p>
        </div>
        <button
          onClick={() => {
            resetForm()
            setEditingAccount(null)
            setShowModal(true)
          }}
          className="btn-primary w-full sm:w-auto"
        >
          <Plus size={16} className="mr-1.5" />
          Add Account
        </button>
      </div>

      {/* Aggregate Balance Banner */}
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Total Liquid Balance</p>
          <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums mt-0.5">
            {formatCurrency(totalBalance)}
          </h2>
        </div>
        <div className="text-xs text-slate-500 font-medium">
          {accounts.length} linked account{accounts.length !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Accounts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {accounts.map((account) => (
          <div key={account.id} className="card hover:border-slate-300 transition-colors flex flex-col justify-between">
            <div>
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0">
                    {getAccountIcon(account.type)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm leading-snug">
                      {account.name}
                    </h3>
                    <span className="text-xs text-slate-500 capitalize">
                      {account.type.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(account)}
                    className="p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-md transition-colors"
                    title="Edit account"
                  >
                    <Edit size={15} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors"
                    title="Delete account"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>

              {account.description && (
                <p className="text-xs text-slate-500 mt-3 line-clamp-2">
                  {account.description}
                </p>
              )}
            </div>

            <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">Current Balance</span>
              <span className={`text-base font-bold tabular-nums ${
                account.balance >= 0 ? 'text-slate-900' : 'text-rose-600'
              }`}>
                {formatCurrency(account.balance)}
              </span>
            </div>
          </div>
        ))}

        {accounts.length === 0 && (
          <div className="col-span-full py-12 text-center bg-white rounded-xl border border-dashed border-slate-200">
            <Wallet size={32} className="mx-auto text-slate-300 mb-2" />
            <h3 className="text-sm font-semibold text-slate-800">No accounts registered yet</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              Add your primary bank accounts, credit cards, or cash wallets to track where money flows.
            </p>
            <button
              onClick={() => {
                resetForm()
                setEditingAccount(null)
                setShowModal(true)
              }}
              className="mt-4 btn-primary inline-flex text-xs"
            >
              <Plus size={14} className="mr-1" />
              Add First Account
            </button>
          </div>
        )}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-5 sm:p-6 w-full max-w-md shadow-xl rounded-xl bg-white border border-slate-200 animate-fadeIn">
            <h3 className="text-lg font-bold text-slate-900 mb-4">
              {editingAccount ? 'Edit Account' : 'Add New Account'}
            </h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Account Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. HDFC Salary Account, Personal Amex"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Type *
                </label>
                <select
                  required
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="input-field"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Account</option>
                  <option value="CREDIT_CARD">Credit Card</option>
                  <option value="WALLET">Digital Wallet</option>
                  <option value="SAVINGS">Savings Account</option>
                  <option value="INVESTMENT">Investment Account</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Initial Balance
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.balance}
                  onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                  className="input-field"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                  Description / Notes
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="input-field"
                  rows="2"
                  placeholder="Optional details or account purpose"
                />
              </div>
              
              <div className="flex justify-end gap-2.5 pt-2">
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
                  {submitting ? 'Saving...' : (editingAccount ? 'Update Account' : 'Create Account')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Accounts
