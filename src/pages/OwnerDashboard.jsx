import React, { useState, useEffect } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';
import { 
  Users, 
  Shield, 
  UserPlus, 
  TrendingUp, 
  Activity,
  Crown,
  CheckCircle,
  XCircle,
  Edit,
  Trash2,
  Mail,
  Send,
  Search
} from 'lucide-react';

const OwnerDashboard = () => {
  const { user } = useAuth();
  
  // Only ROLE_OWNER can access
  if (user?.role !== 'ROLE_OWNER') {
    return <Navigate to="/app/dashboard" replace />;
  }
  
  const [users, setUsers] = useState([]);
  const [systemStats, setSystemStats] = useState({
    totalAdmins: 0,
    totalUsers: 0,
    totalTransactions: 0
  });
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  
  const [newAdmin, setNewAdmin] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: ''
  });

  useEffect(() => {
    fetchUsersAndAdmins();
    fetchSystemStats();
  }, []);

  const changeRole = async (userId, currentRole, username) => {
    const targetRole = currentRole === 'ROLE_ADMIN' ? 'ROLE_USER' : 'ROLE_ADMIN';
    const action = currentRole === 'ROLE_ADMIN' ? 'demote to User' : 'promote to Admin';
    
    if (!window.confirm(`Are you sure you want to ${action} "${username}"?`)) {
      return;
    }

    try {
      await api.put(`/admin/users/${userId}/change-role`, { role: targetRole });
      setSuccess(`Successfully ${action === 'demote to User' ? 'demoted' : 'promoted'} ${username}`);
      fetchUsersAndAdmins(); // Refresh the list
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || `Failed to ${action}`);
      setTimeout(() => setError(''), 5000);
    }
  };

  const fetchUsersAndAdmins = async () => {
    try {
      setLoading(true);
      const response = await api.get('/admin/users-with-groups');
      setUsers(response.data);
      
      // Calculate stats from the data
      const adminsCount = response.data.filter(u => u.role === 'ROLE_ADMIN').length;
      const usersCount = response.data.filter(u => u.role === 'ROLE_USER').length;
      
      setSystemStats(prev => ({
        ...prev,
        totalAdmins: adminsCount,
        totalUsers: usersCount
      }));
    } catch (err) {
      setError('Failed to fetch users and admins');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      // Fetch all transactions to count them
      const response = await api.get('/admin/transactions');
      const transactions = response.data || [];
      
      setSystemStats(prev => ({
        ...prev,
        totalTransactions: transactions.length
      }));
    } catch (err) {
      console.error('Failed to fetch system stats:', err);
      // Keep existing stats on error
    }
  };

  const handleAddAdmin = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // await api.post('/owner/admins', newAdmin);
      
      setSuccess('Admin created successfully!');
      setShowAddAdmin(false);
      setNewAdmin({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: ''
      });
      fetchAdmins();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create admin');
    }
  };

  const handleToggleAdminStatus = async (adminId, currentStatus) => {
    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // await api.patch(`/owner/admins/${adminId}/status`, { isActive: !currentStatus });
      
      setSuccess(`Admin ${currentStatus ? 'deactivated' : 'activated'} successfully`);
      fetchAdmins();
    } catch (err) {
      setError('Failed to update admin status');
    }
  };

  const handleDeleteAdmin = async (adminId) => {
    if (!window.confirm('Are you sure you want to delete this admin? This will also remove all their users.')) {
      return;
    }

    try {
      // TODO: Replace with actual API endpoint when backend is ready
      // await api.delete(`/owner/admins/${adminId}`);
      
      setSuccess('Admin deleted successfully');
      fetchAdmins();
    } catch (err) {
      setError('Failed to delete admin');
    }
  };

  const handleSendEmail = async (e) => {
    e.preventDefault();
    if (selectedUsers.length === 0) {
      setError('Please select at least one recipient');
      return;
    }

    try {
      const response = await api.post('/admin/send-email', {
        recipientIds: selectedUsers,
        subject: emailData.subject,
        message: emailData.message
      });
      
      setSuccess(`Email sent successfully to ${response.data.sentCount} registered email address(es)`);
      setShowEmailComposer(false);
      setSelectedUsers([]);
      setEmailData({ subject: '', message: '' });
      setTimeout(() => setSuccess(''), 5000);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send emails');
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleSelectUser = (userId) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    if (selectedUsers.length === users.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
  };

  // Filter users based on search term
  const filteredUsers = users.filter(user => {
    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const role = user.role?.toLowerCase().replace('role_', '') || '';
    const adminName = user.adminName?.toLowerCase() || '';
    
    return username.includes(search) || 
           email.includes(search) || 
           firstName.includes(search) || 
           lastName.includes(search) || 
           fullName.includes(search) ||
           role.includes(search) ||
           adminName.includes(search);
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-amber-600 selection:text-white pb-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6 sm:pt-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 text-xs font-bold uppercase tracking-wider mb-2">
              <Crown size={14} className="text-amber-600" />
              <span>Root Administrator & Owner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 tracking-tight">
              System Owner Command
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Welcome back, <span className="font-bold text-slate-800">{user?.username}</span> — Global user governance and system-wide controls
            </p>
          </div>
          <div className="flex items-center gap-2.5 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200 self-start sm:self-auto">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 flex items-center justify-center text-white text-xs font-black shadow-sm">
              👑
            </div>
            <div>
              <span className="text-xs font-bold text-slate-900 block leading-tight">{user?.username}</span>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider">Super Owner</span>
            </div>
          </div>
        </div>

        {/* Alert Messages */}
        {error && (
          <div className="bg-rose-50 border border-rose-200 p-4 rounded-2xl flex items-center gap-3 text-rose-800 text-sm font-semibold animate-fadeIn">
            <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0" />
            <p>{error}</p>
          </div>
        )}

        {success && (
          <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-2xl flex items-center gap-3 text-emerald-800 text-sm font-semibold animate-fadeIn">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p>{success}</p>
          </div>
        )}

        {/* System Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Admins</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{systemStats.totalAdmins}</h3>
              <span className="text-[11px] font-medium text-amber-600 mt-1 inline-block">Elevated Permissions</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
              <Shield size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Platform Users</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{systemStats.totalUsers}</h3>
              <span className="text-[11px] font-medium text-blue-600 mt-1 inline-block">Standard Accounts</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
              <Users size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200 flex items-center justify-between hover:shadow-md transition-shadow">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Transactions</p>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900 mt-1">{systemStats.totalTransactions}</h3>
              <span className="text-[11px] font-medium text-emerald-600 mt-1 inline-block">Ledger Records</span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
              <Activity size={24} />
            </div>
          </div>
        </div>

        {/* Users and Admins Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200/80 p-4 sm:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Users size={18} />
                </div>
                <h2 className="text-xl font-bold text-slate-900">
                  User Governance & Directory
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                  {users.length} registered
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Manage roles, elevate admins, and broadcast official announcements
              </p>
            </div>

            <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
              <button
                onClick={() => setShowEmailComposer(!showEmailComposer)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  showEmailComposer
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                <Mail size={16} />
                <span>{showEmailComposer ? 'Close Composer' : 'Send Email'}</span>
              </button>
              <button
                onClick={() => setShowAddAdmin(!showAddAdmin)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all shadow-sm ${
                  showAddAdmin
                    ? 'bg-slate-200 text-slate-800'
                    : 'bg-gradient-to-r from-amber-600 to-orange-600 text-white hover:opacity-95'
                }`}
              >
                <UserPlus size={16} />
                <span>{showAddAdmin ? 'Close Form' : 'Add New Admin'}</span>
              </button>
            </div>
          </div>

          {/* Add Admin Form */}
          {showAddAdmin && (
            <div className="mb-6 bg-amber-50/50 p-5 sm:p-6 rounded-2xl border border-amber-200/80 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-600" />
                  <h3 className="text-base font-bold text-slate-900">Create New Administrator</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowAddAdmin(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <form onSubmit={handleAddAdmin} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdmin.username}
                    onChange={(e) => setNewAdmin({ ...newAdmin, username: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="e.g. john_admin"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Address *
                  </label>
                  <input
                    type="email"
                    required
                    value={newAdmin.email}
                    onChange={(e) => setNewAdmin({ ...newAdmin, email: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="admin@example.com"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    First Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdmin.firstName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, firstName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="First name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Last Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newAdmin.lastName}
                    onChange={(e) => setNewAdmin({ ...newAdmin, lastName: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="Last name"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Temporary Password *
                  </label>
                  <input
                    type="password"
                    required
                    value={newAdmin.password}
                    onChange={(e) => setNewAdmin({ ...newAdmin, password: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:border-amber-500 outline-none transition-all"
                    placeholder="Minimum 6 characters"
                    minLength="6"
                  />
                </div>

                <div className="sm:col-span-2 lg:col-span-1 flex items-end gap-2">
                  <button
                    type="submit"
                    className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold py-2 px-4 rounded-xl text-sm transition-all shadow-sm"
                  >
                    Confirm Create
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddAdmin(false)}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Email Composer */}
          {showEmailComposer && (
            <div className="mb-6 bg-indigo-50/50 p-5 sm:p-6 rounded-2xl border border-indigo-100 animate-in fade-in duration-200">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Mail className="w-5 h-5 text-indigo-600" />
                  <h3 className="text-base font-bold text-slate-900">Broadcast Email Announcement</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowEmailComposer(false)}
                  className="text-slate-400 hover:text-slate-600 p-1"
                >
                  <XCircle size={18} />
                </button>
              </div>

              <div className="mb-4 p-3 bg-white border border-indigo-100 rounded-xl flex items-center justify-between flex-wrap gap-2 text-xs text-indigo-900">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block"></span>
                  <span>Registered Recipient Delivery Mode</span>
                </div>
                <div className="font-semibold">
                  Selected: <span className="text-indigo-600 font-bold">{selectedUsers.length}</span> / {users.length} recipients
                </div>
              </div>

              <form onSubmit={handleSendEmail} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Subject Header *
                  </label>
                  <input
                    type="text"
                    required
                    value={emailData.subject}
                    onChange={(e) => setEmailData({ ...emailData, subject: e.target.value })}
                    className="w-full px-3.5 py-2 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                    placeholder="Announcement subject..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                    Email Body Content *
                  </label>
                  <textarea
                    required
                    rows="5"
                    value={emailData.message}
                    onChange={(e) => setEmailData({ ...emailData, message: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all resize-y"
                    placeholder="Write your announcement or notification message here..."
                  />
                </div>

                <div className="flex items-center gap-3">
                  <button
                    type="submit"
                    disabled={selectedUsers.length === 0}
                    className="inline-flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-5 rounded-xl text-sm transition-all shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send size={15} />
                    <span>Send to {selectedUsers.length} Recipient(s)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setShowEmailComposer(false);
                      setEmailData({ subject: '', message: '' });
                    }}
                    className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-2 px-4 rounded-xl text-sm transition-all"
                  >
                    Discard
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, username, email, or role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-9 py-2.5 text-sm bg-slate-50/70 hover:bg-slate-50 focus:bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 outline-none transition-all"
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
            {searchTerm && (
              <p className="mt-2 text-xs text-slate-500">
                Found <span className="font-bold text-indigo-600">{filteredUsers.length}</span> match(es) for "{searchTerm}"
              </p>
            )}
          </div>

          {/* Users List */}
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent mx-auto"></div>
              <p className="mt-3 text-xs font-medium text-slate-500">Loading user registry...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Users className="w-12 h-12 mx-auto mb-2 text-slate-300" />
              <p className="text-sm font-semibold text-slate-600">No matching accounts found</p>
              <p className="text-xs text-slate-400 mt-0.5">Try refining your search keyword</p>
            </div>
          ) : (
            <div>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-hidden rounded-xl border border-slate-200">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                      <th className="py-3 px-4 w-10">
                        <input
                          type="checkbox"
                          checked={selectedUsers.length === users.length && users.length > 0}
                          onChange={handleSelectAll}
                          className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                        />
                      </th>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Email</th>
                      <th className="py-3 px-4">Role</th>
                      <th className="py-3 px-4">Admin Supervisor</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Role Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredUsers.map((u) => {
                      const isAdmin = u.role === 'ROLE_ADMIN';
                      const isOwner = u.role === 'ROLE_OWNER';
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="py-3.5 px-4">
                            <input
                              type="checkbox"
                              checked={selectedUsers.includes(u.id)}
                              onChange={() => handleSelectUser(u.id)}
                              className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                            />
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                                isOwner
                                  ? 'bg-amber-100 text-amber-700'
                                  : isAdmin
                                  ? 'bg-purple-100 text-purple-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {isOwner ? '👑' : isAdmin ? <Shield size={16} /> : <Users size={16} />}
                              </div>
                              <div>
                                <div className="font-semibold text-slate-900 leading-tight">{u.username}</div>
                                <div className="text-xs text-slate-500">
                                  {u.firstName || ''} {u.lastName || ''}
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-slate-600 text-xs font-medium">
                            {u.email}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                              isOwner
                                ? 'bg-amber-100 text-amber-800'
                                : isAdmin
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {u.adminUsername || '-'}
                          </td>
                          <td className="py-3.5 px-4 text-xs text-slate-500">
                            {new Date(u.createdAt).toLocaleDateString(undefined, {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            {isOwner ? (
                              <span className="text-xs font-semibold text-amber-600">Owner Account</span>
                            ) : (
                              <button
                                onClick={() => changeRole(u.id, u.role, u.username)}
                                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-sm ${
                                  isAdmin
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-purple-50 text-purple-700 hover:bg-purple-100'
                                }`}
                                title={isAdmin ? 'Demote to Member' : 'Promote to Admin'}
                              >
                                {isAdmin ? (
                                  <>
                                    <Users size={13} />
                                    <span>Demote</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield size={13} />
                                    <span>Promote Admin</span>
                                  </>
                                )}
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card-Based View */}
              <div className="md:hidden space-y-3">
                <div className="flex items-center justify-between px-2 py-1 bg-slate-50 rounded-xl text-xs text-slate-600 font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === users.length && users.length > 0}
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span>Select All Users</span>
                  </label>
                  <span>{selectedUsers.length} selected</span>
                </div>

                {filteredUsers.map((u) => {
                  const isAdmin = u.role === 'ROLE_ADMIN';
                  const isOwner = u.role === 'ROLE_OWNER';
                  return (
                    <div key={u.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-xs space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-2.5">
                          <input
                            type="checkbox"
                            checked={selectedUsers.includes(u.id)}
                            onChange={() => handleSelectUser(u.id)}
                            className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 mt-0.5"
                          />
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                            isOwner
                              ? 'bg-amber-100 text-amber-700'
                              : isAdmin
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {isOwner ? '👑' : isAdmin ? <Shield size={16} /> : <Users size={16} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{u.username}</div>
                            <div className="text-xs text-slate-500">
                              {u.firstName || ''} {u.lastName || ''}
                            </div>
                          </div>
                        </div>

                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          isOwner
                            ? 'bg-amber-100 text-amber-800'
                            : isAdmin
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}>
                          {isOwner ? 'Owner' : isAdmin ? 'Admin' : 'Member'}
                        </span>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2 rounded-lg space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-medium text-slate-800 break-all">{u.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Registered:</span>
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                        {u.adminUsername && (
                          <div className="flex justify-between">
                            <span className="text-slate-400">Supervisor:</span>
                            <span>{u.adminUsername}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end pt-1">
                        {isOwner ? (
                          <span className="text-xs font-semibold text-amber-600">Owner Account</span>
                        ) : (
                          <button
                            onClick={() => changeRole(u.id, u.role, u.username)}
                            className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-sm flex items-center justify-center gap-1.5 ${
                              isAdmin
                                ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                : 'bg-purple-600 text-white hover:bg-purple-700'
                            }`}
                          >
                            {isAdmin ? (
                              <>
                                <Users size={14} />
                                <span>Demote to Member</span>
                              </>
                            ) : (
                              <>
                                <Shield size={14} />
                                <span>Promote to Admin</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default OwnerDashboard;
