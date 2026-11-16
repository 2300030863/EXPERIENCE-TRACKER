import React, { useState, useEffect, useRef } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import api, { adminAPI } from '../services/api';
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
  Search,
  UserX,
  AlertTriangle,
  KeyRound,
  ShieldAlert,
  Layers,
  Lock,
  RefreshCw
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
    totalGroupUsers: 0,
    totalBlocked: 0,
    totalTransactions: 0
  });
  const [activeTab, setActiveTab] = useState('ALL'); // 'ALL' | 'ADMINS' | 'GROUP_USERS' | 'MEMBERS' | 'BLOCKED'
  const [showAddAdmin, setShowAddAdmin] = useState(false);
  const [showEmailComposer, setShowEmailComposer] = useState(false);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [emailData, setEmailData] = useState({ subject: '', message: '' });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // Delete Account Confirmation & OTP Modal State
  const [deleteModal, setDeleteModal] = useState({
    open: false,
    user: null,
    typedUsername: '',
    otp: '',
    otpSent: false,
    sendingOtp: false,
    countdown: 0,
    deleting: false,
    error: ''
  });
  const deleteTimerRef = useRef(null);
  
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

    return () => {
      if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
    };
  }, []);

  const openDeleteModal = (targetUser) => {
    if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
    setDeleteModal({
      open: true,
      user: targetUser,
      typedUsername: '',
      otp: '',
      otpSent: false,
      sendingOtp: false,
      countdown: 0,
      deleting: false,
      error: '',
    });
  };

  const closeDeleteModal = () => {
    if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
    setDeleteModal({
      open: false,
      user: null,
      typedUsername: '',
      otp: '',
      otpSent: false,
      sendingOtp: false,
      countdown: 0,
      deleting: false,
      error: '',
    });
  };

  const handleSendDeleteOtp = async () => {
    if (!deleteModal.user) return;
    try {
      setDeleteModal(prev => ({ ...prev, sendingOtp: true, error: '' }));
      await adminAPI.requestDeleteOtp(deleteModal.user.id);
      
      setDeleteModal(prev => ({
        ...prev,
        sendingOtp: false,
        otpSent: true,
        countdown: 60,
      }));

      if (deleteTimerRef.current) clearInterval(deleteTimerRef.current);
      deleteTimerRef.current = setInterval(() => {
        setDeleteModal(prev => {
          if (prev.countdown <= 1) {
            clearInterval(deleteTimerRef.current);
            return { ...prev, countdown: 0 };
          }
          return { ...prev, countdown: prev.countdown - 1 };
        });
      }, 1000);
    } catch (err) {
      setDeleteModal(prev => ({
        ...prev,
        sendingOtp: false,
        error: err.response?.data?.error || 'Failed to send OTP verification code',
      }));
    }
  };

  const handleConfirmDelete = async () => {
    if (!deleteModal.user) return;
    if (deleteModal.typedUsername !== deleteModal.user.username) {
      setDeleteModal(prev => ({
        ...prev,
        error: `Username mismatch. Please type "${deleteModal.user.username}" to confirm deletion.`,
      }));
      return;
    }
    if (!deleteModal.otp || deleteModal.otp.trim().length !== 6) {
      setDeleteModal(prev => ({
        ...prev,
        error: 'Please enter the 6-digit OTP code sent to your email.',
      }));
      return;
    }

    try {
      setDeleteModal(prev => ({ ...prev, deleting: true, error: '' }));
      await adminAPI.deleteUserWithOtp(deleteModal.user.id, {
        confirmationUsername: deleteModal.typedUsername,
        otp: deleteModal.otp.trim(),
      });

      const deletedUsername = deleteModal.user.username;
      closeDeleteModal();
      setSuccess(`Account "${deletedUsername}" has been permanently deleted.`);
      fetchUsersAndAdmins();
      fetchSystemStats();
      setTimeout(() => setSuccess(''), 4000);
    } catch (err) {
      setDeleteModal(prev => ({
        ...prev,
        deleting: false,
        error: err.response?.data?.error || 'Failed to delete user account',
      }));
    }
  };

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

  const handleToggleBlock = async (userId, currentBlocked, username) => {
    const action = currentBlocked ? 'unblock' : 'block';
    if (!window.confirm(`Are you sure you want to ${action} "${username}"?`)) {
      return;
    }
    try {
      if (currentBlocked) {
        await api.post(`/admin/users/${userId}/unblock`);
        setSuccess(`Successfully unblocked ${username}`);
      } else {
        await api.post(`/admin/users/${userId}/block`);
        setSuccess(`Successfully blocked ${username}`);
      }
      fetchUsersAndAdmins();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.response?.data?.message || `Failed to ${action} user`);
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
      const groupUsersCount = response.data.filter(u => u.userGroupId || u.isGroupMember).length;
      const standardUsersCount = response.data.filter(u => u.role === 'ROLE_USER' && !u.userGroupId && !u.isGroupMember).length;
      const blockedCount = response.data.filter(u => u.blocked).length;

      setSystemStats(prev => ({
        ...prev,
        totalAdmins: adminsCount,
        totalUsers: standardUsersCount,
        totalGroupUsers: groupUsersCount,
        totalBlocked: blockedCount,
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

  // Filter users based on active tab and search term
  const filteredUsers = users.filter(user => {
    // Tab filter
    if (activeTab === 'ADMINS' && user.role !== 'ROLE_ADMIN') return false;
    if (activeTab === 'GROUP_USERS' && !user.userGroupId && !user.isGroupMember) return false;
    if (activeTab === 'MEMBERS' && (user.role !== 'ROLE_USER' || user.userGroupId || user.isGroupMember)) return false;
    if (activeTab === 'BLOCKED' && !user.blocked) return false;

    if (!searchTerm) return true;
    
    const search = searchTerm.toLowerCase();
    const username = user.username?.toLowerCase() || '';
    const email = user.email?.toLowerCase() || '';
    const firstName = user.firstName?.toLowerCase() || '';
    const lastName = user.lastName?.toLowerCase() || '';
    const fullName = `${firstName} ${lastName}`.toLowerCase();
    const role = user.role?.toLowerCase().replace('role_', '') || '';
    const adminUsername = (user.adminUsername || user.adminName || '')?.toLowerCase();
    const groupName = (user.userGroupName || '')?.toLowerCase();
    
    return username.includes(search) || 
           email.includes(search) || 
           firstName.includes(search) || 
           lastName.includes(search) || 
           fullName.includes(search) ||
           role.includes(search) ||
           adminUsername.includes(search) ||
           groupName.includes(search);
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
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Admins</span>
              <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Shield size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{systemStats.totalAdmins}</h3>
              <span className="text-[10px] font-medium text-amber-600 mt-0.5 block">Elevated Access</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Group Users</span>
              <div className="w-8 h-8 rounded-xl bg-cyan-50 text-cyan-600 flex items-center justify-center">
                <Layers size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{systemStats.totalGroupUsers}</h3>
              <span className="text-[10px] font-medium text-cyan-600 mt-0.5 block">Admin Managed</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Standard</span>
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{systemStats.totalUsers}</h3>
              <span className="text-[10px] font-medium text-blue-600 mt-0.5 block">Direct Accounts</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Blocked</span>
              <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <UserX size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{systemStats.totalBlocked}</h3>
              <span className="text-[10px] font-medium text-rose-600 mt-0.5 block">Restricted</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200 flex flex-col justify-between hover:shadow-md transition-shadow col-span-2 sm:col-span-1">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Transactions</span>
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <Activity size={16} />
              </div>
            </div>
            <div>
              <h3 className="text-2xl sm:text-3xl font-black text-slate-900">{systemStats.totalTransactions}</h3>
              <span className="text-[10px] font-medium text-emerald-600 mt-0.5 block">Ledger Records</span>
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

          {/* Quick Segment Filter Tabs */}
          <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: 'ALL', label: 'All Accounts', count: users.length },
              { id: 'ADMINS', label: 'Admins', count: systemStats.totalAdmins },
              { id: 'GROUP_USERS', label: 'Group Members', count: systemStats.totalGroupUsers },
              { id: 'MEMBERS', label: 'Standard Members', count: systemStats.totalUsers },
              { id: 'BLOCKED', label: 'Blocked Accounts', count: systemStats.totalBlocked },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                    : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200'
                }`}
              >
                <span>{tab.label}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                  activeTab === tab.id
                    ? 'bg-white/20 text-white'
                    : 'bg-slate-100 text-slate-700'
                }`}>
                  {tab.count}
                </span>
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="mb-5">
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search users by name, username, email, role, admin supervisor, or group..."
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
              <p className="text-xs text-slate-400 mt-0.5">Try refining your filter or search keywords</p>
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
                      <th className="py-3 px-4">Role & Type</th>
                      <th className="py-3 px-4">Admin Supervisor / Group</th>
                      <th className="py-3 px-4">Registered</th>
                      <th className="py-3 px-4 text-right">Actions & Governance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {filteredUsers.map((u) => {
                      const isAdmin = u.role === 'ROLE_ADMIN';
                      const isOwner = u.role === 'ROLE_OWNER';
                      const isGroupMember = Boolean(u.userGroupId || u.isGroupMember);
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
                                  : isGroupMember
                                  ? 'bg-cyan-100 text-cyan-700'
                                  : 'bg-indigo-100 text-indigo-700'
                              }`}>
                                {isOwner ? '👑' : isAdmin ? <Shield size={16} /> : isGroupMember ? <Layers size={16} /> : <Users size={16} />}
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
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold ${
                                isOwner
                                  ? 'bg-amber-100 text-amber-800'
                                  : isAdmin
                                  ? 'bg-purple-100 text-purple-800'
                                  : isGroupMember
                                  ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}>
                                {isOwner ? 'Owner' : isAdmin ? 'Admin' : isGroupMember ? 'Group Member' : 'Member'}
                              </span>
                              {u.blocked && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                                  Blocked
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="py-3.5 px-4 text-xs">
                            {isGroupMember ? (
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1 font-semibold text-slate-800">
                                  <Shield size={12} className="text-purple-600 flex-shrink-0" />
                                  <span>Admin: {u.adminUsername || 'Admin'}</span>
                                </div>
                                <div className="inline-flex items-center gap-1 text-[11px] text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded-md font-medium border border-cyan-200/60">
                                  <Layers size={10} />
                                  <span>Group: {u.userGroupName || 'Group Unit'}</span>
                                </div>
                              </div>
                            ) : u.adminUsername ? (
                              <div className="flex items-center gap-1 font-semibold text-slate-800">
                                <Shield size={12} className="text-purple-600 flex-shrink-0" />
                                <span>Admin: {u.adminUsername}</span>
                              </div>
                            ) : isOwner || isAdmin ? (
                              <span className="text-slate-400">-</span>
                            ) : (
                              <span className="text-slate-400 italic">Direct / Independent</span>
                            )}
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
                              <div className="inline-flex items-center justify-end gap-1.5 flex-wrap">
                                {/* Block / Unblock Button */}
                                {u.blocked ? (
                                  <button
                                    onClick={() => handleToggleBlock(u.id, true, u.username)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200 shadow-2xs"
                                    title="Unblock User"
                                  >
                                    <CheckCircle size={13} />
                                    <span>Unblock</span>
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => handleToggleBlock(u.id, false, u.username)}
                                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all border border-amber-200 shadow-2xs"
                                    title="Block User"
                                  >
                                    <UserX size={13} />
                                    <span>Block</span>
                                  </button>
                                )}

                                {/* Promote / Demote Button */}
                                <button
                                  onClick={() => changeRole(u.id, u.role, u.username)}
                                  className={`inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-semibold transition-all shadow-2xs ${
                                    isAdmin
                                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                      : 'bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200/50'
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

                                {/* Delete Account Button */}
                                <button
                                  onClick={() => openDeleteModal(u)}
                                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 transition-all border border-rose-200 shadow-2xs"
                                  title="Permanently Delete Account"
                                >
                                  <Trash2 size={13} />
                                  <span>Delete</span>
                                </button>
                              </div>
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
                  const isGroupMember = Boolean(u.userGroupId || u.isGroupMember);
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
                              : isGroupMember
                              ? 'bg-cyan-100 text-cyan-700'
                              : 'bg-indigo-100 text-indigo-700'
                          }`}>
                            {isOwner ? '👑' : isAdmin ? <Shield size={16} /> : isGroupMember ? <Layers size={16} /> : <Users size={16} />}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900 leading-tight">{u.username}</div>
                            <div className="text-xs text-slate-500">
                              {u.firstName || ''} {u.lastName || ''}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isOwner
                              ? 'bg-amber-100 text-amber-800'
                              : isAdmin
                              ? 'bg-purple-100 text-purple-800'
                              : isGroupMember
                              ? 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                              : 'bg-slate-100 text-slate-700'
                          }`}>
                            {isOwner ? 'Owner' : isAdmin ? 'Admin' : isGroupMember ? 'Group Member' : 'Member'}
                          </span>
                          {u.blocked && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                              Blocked
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="text-xs text-slate-600 bg-slate-50 p-2.5 rounded-xl space-y-1.5">
                        <div className="flex justify-between">
                          <span className="text-slate-400">Email:</span>
                          <span className="font-medium text-slate-800 break-all">{u.email}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Registered:</span>
                          <span>{new Date(u.createdAt).toLocaleDateString()}</span>
                        </div>
                        {isGroupMember ? (
                          <div className="pt-1 border-t border-slate-200/60 space-y-1">
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Admin Supervisor:</span>
                              <span className="font-bold text-slate-800 flex items-center gap-1">
                                <Shield size={11} className="text-purple-600" />
                                {u.adminUsername || 'Admin'}
                              </span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-slate-400">Group Name:</span>
                              <span className="font-semibold text-cyan-700 flex items-center gap-1 bg-cyan-50 px-2 py-0.5 rounded-md border border-cyan-200/50">
                                <Layers size={10} />
                                {u.userGroupName || 'Group Unit'}
                              </span>
                            </div>
                          </div>
                        ) : u.adminUsername ? (
                          <div className="flex justify-between items-center">
                            <span className="text-slate-400">Supervisor:</span>
                            <span className="font-bold text-slate-800 flex items-center gap-1">
                              <Shield size={11} className="text-purple-600" />
                              {u.adminUsername}
                            </span>
                          </div>
                        ) : null}
                      </div>

                      <div className="flex flex-col gap-1.5 pt-1">
                        {isOwner ? (
                          <span className="text-xs font-semibold text-amber-600 text-right">Owner Account</span>
                        ) : (
                          <>
                            <div className="grid grid-cols-2 gap-1.5">
                              {u.blocked ? (
                                <button
                                  onClick={() => handleToggleBlock(u.id, true, u.username)}
                                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200"
                                >
                                  <CheckCircle size={14} />
                                  <span>Unblock</span>
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleBlock(u.id, false, u.username)}
                                  className="w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200"
                                >
                                  <UserX size={14} />
                                  <span>Block</span>
                                </button>
                              )}
                              <button
                                onClick={() => changeRole(u.id, u.role, u.username)}
                                className={`w-full py-2 px-3 rounded-xl text-xs font-semibold transition-all shadow-2xs flex items-center justify-center gap-1.5 ${
                                  isAdmin
                                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                                    : 'bg-purple-600 text-white hover:bg-purple-700'
                                }`}
                              >
                                {isAdmin ? (
                                  <>
                                    <Users size={14} />
                                    <span>Demote</span>
                                  </>
                                ) : (
                                  <>
                                    <Shield size={14} />
                                    <span>Promote Admin</span>
                                  </>
                                )}
                              </button>
                            </div>
                            <button
                              onClick={() => openDeleteModal(u)}
                              className="w-full py-2 px-3 rounded-xl text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 transition-all shadow-2xs flex items-center justify-center gap-1.5"
                            >
                              <Trash2 size={14} />
                              <span>Delete Account</span>
                            </button>
                          </>
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

      {/* Delete Confirmation & Owner OTP Modal */}
      {deleteModal.open && deleteModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fadeIn">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-scaleUp">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-rose-500 to-red-600 p-6 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-xs flex items-center justify-center text-white">
                    <ShieldAlert size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Delete User Account</h3>
                    <p className="text-xs text-rose-100 mt-0.5">Permanent & Irreversible Action</p>
                  </div>
                </div>
                <button 
                  onClick={closeDeleteModal}
                  className="text-white/80 hover:text-white p-1 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5">
              {/* User Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    {deleteModal.user.username.slice(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{deleteModal.user.username}</div>
                    <div className="text-xs text-slate-500">{deleteModal.user.email}</div>
                  </div>
                </div>
                <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-200/80 text-slate-700">
                  {deleteModal.user.role === 'ROLE_ADMIN' ? 'Admin' : deleteModal.user.isGroupMember ? 'Group Member' : 'Member'}
                </span>
              </div>

              {/* Warning Note */}
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-2.5 text-xs text-amber-800">
                <AlertTriangle size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                <p>
                  Deleting this account will permanently remove access, profile, accounts, and budgets. This cannot be undone.
                </p>
              </div>

              {/* Error inside modal */}
              {deleteModal.error && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-700 font-semibold flex items-center gap-2">
                  <XCircle size={15} className="flex-shrink-0" />
                  <span>{deleteModal.error}</span>
                </div>
              )}

              {/* Step 1: Type Username */}
              <div className="space-y-1.5">
                <label className="block text-xs font-bold text-slate-700">
                  1. Type the exact username <span className="text-rose-600 font-mono font-bold select-all">"{deleteModal.user.username}"</span> to confirm:
                </label>
                <input
                  type="text"
                  value={deleteModal.typedUsername}
                  onChange={(e) => setDeleteModal(prev => ({ ...prev, typedUsername: e.target.value, error: '' }))}
                  placeholder={`Type "${deleteModal.user.username}" here`}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                />
              </div>

              {/* Step 2: Security OTP sent to Owner */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold text-slate-700">
                    2. Security Owner OTP:
                  </label>
                  <span className="text-[11px] text-slate-500 truncate max-w-[200px]" title={user?.email}>
                    to: {user?.email}
                  </span>
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    maxLength={6}
                    value={deleteModal.otp}
                    onChange={(e) => setDeleteModal(prev => ({ ...prev, otp: e.target.value.replace(/\D/g, ''), error: '' }))}
                    placeholder="6-digit OTP"
                    className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-mono tracking-widest text-center focus:bg-white focus:ring-2 focus:ring-rose-500/20 focus:border-rose-500 outline-none transition-all"
                  />
                  <button
                    type="button"
                    onClick={handleSendDeleteOtp}
                    disabled={deleteModal.sendingOtp || deleteModal.countdown > 0}
                    className="px-4 py-2.5 text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1.5 bg-slate-800 text-white hover:bg-slate-900 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                  >
                    {deleteModal.sendingOtp ? (
                      <>
                        <RefreshCw size={13} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : deleteModal.countdown > 0 ? (
                      <span>Resend ({deleteModal.countdown}s)</span>
                    ) : (
                      <>
                        <KeyRound size={13} />
                        <span>{deleteModal.otpSent ? 'Resend OTP' : 'Send OTP'}</span>
                      </>
                    )}
                  </button>
                </div>
                {deleteModal.otpSent && (
                  <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
                    <CheckCircle size={12} />
                    <span>Verification code sent to {user?.email}</span>
                  </p>
                )}
              </div>

              {/* Modal Actions */}
              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={closeDeleteModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleConfirmDelete}
                  disabled={
                    deleteModal.deleting ||
                    deleteModal.typedUsername !== deleteModal.user.username ||
                    deleteModal.otp.length !== 6
                  }
                  className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white shadow-sm transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {deleteModal.deleting ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Deleting Account...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 size={14} />
                      <span>Permanently Delete</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OwnerDashboard;
