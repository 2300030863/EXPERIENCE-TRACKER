import { useState, useEffect } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { adminAPI, categoryAPI } from '../services/api'
import { useAuth } from '../contexts/AuthContext'
import { Users, DollarSign, Tag, UsersIcon, UserCog, Search, Edit2, Trash2, Shield, Ban, UserCheck, UserX, Mail, Plus, XCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import UserGroups from '../components/UserGroups'

function AdminDashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  
  // Only ROLE_ADMIN and ROLE_OWNER can access
  if (user?.role !== 'ROLE_ADMIN' && user?.role !== 'ROLE_OWNER') {
    return <Navigate to="/dashboard" replace />
  }
  
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTransactions: 0,
    totalCategories: 0
  })
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('groups')
  
  // User management states
  const [users, setUsers] = useState([])
  const [filteredUsers, setFilteredUsers] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [editForm, setEditForm] = useState({ username: '', email: '', role: '' })
  const [loadingUserDetails, setLoadingUserDetails] = useState(false)
  
  // Category management states
  const [categories, setCategories] = useState([])
  const [showCategoryModal, setShowCategoryModal] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '', color: '#3B82F6' })

  useEffect(() => {
    fetchDashboardData()
    if (activeTab === 'users') {
      fetchUsers()
    }
  }, [activeTab])
  
  useEffect(() => {
    if (searchTerm === '') {
      setFilteredUsers(users)
    } else {
      const filtered = users.filter(user => 
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      )
      setFilteredUsers(filtered)
    }
  }, [searchTerm, users])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      const statsRes = await adminAPI.getSystemStats()
      setStats(statsRes.data)
    } catch (error) {
      console.error('Error fetching admin data:', error)
      toast.error('Failed to load admin dashboard')
    } finally {
      setLoading(false)
    }
  }
  
  const fetchUsers = async () => {
    try {
      setLoading(true)
      const response = await adminAPI.getAllUsers()
      setUsers(response.data)
      setFilteredUsers(response.data)
    } catch (error) {
      console.error('Error fetching users:', error)
      toast.error('Failed to load users')
    } finally {
      setLoading(false)
    }
  }
  
  const handleBlockUser = async (userId) => {
    if (!confirm('Are you sure you want to block this user?')) return
    
    try {
      await adminAPI.blockUser(userId)
      toast.success('User blocked successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error blocking user:', error)
      toast.error(error.response?.data?.message || 'Failed to block user')
    }
  }
  
  const handleUnblockUser = async (userId) => {
    try {
      await adminAPI.unblockUser(userId)
      toast.success('User unblocked successfully')
      fetchUsers()
    } catch (error) {
      console.error('Error unblocking user:', error)
      toast.error(error.response?.data?.message || 'Failed to unblock user')
    }
  }
  
  const handleDeleteUser = async (userId) => {
    if (!confirm('Are you sure you want to delete this user? This action cannot be undone.')) return
    
    try {
      await adminAPI.deleteUser(userId)
      toast.success('User deleted successfully')
      fetchUsers()
      fetchDashboardData() // Refresh stats
    } catch (error) {
      console.error('Error deleting user:', error)
      toast.error(error.response?.data?.message || 'Failed to delete user')
    }
  }
  
  const handleEditUser = async (user) => {
    setSelectedUser(user)
    setEditForm({
      username: user.username,
      email: user.email,
      role: user.role
    })
    setIsEditModalOpen(true)
    
    // Fetch detailed user information
    try {
      setLoadingUserDetails(true)
      const response = await adminAPI.getUserById(user.id)
      setSelectedUser(response.data)
    } catch (error) {
      console.error('Error fetching user details:', error)
      toast.error('Failed to load user details')
    } finally {
      setLoadingUserDetails(false)
    }
  }
  
  const handleUpdateUser = async (e) => {
    e.preventDefault()
    
    try {
      await adminAPI.updateUserRole(selectedUser.id, editForm.role)
      toast.success('User role updated successfully')
      setIsEditModalOpen(false)
      fetchUsers()
    } catch (error) {
      console.error('Error updating user:', error)
      toast.error(error.response?.data?.message || 'Failed to update user')
    }
  }
  
  const getRoleBadgeColor = (role) => {
    switch (role) {
      case 'ROLE_OWNER':
        return 'bg-purple-100 text-purple-800 border-purple-300'
      case 'ROLE_ADMIN':
        return 'bg-blue-100 text-blue-800 border-blue-300'
      case 'ROLE_USER':
        return 'bg-green-100 text-green-800 border-green-300'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-300'
    }
  }
  
  const getRoleDisplayName = (role) => {
    return role?.replace('ROLE_', '') || 'N/A'
  }
  
  // Category Management Functions
  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await categoryAPI.getAll()
      setCategories(response.data)
    } catch (error) {
      console.error('Error fetching categories:', error)
      toast.error('Failed to load categories')
    } finally {
      setLoading(false)
    }
  }
  
  const handleCreateCategory = async (e) => {
    e.preventDefault()
    try {
      if (editingCategory) {
        await categoryAPI.update(editingCategory.id, categoryForm)
        toast.success('Category updated successfully')
      } else {
        await categoryAPI.create(categoryForm)
        toast.success('Category created successfully')
      }
      setShowCategoryModal(false)
      setEditingCategory(null)
      resetCategoryForm()
      fetchCategories()
    } catch (error) {
      console.error('Error saving category:', error)
      toast.error('Failed to save category')
    }
  }
  
  const handleEditCategory = (category) => {
    if (category.isDefault) {
      toast.error('Cannot edit default categories')
      return
    }
    setEditingCategory(category)
    setCategoryForm({
      name: category.name,
      description: category.description || '',
      color: category.color || '#3B82F6'
    })
    setShowCategoryModal(true)
  }
  
  const handleDeleteCategory = async (id) => {
    const category = categories.find(c => c.id === id)
    if (category?.isDefault) {
      toast.error('Cannot delete default categories')
      return
    }
    
    if (!confirm('Are you sure you want to delete this category?')) return
    
    try {
      await categoryAPI.delete(id)
      toast.success('Category deleted successfully')
      fetchCategories()
    } catch (error) {
      console.error('Error deleting category:', error)
      toast.error('Failed to delete category')
    }
  }
  
  const resetCategoryForm = () => {
    setCategoryForm({ name: '', description: '', color: '#3B82F6' })
  }
  
  const predefinedColors = [
    '#3B82F6', '#EF4444', '#10B981', '#F59E0B',
    '#8B5CF6', '#EC4899', '#06B6D4', '#84CC16',
    '#F97316', '#6366F1', '#14B8A6', '#F43F5E'
  ]

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-purple-600 selection:text-white pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 border border-purple-200 text-purple-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Shield size={14} className="text-purple-600" />
              <span>Operations & Administration</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              Admin Operations Center
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Manage system users, assigned user groups, permissions, and system metrics
            </p>
          </div>
          <div className="flex items-center gap-3 self-start sm:self-auto">
            <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center text-white text-xs font-bold">
                {user?.username?.charAt(0).toUpperCase() || 'A'}
              </div>
              <div className="text-left">
                <span className="text-xs font-bold text-slate-900 block leading-tight">{user?.username}</span>
                <span className="text-[10px] font-semibold text-purple-600 uppercase tracking-wider">Admin Level</span>
              </div>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="bg-white rounded-2xl p-1.5 shadow-sm border border-slate-200 flex gap-2">
          <button
            onClick={() => setActiveTab('groups')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'groups'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UsersIcon size={18} />
            <span>Group Management</span>
          </button>
          <button
            onClick={() => setActiveTab('users')}
            className={`flex-1 py-3 px-4 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all ${
              activeTab === 'users'
                ? 'bg-purple-600 text-white shadow-md shadow-purple-600/20'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <UserCog size={18} />
            <span>User Directory ({users.length})</span>
          </button>
        </div>

        {/* 3 Clean Metric Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Users</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.totalUsers}</h3>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-block">Registered Accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">System Transactions</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.totalTransactions || 0}</h3>
              <span className="text-[11px] font-medium text-blue-600 mt-1 inline-block">Total Platform Activity</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <DollarSign size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Categories</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{stats.totalCategories}</h3>
              <span className="text-[11px] font-medium text-purple-600 mt-1 inline-block">Classification Tags</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <Tag size={24} />
            </div>
          </div>
        </div>

        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search users by username, email, or role..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 outline-none transition-all"
                  />
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                    >
                      <XCircle size={16} />
                    </button>
                  )}
                </div>
                <div className="text-xs text-slate-500 font-medium px-1 flex items-center justify-between sm:justify-start gap-2">
                  <span>Filtered:</span>
                  <span className="font-bold text-purple-700 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100">
                    {filteredUsers.length} of {users.length}
                  </span>
                </div>
              </div>
            </div>

            {/* Users Directory */}
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                    <Users size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-slate-900">User Accounts Directory</h3>
                    <p className="text-xs text-slate-500">Manage permissions, account lockouts, and profiles</p>
                  </div>
                </div>
              </div>

              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-10 w-10 border-2 border-purple-600 border-t-transparent mx-auto"></div>
                  <p className="mt-3 text-xs font-medium text-slate-500">Loading user registry...</p>
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
                  <p className="text-sm font-semibold text-slate-600">No matching users found</p>
                  <p className="text-xs text-slate-400 mt-0.5">Try searching with a different username or email</p>
                </div>
              ) : (
                <div>
                  {/* Desktop Table View */}
                  <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                          <th className="py-3 px-4 w-16">ID</th>
                          <th className="py-3 px-4">User</th>
                          <th className="py-3 px-4">Email</th>
                          <th className="py-3 px-4">Role</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm">
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="py-3.5 px-4 text-xs font-mono text-slate-400 font-bold">
                              #{u.id}
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-xs shadow-xs">
                                  {u.username?.charAt(0).toUpperCase() || 'U'}
                                </div>
                                <span className="font-semibold text-slate-900">{u.username}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                              <div className="flex items-center gap-1.5">
                                <Mail size={13} className="text-slate-400" />
                                <span>{u.email}</span>
                              </div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold border ${getRoleBadgeColor(u.role)}`}>
                                <Shield size={11} />
                                {getRoleDisplayName(u.role)}
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              {u.blocked ? (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                  <Ban size={11} />
                                  Blocked
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                  <UserCheck size={11} />
                                  Active
                                </span>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="inline-flex items-center gap-1">
                                <button
                                  onClick={() => handleEditUser(u)}
                                  className="p-1.5 text-slate-500 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                  title="Edit User Profile"
                                >
                                  <Edit2 size={15} />
                                </button>
                                
                                {u.blocked ? (
                                  <button
                                    onClick={() => handleUnblockUser(u.id)}
                                    className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                                    title="Unblock User"
                                  >
                                    <UserCheck size={15} />
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleBlockUser(u.id)}
                                    className="p-1.5 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                    title="Block User"
                                    disabled={u.role === 'ROLE_OWNER' || u.role === 'ROLE_ADMIN'}
                                  >
                                    <UserX size={15} />
                                  </button>
                                )}
                                
                                <button
                                  onClick={() => handleDeleteUser(u.id)}
                                  className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                  title="Delete User"
                                  disabled={u.role === 'ROLE_OWNER'}
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile Card-Based View */}
                  <div className="md:hidden space-y-3">
                    {filteredUsers.map((u) => (
                      <div key={u.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-xs">
                              {u.username?.charAt(0).toUpperCase() || 'U'}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 text-sm leading-tight">{u.username}</div>
                              <span className="text-[11px] font-mono text-slate-400">ID #{u.id}</span>
                            </div>
                          </div>
                          
                          <div className="flex flex-col items-end gap-1">
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${getRoleBadgeColor(u.role)}`}>
                              <Shield size={10} />
                              {getRoleDisplayName(u.role)}
                            </span>
                            {u.blocked ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                <Ban size={10} />
                                Blocked
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <UserCheck size={10} />
                                Active
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-lg flex items-center gap-2">
                          <Mail size={13} className="text-slate-400 shrink-0" />
                          <span className="truncate">{u.email}</span>
                        </div>

                        <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100">
                          <button
                            onClick={() => handleEditUser(u)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
                          >
                            <Edit2 size={12} />
                            <span>Edit</span>
                          </button>
                          
                          {u.blocked ? (
                            <button
                              onClick={() => handleUnblockUser(u.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                              <UserCheck size={12} />
                              <span>Unblock</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBlockUser(u.id)}
                              className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                              disabled={u.role === 'ROLE_OWNER' || u.role === 'ROLE_ADMIN'}
                            >
                              <UserX size={12} />
                              <span>Block</span>
                            </button>
                          )}
                          
                          <button
                            onClick={() => handleDeleteUser(u.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            disabled={u.role === 'ROLE_OWNER'}
                          >
                            <Trash2 size={12} />
                            <span>Delete</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* User Stats Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Enrolled</div>
                  <div className="text-2xl font-black text-slate-900 mt-0.5">{users.length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <Users size={18} />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Accounts</div>
                  <div className="text-2xl font-black text-emerald-600 mt-0.5">{users.filter(u => !u.blocked).length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                  <UserCheck size={18} />
                </div>
              </div>
              <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Locked / Blocked</div>
                  <div className="text-2xl font-black text-rose-600 mt-0.5">{users.filter(u => u.blocked).length}</div>
                </div>
                <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Ban size={18} />
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'groups' && (
          <UserGroups />
        )}
      </div>
      
      {/* Edit User Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-slate-200/80 transform transition-all">
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-slate-100 px-6 py-4 flex items-center justify-between z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                  <UserCog size={16} />
                </div>
                <h2 className="text-lg font-bold text-slate-900">User Profile & Governance</h2>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="p-6">
              {loadingUserDetails ? (
                <div className="flex justify-center items-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-600 border-t-transparent"></div>
                </div>
              ) : (
                <div className="space-y-6">
                  {/* User Avatar and Basic Info */}
                  <div className="flex items-center gap-4 pb-6 border-b border-slate-100">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-2xl shadow-sm">
                      {selectedUser?.username?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-slate-900 leading-tight">{selectedUser?.username}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">{selectedUser?.email}</p>
                      <div className="mt-2 flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold border ${getRoleBadgeColor(selectedUser?.role)}`}>
                          <Shield size={11} />
                          {getRoleDisplayName(selectedUser?.role)}
                        </span>
                        {selectedUser?.blocked ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            Blocked
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Active
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Profile Information Grid */}
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">User ID</span>
                      <span className="text-slate-900 font-mono font-bold">#{selectedUser?.id}</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">OAuth Method</span>
                      <span className="text-slate-900 font-semibold">{selectedUser?.oauthUser ? 'Google OAuth' : 'Standard Password'}</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Country</span>
                      <span className="text-slate-900 font-semibold">{selectedUser?.country || 'Not Set'}</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Default Currency</span>
                      <span className="text-slate-900 font-semibold">{selectedUser?.currency || 'Not Set'}</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Occupation</span>
                      <span className="text-slate-900 font-semibold">{selectedUser?.occupation?.name || 'Not Set'}</span>
                    </div>
                    
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100">
                      <span className="text-slate-400 font-semibold uppercase tracking-wider block mb-1">Enrolled Date</span>
                      <span className="text-slate-900 font-semibold">
                        {selectedUser?.createdAt ? new Date(selectedUser.createdAt).toLocaleDateString(undefined, { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric' 
                        }) : 'N/A'}
                      </span>
                    </div>
                  </div>
                  
                  {/* Role Management Section */}
                  <div className="pt-4 border-t border-slate-100">
                    <h4 className="text-sm font-bold text-slate-900 mb-3">Role & Access Level</h4>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">Change System Role</label>
                        <select
                          value={editForm.role}
                          onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                          className="w-full px-3.5 py-2.5 text-sm bg-slate-50 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none font-medium"
                          required
                        >
                          <option value="ROLE_USER">Member (ROLE_USER)</option>
                          <option value="ROLE_ADMIN">Administrator (ROLE_ADMIN)</option>
                          {user?.role === 'ROLE_OWNER' && <option value="ROLE_OWNER">System Owner (ROLE_OWNER)</option>}
                        </select>
                        <p className="text-xs text-slate-400 mt-1">Changing roles grants or restricts system-wide access</p>
                      </div>
                      
                      <div className="flex gap-2.5 pt-2">
                        <button
                          type="button"
                          onClick={() => setIsEditModalOpen(false)}
                          className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-xs sm:text-sm"
                        >
                          Close
                        </button>
                        <button
                          type="submit"
                          className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold shadow-sm text-xs sm:text-sm"
                        >
                          Save Changes
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      
      {/* Category Modal */}
      {showCategoryModal && (
        <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full border border-slate-200/80 transform transition-all">
            <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                  <Tag size={16} />
                </div>
                <h2 className="text-base font-bold text-slate-900">
                  {editingCategory ? 'Edit Category' : 'Create Category'}
                </h2>
              </div>
              <button
                onClick={() => {
                  setShowCategoryModal(false)
                  setEditingCategory(null)
                  resetCategoryForm()
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg transition-colors"
              >
                <XCircle size={18} />
              </button>
            </div>
            
            <form onSubmit={handleCreateCategory} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all"
                  placeholder="e.g., Shopping, Subscriptions"
                  required
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Description
                </label>
                <textarea
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-purple-500 outline-none transition-all resize-y"
                  placeholder="Optional description"
                  rows="3"
                />
              </div>
              
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-2">
                  Color Tag
                </label>
                <div className="grid grid-cols-6 gap-2 mb-3">
                  {predefinedColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setCategoryForm({ ...categoryForm, color })}
                      className={`w-full h-8 rounded-lg transition-all ${
                        categoryForm.color === color
                          ? 'ring-2 ring-offset-2 ring-purple-600 scale-105'
                          : 'hover:scale-105'
                      }`}
                      style={{ backgroundColor: color }}
                      title={color}
                    />
                  ))}
                </div>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={categoryForm.color}
                    onChange={(e) => setCategoryForm({ ...categoryForm, color: e.target.value })}
                    className="w-10 h-10 rounded-lg cursor-pointer border border-slate-200"
                  />
                  <span className="text-xs text-slate-600 font-mono">{categoryForm.color}</span>
                </div>
              </div>
              
              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCategoryModal(false)
                    setEditingCategory(null)
                    resetCategoryForm()
                  }}
                  className="flex-1 px-4 py-2.5 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-semibold text-xs sm:text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-all font-semibold shadow-sm text-xs sm:text-sm"
                >
                  {editingCategory ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminDashboard
