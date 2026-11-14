import { useState, useEffect, useRef } from 'react'
import { accountAPI } from '../services/api'
import { Plus, Edit, Trash2, Wallet } from 'lucide-react'
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
    
    // Double protection against multiple submissions
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
      
      // Wait a bit before refetching to avoid race conditions
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

  const getAccountTypeIcon = (type) => {
    switch (type) {
      case 'BANK':
        return '🏦'
      case 'CREDIT_CARD':
        return '💳'
      case 'WALLET':
        return '👛'
      case 'SAVINGS':
        return '💰'
      case 'INVESTMENT':
        return '📈'
      default:
        return '💵'
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="accounts-wrapper">
      <div className="accounts-background">
        <div className="accounts-orb accounts-orb-1"></div>
        <div className="accounts-orb accounts-orb-2"></div>
      </div>
      
      <div className="space-y-6 relative z-10">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <h1 className="text-2xl lg:text-3xl font-bold bg-gradient-to-r from-cyan-600 via-blue-600 to-indigo-600 bg-clip-text text-transparent">Accounts</h1>
        <button
          onClick={() => {
            resetForm()
            setEditingAccount(null)
            setShowModal(true)
          }}
          className="btn-primary flex items-center justify-center bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-700 hover:to-blue-700 shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
        >
          <Plus size={20} className="mr-2" />
          Add Account
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {accounts.map((account) => (
          <div key={account.id} className="card bg-gradient-to-br from-white to-cyan-50/50 border-2 border-cyan-100 shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 hover:-translate-y-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="text-2xl mr-3 bg-gradient-to-br from-cyan-100 to-blue-100 p-3 rounded-xl shadow-md">
                  {getAccountTypeIcon(account.type)}
                </div>
                <div>
                  <h3 className="text-lg font-bold bg-gradient-to-r from-cyan-700 to-blue-700 bg-clip-text text-transparent">
                    {account.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {account.type.replace('_', ' ').toLowerCase()}
                  </p>
                  {account.description && (
                    <p className="text-sm text-gray-500">{account.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className={`text-xl font-bold ${
                  account.balance >= 0 ? 'bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent' : 'bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent'
                }`}>
                  {formatCurrency(account.balance)}
                </p>
                <div className="flex space-x-2 mt-2">
                  <button
                    onClick={() => handleEdit(account)}
                    className="text-cyan-600 hover:text-cyan-900 p-2 hover:bg-cyan-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                  >
                    <Edit size={16} />
                  </button>
                  <button
                    onClick={() => handleDelete(account.id)}
                    className="text-red-600 hover:text-red-900 p-2 hover:bg-red-50 rounded-lg transition-all duration-200 transform hover:scale-110"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Account Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm overflow-y-auto h-full w-full z-50 flex items-center justify-center p-4">
          <div className="relative mx-auto p-4 sm:p-6 border-2 border-white/60 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl rounded-2xl bg-white/95 backdrop-blur-lg animate-fadeIn">
            <div className="mt-3">
              <h3 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent mb-4">
                {editingAccount ? 'Edit Account' : 'Add New Account'}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name *</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <label className="block text-sm font-medium text-gray-700">Initial Balance</label>
                  <input
                    type="number"
                    step="0.01"
                    value={formData.balance}
                    onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                    className="input-field mt-1"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="input-field mt-1"
                    rows="3"
                  />
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
                    {submitting ? 'Saving...' : (editingAccount ? 'Update' : 'Create')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      </div>
      
      <style>{`
        .accounts-wrapper {
          position: relative;
          min-height: 100vh;
        }
        
        .accounts-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #CFFAFE 0%, #DBEAFE 50%, #E0E7FF 100%);
          z-index: -1;
        }
        
        .accounts-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(70px);
          opacity: 0.35;
          animation: float-accounts 22s ease-in-out infinite;
        }
        
        .accounts-orb-1 {
          width: 440px;
          height: 440px;
          background: linear-gradient(135deg, #06B6D4 0%, #3B82F6 100%);
          top: -115px;
          right: -115px;
        }
        
        .accounts-orb-2 {
          width: 390px;
          height: 390px;
          background: linear-gradient(135deg, #3B82F6 0%, #6366F1 100%);
          bottom: -105px;
          left: -105px;
          animation-delay: 11s;
        }
        
        @keyframes float-accounts {
          0%, 100% { 
            transform: translate(0, 0) scale(1) rotate(0deg);
          }
          50% { 
            transform: translate(38px, -38px) scale(1.1) rotate(6deg);
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

export default Accounts



