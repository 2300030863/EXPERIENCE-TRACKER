import axios from 'axios'
import { Capacitor } from '@capacitor/core'

// Base URL for backend API - prioritize VITE_API_URL, then native Capacitor / production HTTPS fallback
const isNativePlatform = typeof window !== 'undefined' && Capacitor?.isNativePlatform?.();

const API_BASE_URL = 
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD || isNativePlatform || (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1')
    ? 'https://renderexpensivetracker.onrender.com' 
    : 'http://localhost:8086/expense-tracker-api');

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000, // Increased to 30 seconds for Google OAuth
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor to add auth token conditionally
api.interceptors.request.use(
  (config) => {
    const publicEndpoints = ['/auth/login', '/auth/register', '/auth/google', '/auth/forgot-password', '/auth/reset-password', '/auth/otp-status']
    const publicGetEndpoints = ['/api/occupations', '/auth/otp-status']

    const isPublic = publicEndpoints.some((endpoint) => config.url.includes(endpoint))
    const isPublicGet = publicGetEndpoints.some((endpoint) => config.url.includes(endpoint)) && config.method === 'get'

    if (!isPublic && !isPublicGet) {
      const token = localStorage.getItem('token')
      if (token) {
        config.headers.Authorization = `Bearer ${token}`
      }
    }

    return config
  },
  (error) => Promise.reject(error)
)

// Response interceptor to handle auth errors gracefully without redirect loops
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const rawCode = error.response?.data?.code || (status ? String(status) : (error.code || 'ERR_NETWORK'))
    error.errorCode = rawCode
    error.displayError = `Error Code: ${rawCode}`

    const requestUrl = error.config?.url || ''
    const isAuthEndpoint = ['/auth/login', '/auth/google', '/auth/verify', '/auth/forgot-password', '/auth/reset-password', '/auth/send-otp'].some(u => requestUrl.includes(u))
    const isAuthPage = typeof window !== 'undefined' && (
      window.location.pathname === '/login' ||
      window.location.pathname === '/register' ||
      window.location.pathname === '/forgot-password' ||
      window.location.pathname === '/reset-password'
    )

    if (error.response?.status === 401 && !isAuthEndpoint && !isAuthPage) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// Auth API
export const authAPI = {
  login: (credentials) => {
    // Check if it's a Google login
    if (credentials.googleToken || credentials.isGoogleOAuth) {
      return api.post('/auth/google', credentials)
    }
    return api.post('/auth/login', credentials)
  },
  register: (userData) => api.post('/auth/register', userData),
  verifyToken: () => api.get('/auth/verify'),
  sendOtp: (email) => api.post('/auth/send-otp', { email }),
  verifyOtp: (email, otp) => api.post('/auth/verify-otp', { email, otp }),
  forgotPassword: (identifier) => api.post('/auth/forgot-password', { identifier }),
  resetPassword: (payload) => api.post('/auth/reset-password', payload),
  getOtpStatus: (identifier) => api.get('/auth/otp-status', { params: { identifier } }),
}

// Transaction API
export const transactionAPI = {
  getAll: (params) => api.get('/transactions', { params }),
  getById: (id) => api.get(`/transactions/${id}`),
  create: (data) => api.post('/transactions', data),
  update: (id, data) => api.put(`/transactions/${id}`, data),
  delete: (id) => api.delete(`/transactions/${id}`),
  search: (params) => api.get('/transactions/search', { params }),
}

// Category API
export const categoryAPI = {
  getAll: () => api.get('/categories'),
  getById: (id) => api.get(`/categories/${id}`),
  create: (data) => api.post('/categories', data),
  update: (id, data) => api.put(`/categories/${id}`, data),
  delete: (id) => api.delete(`/categories/${id}`),
}

// Occupation API
export const occupationAPI = {
  getAll: () => api.get('/api/occupations'),
  getById: (id) => api.get(`/api/occupations/${id}`),
  updateUserOccupation: (occupationId) => api.put('/api/occupations/update', { occupationId }),
}

// Account API
export const accountAPI = {
  getAll: () => api.get('/accounts'),
  getById: (id) => api.get(`/accounts/${id}`),
  create: (data) => api.post('/accounts', data),
  update: (id, data) => api.put(`/accounts/${id}`, data),
  delete: (id) => api.delete(`/accounts/${id}`),
}

// Budget API
export const budgetAPI = {
  getAll: () => api.get('/budgets'),
  getById: (id) => api.get(`/budgets/${id}`),
  create: (data) => api.post('/budgets', data),
  update: (id, data) => api.put(`/budgets/${id}`, data),
  delete: (id) => api.delete(`/budgets/${id}`),
}

// Analytics API
export const analyticsAPI = {
  getDashboard: (params) => api.get('/analytics/dashboard', { params }),
  getCategorySpending: (params) => api.get('/analytics/category-spending', { params }),
  getMonthlyTrend: (params) => api.get('/analytics/monthly-trend', { params }),
  getBudgetStatus: () => api.get('/analytics/budget-status'),
}

// Recurring Transaction API
export const recurringTransactionAPI = {
  getAll: () => api.get('/recurring-transactions'),
  getActive: () => api.get('/recurring-transactions/active'),
  getById: (id) => api.get(`/recurring-transactions/${id}`),
  create: (data) => api.post('/recurring-transactions', data),
  update: (id, data) => api.put(`/recurring-transactions/${id}`, data),
  delete: (id) => api.delete(`/recurring-transactions/${id}`),
  toggle: (id) => api.post(`/recurring-transactions/${id}/toggle`),
  execute: (id) => api.post(`/recurring-transactions/${id}/execute`),
}

// User Profile API
export const profileAPI = {
  get: () => api.get('/profile'),
  update: (data) => api.put('/profile', data),
  updateCountry: (data) => api.put('/profile', data),
  changePassword: (data) => api.post('/profile/change-password', data),
  deleteAccount: () => api.delete('/profile'),
}

// Admin API
export const adminAPI = {
  // User management
  getAllUsers: () => api.get('/admin/users'),
  getUserById: (id) => api.get(`/admin/users/${id}`),
  createUser: (data) => api.post('/admin/users', data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  requestDeleteOtp: (userId) => api.post('/admin/delete-account/request-otp', { userId }),
  deleteUserWithOtp: (userId, data) => api.post(`/admin/users/${userId}/delete-with-otp`, data),
  createAdminUser: (data) => api.post('/admin/create-admin', data),
  updateUserRole: (id, role) => api.put(`/admin/users/${id}/change-role`, { role }),
  getUserStats: () => api.get('/admin/users/stats'),
  promoteUserToAdmin: (id) => api.post(`/admin/users/${id}/promote`),
  blockUser: (id) => api.post(`/admin/users/${id}/block`),
  unblockUser: (id) => api.post(`/admin/users/${id}/unblock`),

  // Transaction management
  getAllTransactions: () => api.get('/admin/transactions'),
  getTransactionStats: () => api.get('/admin/transactions/stats'),

  // Category management
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // User Groups
  createUserGroup: (data) => api.post('/admin/user-groups', data),
  getUserGroups: () => api.get('/admin/user-groups'),
  assignUserToGroup: (userId, groupId) => api.put(`/admin/users/${userId}/group/${groupId}`),
  getUsersInGroup: (groupId) => api.get(`/admin/user-groups/${groupId}/users`),
  getUserAccounts: (userId) => api.get(`/admin/users/${userId}/accounts`),

  // System stats
  getSystemStats: () => api.get('/admin/dashboard/stats'),
}

// Pay & Track API
export const paymentAPI = {
  getAll: (params) => api.get('/payments', { params }),
  getById: (id) => api.get(`/payments/${id}`),
  create: (data) => api.post('/payments', data),
  initiateUpi: (data) => api.post('/payments/initiate-upi', data),
  retry: (id, data) => api.post(`/payments/${id}/retry`, data),
  updateStatus: (id, data) => api.patch(`/payments/${id}/status`, data),
  getAttempts: (id) => api.get(`/payments/${id}/attempts`),
  cancel: (id) => api.patch(`/payments/${id}/cancel`),
  getRecipients: (search) => api.get('/payments/recipients/list', { params: { search } }),
  getRecentRecipients: (limit = 8) => api.get('/payments/recipients/recent', { params: { limit } }),
  getFavoriteRecipients: () => api.get('/payments/recipients/favorites'),
  createRecipient: (data) => api.post('/payments/recipients', data),
  toggleFavoriteRecipient: (id) => api.patch(`/payments/recipients/${id}/favorite`),
  deleteRecipient: (id) => api.delete(`/payments/recipients/${id}`),
}

export default api
