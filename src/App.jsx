import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Toaster } from 'react-hot-toast'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { GoogleOAuthProvider } from '@react-oauth/google'
import Layout from './components/Layout'

// Lazy-loaded route components for instant mobile and desktop responsiveness
const Welcome = lazy(() => import('./pages/Welcome'))
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Transactions = lazy(() => import('./pages/Transactions'))
const RecurringTransactions = lazy(() => import('./pages/RecurringTransactions'))
const Categories = lazy(() => import('./pages/Categories'))
const Accounts = lazy(() => import('./pages/Accounts'))
const Budgets = lazy(() => import('./pages/Budgets'))
const Reports = lazy(() => import('./pages/Reports'))
const Profile = lazy(() => import('./pages/Profile'))
const AdminDashboard = lazy(() => import('./pages/AdminDashboard'))
const OwnerDashboard = lazy(() => import('./pages/OwnerDashboard'))
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'))
const TermsOfService = lazy(() => import('./pages/TermsOfService'))
const ContactUs = lazy(() => import('./pages/ContactUs'))
const AllNavigation = lazy(() => import('./pages/AllNavigation'))

// Premium lightweight loader
function PageLoader() {
  return (
    <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 animate-fadeIn">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-4 border-purple-200 border-t-purple-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-tr from-purple-600 to-pink-500 animate-pulse"></div>
        </div>
      </div>
      <p className="mt-3 text-xs font-semibold text-gray-400 tracking-wide uppercase">Loading</p>
    </div>
  )
}

function ProtectedRoute({ children, adminOnly = false, ownerOnly = false }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <PageLoader />
  }
  
  if (!user) {
    return <Navigate to="/login" />
  }
  
  // Owner-only route protection
  if (ownerOnly && user.role !== 'ROLE_OWNER') {
    return <Navigate to="/app/dashboard" />
  }
  
  // Admin-only route protection (Owner can also access)
  if (adminOnly && user.role !== 'ROLE_ADMIN' && user.role !== 'ROLE_OWNER') {
    return <Navigate to="/app/dashboard" />
  }
  
  return children
}

function PublicRoute({ children }) {
  const { user, loading } = useAuth()
  
  if (loading) {
    return <PageLoader />
  }
  
  return user ? <Navigate to="/app/dashboard" /> : children
}

function App() {
  const { i18n } = useTranslation()

  // Sync HTML dir/lang attribute whenever language changes (RTL for Arabic)
  useEffect(() => {
    document.documentElement.dir = i18n.language === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = i18n.language
  }, [i18n.language])

  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <AuthProvider>
        <Router basename="/" future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <div className="min-h-screen bg-gray-50 text-gray-900 antialiased selection:bg-purple-500 selection:text-white">
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/" element={<Welcome />} />
                <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/contact" element={<ContactUs />} />
                <Route path="/login" element={
                  <PublicRoute>
                    <Login />
                  </PublicRoute>
                } />
                <Route path="/register" element={
                  <PublicRoute>
                    <Register />
                  </PublicRoute>
                } />
                <Route path="/forgot-password" element={
                  <PublicRoute>
                    <ForgotPassword />
                  </PublicRoute>
                } />
                <Route path="/reset-password" element={
                  <PublicRoute>
                    <ResetPassword />
                  </PublicRoute>
                } />
                <Route path="/app" element={
                  <ProtectedRoute>
                    <Layout />
                  </ProtectedRoute>
                }>
                  <Route index element={<Navigate to="/app/dashboard" />} />
                  <Route path="dashboard" element={<Dashboard />} />
                  <Route path="transactions" element={<Transactions />} />
                  <Route path="recurring-transactions" element={<RecurringTransactions />} />
                  <Route path="categories" element={<Categories />} />
                  <Route path="accounts" element={<Accounts />} />
                  <Route path="budgets" element={<Budgets />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="profile" element={<Profile />} />
                  <Route path="admin" element={<AdminDashboard />} />
                  <Route path="owner" element={<OwnerDashboard />} />
                  <Route path="menu" element={<AllNavigation />} />
                </Route>
              </Routes>
            </Suspense>
            <Toaster
              position="top-right"
              toastOptions={{
                className: 'rounded-xl shadow-lg border border-gray-100 font-medium text-sm',
                duration: 3500,
              }}
            />
          </div>
        </Router>
      </AuthProvider>
    </GoogleOAuthProvider>
  )
}

export default App
