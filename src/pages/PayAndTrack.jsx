import { useState, useEffect, useRef } from 'react'
import { 
  Send, 
  QrCode, 
  Search, 
  Wallet, 
  Tag, 
  Calendar, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Star, 
  Plus, 
  ArrowUpRight, 
  Filter, 
  Sparkles, 
  Users, 
  Store, 
  Home as HomeIcon, 
  Briefcase, 
  HelpCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  X,
  Copy,
  Check,
  RotateCcw,
  ExternalLink,
  ShieldCheck,
  Smartphone,
  Laptop,
  Apple,
  Eye,
  SlidersHorizontal,
  ClipboardPaste,
  ChevronDown,
  ChevronUp,
  Info
} from 'lucide-react'
import { Capacitor } from '@capacitor/core'
import { App } from '@capacitor/app'
import { paymentAPI, categoryAPI, accountAPI } from '../services/api'
import { getServerMessage } from '../utils/errorHandler'
import { formatCurrency as formatCurrencyUtil } from '../utils/currency'
import { 
  detectPlatform, 
  isValidUpiId, 
  buildUpiPaymentUri, 
  getUpiAppLinks, 
  generateUpiQrDataUrl,
  copyToClipboard,
  launchUpiApp
} from '../utils/upi'
import { format } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import QrScannerModal from '../components/QrScannerModal'
import PaymentDetailModal from '../components/PaymentDetailModal'

const STATUS_CONFIG = {
  SUCCESS: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  COMPLETED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  CASH_PAID: { label: 'Cash paid', color: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  FAILED: { label: 'Failed', color: 'bg-rose-100 text-rose-800 border-rose-200' },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  PENDING: { label: 'Pending', color: 'bg-blue-100 text-blue-800 border-blue-200' },
  UNKNOWN: { label: 'Unknown', color: 'bg-yellow-100 text-yellow-800 border-yellow-300' },
  UNVERIFIED: { label: 'Unverified', color: 'bg-amber-100 text-amber-800 border-amber-300' },
}

const RECIPIENT_TYPE_CONFIG = {
  FRIEND: { label: 'Friend', icon: Users, color: 'bg-blue-50 text-blue-700 border-blue-200' },
  FAMILY: { label: 'Family', icon: HomeIcon, color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  SHOP: { label: 'Shop', icon: Store, color: 'bg-amber-50 text-amber-700 border-amber-200' },
  MERCHANT: { label: 'Merchant', icon: Briefcase, color: 'bg-purple-50 text-purple-700 border-purple-200' },
  OTHER: { label: 'Other', icon: HelpCircle, color: 'bg-slate-50 text-slate-700 border-slate-200' },
}

const PRESET_AMOUNTS = [100, 500, 1000, 2000, 5000]

function PayAndTrack() {
  const { user } = useAuth()
  const platform = detectPlatform() // 'android', 'ios', 'desktop'

  // Data state
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [categories, setCategories] = useState([])
  const [accounts, setAccounts] = useState([])
  const [payments, setPayments] = useState([])
  const [recentRecipients, setRecentRecipients] = useState([])
  const [favoriteRecipients, setFavoriteRecipients] = useState([])
  
  // UI Tabs & Filters
  const [activeTab, setActiveTab] = useState('send') // 'send', 'history'
  const [showQrModal, setShowQrModal] = useState(false)
  const [showAddRecipientModal, setShowAddRecipientModal] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterMethod, setFilterMethod] = useState('ALL')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [filterCategory, setFilterCategory] = useState('')
  const [filterStartDate, setFilterStartDate] = useState('')
  const [filterEndDate, setFilterEndDate] = useState('')
  const [filterMinAmount, setFilterMinAmount] = useState('')
  const [filterMaxAmount, setFilterMaxAmount] = useState('')
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [selectedPaymentForDetail, setSelectedPaymentForDetail] = useState(null)

  // Step 3: UPI Lifecycle & Modal States
  // 1. Payment confirmation modal before launching
  const [pendingConfirmation, setPendingConfirmation] = useState(null)
  // 2. Active payment attempt (while launching external UPI app)
  const [activePaymentAttempt, setActivePaymentAttempt] = useState(null)
  const [launchModalTab, setLaunchModalTab] = useState('apps')
  // 3. Returned from payment app status screen
  const [returnedFromAppPayment, setReturnedFromAppPayment] = useState(null)
  // 4. Copied status tracking
  const [copiedKey, setCopiedKey] = useState('')
  // 5. User confirmation note (e.g. Bank name or UTR)
  const [userConfirmationNote, setUserConfirmationNote] = useState('')
  const [statusUpdating, setStatusUpdating] = useState(false)

  // Track visibility change to detect return from external UPI app
  const appSwitchTimestampRef = useRef(null)

  // Form State
  const [formData, setFormData] = useState({
    recipientName: '',
    paymentMethod: 'UPI',
    upiId: '',
    amount: '',
    categoryId: '',
    accountId: '',
    paymentDate: format(new Date(), 'yyyy-MM-dd'),
    notes: '',
    recipientType: 'FRIEND',
    isCashHandedOver: false,
    phone: '',
  })

  // Standalone recipient form
  const [newRecipientData, setNewRecipientData] = useState({
    name: '',
    upiId: '',
    phone: '',
    recipientType: 'FRIEND',
    isFavorite: false,
  })

  // Detect app switch & return from external UPI apps across Android, iOS, and Web
  useEffect(() => {
    const triggerReturnIfAway = () => {
      if (activePaymentAttempt && appSwitchTimestampRef.current) {
        const timeAway = Date.now() - appSwitchTimestampRef.current
        // If user was away for at least 1.2 seconds, they switched to the external app and returned
        if (timeAway > 1200) {
          handleUserReturnedFromApp(activePaymentAttempt)
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        triggerReturnIfAway()
      } else if (document.visibilityState === 'hidden') {
        appSwitchTimestampRef.current = Date.now()
      }
    }

    const handleWindowFocus = () => {
      triggerReturnIfAway()
    }

    document.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('focus', handleWindowFocus)

    // Capacitor Native Android & iOS app state listener
    let nativeListener = null
    try {
      if (Capacitor && typeof Capacitor.isNativePlatform === 'function' && Capacitor.isNativePlatform()) {
        App.addListener('appStateChange', (state) => {
          if (state && state.isActive) {
            triggerReturnIfAway()
          } else {
            appSwitchTimestampRef.current = Date.now()
          }
        }).then((l) => {
          nativeListener = l
        }).catch(() => {})
      }
    } catch (_) {}

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      window.removeEventListener('focus', handleWindowFocus)
      if (nativeListener && typeof nativeListener.remove === 'function') {
        nativeListener.remove()
      }
    }
  }, [activePaymentAttempt])

  useEffect(() => {
    loadInitialData()
  }, [])

  const loadInitialData = async () => {
    setLoading(true)
    try {
      const [categoriesRes, accountsRes, paymentsRes, recentRes, favoritesRes] = await Promise.all([
        categoryAPI.getAll().catch(() => ({ data: [] })),
        accountAPI.getAll().catch(() => ({ data: [] })),
        paymentAPI.getAll({ size: 50 }).catch(() => ({ data: { content: [] } })),
        paymentAPI.getRecentRecipients(10).catch(() => ({ data: [] })),
        paymentAPI.getFavoriteRecipients().catch(() => ({ data: [] })),
      ])

      const fetchedCategories = categoriesRes.data || []
      const fetchedAccounts = accountsRes.data || []
      setCategories(fetchedCategories)
      setAccounts(fetchedAccounts)
      setPayments(paymentsRes.data?.content || paymentsRes.data || [])
      setRecentRecipients(recentRes.data || [])
      setFavoriteRecipients(favoritesRes.data || [])

      if (fetchedCategories.length > 0 && !formData.categoryId) {
        setFormData((prev) => ({ ...prev, categoryId: String(fetchedCategories[0].id) }))
      }
      if (fetchedAccounts.length > 0 && !formData.accountId) {
        setFormData((prev) => ({ ...prev, accountId: String(fetchedAccounts[0].id) }))
      }
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to load Pay & Track data'))
    } finally {
      setLoading(false)
    }
  }

  const reloadPayments = async () => {
    try {
      const res = await paymentAPI.getAll({ size: 50 })
      setPayments(res.data?.content || res.data || [])
    } catch (err) {
      console.error('Failed to reload payments:', err)
    }
  }

  const reloadRecipients = async () => {
    try {
      const [recentRes, favoritesRes] = await Promise.all([
        paymentAPI.getRecentRecipients(10),
        paymentAPI.getFavoriteRecipients(),
      ])
      setRecentRecipients(recentRes.data || [])
      setFavoriteRecipients(favoritesRes.data || [])
    } catch (err) {
      console.error('Failed to reload recipients:', err)
    }
  }

  // Copy helper
  const handleCopy = async (text, key) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedKey(key)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedKey(''), 2500)
    } else {
      toast.error('Failed to copy')
    }
  }

  // Pre-fill form from selected recipient
  const handleSelectRecipient = (rec) => {
    setFormData((prev) => ({
      ...prev,
      recipientName: rec.name,
      upiId: rec.upiId || prev.upiId,
      recipientType: rec.recipientType || 'FRIEND',
      paymentMethod: rec.upiId ? 'UPI' : prev.paymentMethod,
    }))
    setActiveTab('send')
    toast.success(`Recipient "${rec.name}" selected`)
  }

  const handleToggleFavorite = async (recipientId) => {
    try {
      await paymentAPI.toggleFavoriteRecipient(recipientId)
      await reloadRecipients()
      toast.success('Favorite updated')
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to update favorite'))
    }
  }

  const handleAddPresetAmount = (preset) => {
    const current = parseFloat(formData.amount) || 0
    setFormData((prev) => ({ ...prev, amount: String(current + preset) }))
  }

  // Handle scanned QR code payment confirmation
  const handleQrScanSuccess = (scanData) => {
    const cat = categories.find((c) => Number(c.id) === Number(scanData.categoryId))
    const acc = accounts.find((a) => Number(a.id) === Number(scanData.accountId))

    setPendingConfirmation({
      recipientName: scanData.recipientName,
      upiId: scanData.upiId,
      amount: scanData.amount,
      categoryId: scanData.categoryId,
      categoryName: cat?.name || 'Scanned Merchant',
      accountId: scanData.accountId,
      accountName: acc?.name || 'Default Account',
      paymentDate: format(new Date(), 'yyyy-MM-dd'),
      notes: scanData.notes,
      recipientType: scanData.recipientType || 'SHOP',
    })
    toast.success(`Scanned UPI details for "${scanData.recipientName}" loaded. Please confirm to proceed.`)
  }

  // Form submission: If Cash, process directly. If UPI, show final Confirmation Screen!
  const handleSubmitForm = async (e) => {
    e.preventDefault()
    if (submitting) return

    const amountVal = parseFloat(formData.amount)
    if (!amountVal || amountVal <= 0) {
      toast.error('Please enter a valid amount greater than 0')
      return
    }

    if (formData.paymentMethod === 'UPI') {
      if (!formData.upiId || !formData.upiId.trim()) {
        toast.error('Recipient UPI ID is required')
        return
      }
      if (!isValidUpiId(formData.upiId.trim())) {
        toast.error('Invalid UPI ID format. Standard format is name@bank (e.g. rahul@okaxis)')
        return
      }
      if (amountVal > 100000) {
        toast.error('UPI transactions cannot exceed NPCI limit of ₹1,00,000')
        return
      }

      // Selected category and account names for confirmation preview
      const cat = categories.find((c) => String(c.id) === String(formData.categoryId))
      const acc = accounts.find((a) => String(a.id) === String(formData.accountId))

      // Present final payment confirmation modal before initiating/launching
      setPendingConfirmation({
        recipientName: formData.recipientName.trim(),
        upiId: formData.upiId.trim(),
        amount: amountVal,
        categoryId: Number(formData.categoryId),
        categoryName: cat?.name || 'General',
        accountId: Number(formData.accountId),
        accountName: acc?.name || 'Default Account',
        paymentDate: formData.paymentDate,
        notes: formData.notes.trim(),
        recipientType: formData.recipientType,
      })
      return
    }

    // Cash Payment handling
    if (formData.paymentMethod === 'CASH') {
      if (amountVal > 200000) {
        toast.error('Cash transactions cannot exceed ₹2,00,000')
        return
      }

      setSubmitting(true)
      try {
        await paymentAPI.create({
          recipientName: formData.recipientName.trim(),
          paymentMethod: 'CASH',
          amount: amountVal,
          categoryId: Number(formData.categoryId),
          accountId: Number(formData.accountId),
          paymentDate: formData.paymentDate,
          notes: formData.notes.trim(),
          recipientType: formData.recipientType,
          isCashHandedOver: formData.isCashHandedOver,
        })

        if (formData.isCashHandedOver) {
          toast.success(`Cash expense of ₹${amountVal} recorded as CASH_PAID in ledger!`, { duration: 4000 })
        } else {
          toast.success(`Cash payment recorded as PENDING`, { duration: 3500 })
        }

        setFormData((prev) => ({
          ...prev,
          recipientName: '',
          upiId: '',
          amount: '',
          notes: '',
          isCashHandedOver: false,
        }))
        await Promise.all([reloadPayments(), reloadRecipients()])
        setActiveTab('history')
      } catch (err) {
        toast.error(getServerMessage(err, 'Failed to save cash payment'))
      } finally {
        setSubmitting(false)
      }
    }
  }

  // Step 3: Confirmed by user -> Call backend initiateUpi and trigger UPI App Intent Launch
  const handleConfirmAndLaunchUpi = async () => {
    if (!pendingConfirmation || submitting) return

    setSubmitting(true)
    try {
      const idempotencyKey = `UPI-${user?.id}-${Date.now()}`
      const res = await paymentAPI.initiateUpi({
        ...pendingConfirmation,
        platform,
        idempotencyKey,
      })

      const { payment, upiUri, referenceId } = res.data
      const qrDataUrl = await generateUpiQrDataUrl(upiUri)

      // Close confirmation dialog and open Launching modal
      setPendingConfirmation(null)
      setActivePaymentAttempt({
        payment,
        upiUri,
        referenceId,
        qrDataUrl,
        appLinks: getUpiAppLinks({
          upiId: payment.upiId,
          recipientName: payment.recipientName,
          amount: payment.amount,
          note: payment.notes,
          referenceId,
        }),
      })

      // Reset form
      setFormData((prev) => ({
        ...prev,
        recipientName: '',
        upiId: '',
        amount: '',
        notes: '',
      }))

      await Promise.all([reloadPayments(), reloadRecipients()])

      // On Android / mobile, attempt opening the universal UPI Intent link
      if (platform === 'android' || platform === 'ios') {
        appSwitchTimestampRef.current = Date.now()
        await launchUpiApp({ url: upiUri, appName: 'UPI' })
      }
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to initiate UPI payment'))
    } finally {
      setSubmitting(false)
    }
  }

  // User clicked specific app launcher button
  const handleLaunchSpecificApp = async (url, appName = 'UPI App') => {
    if (!url) return
    appSwitchTimestampRef.current = Date.now()

    const currentPlatform = detectPlatform()
    const genericFallback = activePaymentAttempt?.appLinks?.generic || activePaymentAttempt?.upiUri

    // Always copy UPI ID to clipboard so the user has it ready
    if (activePaymentAttempt?.payment?.upiId) {
      await copyToClipboard(activePaymentAttempt.payment.upiId)
    }

    // Attempt launch via universal helper (with automatic generic fallback)
    await launchUpiApp({
      url,
      fallbackUrl: genericFallback,
      appName,
    })

    if (currentPlatform === 'desktop') {
      toast(
        (t) => (
          <div className="text-xs space-y-1">
            <p className="font-bold text-slate-900">UPI ID Copied ({appName})</p>
            <p className="text-slate-600">
              UPI apps cannot run directly on PC. UPI ID is copied! You can also scan the QR code with your phone camera.
            </p>
          </div>
        ),
        { icon: '📱', duration: 4000 }
      )
    } else {
      toast.success(`Opening ${appName}...`, { duration: 2500 })
    }
  }

  // Called when user returns from external UPI app (or clicks "I've returned")
  const handleUserReturnedFromApp = async (attempt) => {
    const payment = attempt.payment
    const refId = attempt.referenceId || payment?.referenceId || `UPI-TXN-${payment?.id || Date.now()}`
    setUserConfirmationNote(refId)
    setActivePaymentAttempt(null)

    // Attempt non-intrusive clipboard auto-read if user copied a 12-digit bank UTR
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const clip = await navigator.clipboard.readText()
        if (clip && typeof clip === 'string') {
          const trimmed = clip.trim()
          if (/^\d{12}$/.test(trimmed) || /^(UPI|TXN)[0-9A-Za-z_-]{6,}$/i.test(trimmed)) {
            setUserConfirmationNote(trimmed)
            toast.success(`Autofilled bank reference: ${trimmed}`)
          }
        }
      }
    } catch (_) {}

    // Automatically transition status to UNVERIFIED on backend
    try {
      const res = await paymentAPI.updateStatus(payment.id, { status: 'UNVERIFIED' })
      setReturnedFromAppPayment({ ...res.data, referenceId: refId })
      await reloadPayments()
    } catch (_) {
      setReturnedFromAppPayment({ ...payment, status: 'UNVERIFIED', referenceId: refId })
    }
  }

  // 1-Tap Paste UTR / Transaction ID from clipboard
  const handlePasteClipboard = async () => {
    try {
      if (navigator.clipboard && navigator.clipboard.readText) {
        const text = await navigator.clipboard.readText()
        if (text && text.trim()) {
          setUserConfirmationNote(text.trim())
          toast.success('Pasted from clipboard!')
          return
        }
      }
      toast.error('Clipboard is empty')
    } catch (_) {
      toast.error('Tap allow when prompted to paste from clipboard')
    }
  }

  // User resolves payment result on the status screen
  const handleResolvePaymentStatus = async (targetStatus) => {
    if (!returnedFromAppPayment || statusUpdating) return

    setStatusUpdating(true)
    try {
      const res = await paymentAPI.updateStatus(returnedFromAppPayment.id, {
        status: targetStatus,
        confirmationNotes: userConfirmationNote.trim() || returnedFromAppPayment.referenceId || '',
      })

      if (targetStatus === 'SUCCESS') {
        toast.success(`Payment verified! Recorded ₹${res.data.amount} in your expense ledger.`, { duration: 4500 })
      } else if (targetStatus === 'FAILED') {
        toast.error('Payment marked as Failed.')
      } else if (targetStatus === 'UNKNOWN') {
        toast('Marked as Unknown. Please verify with your bank statement before retrying.', { icon: 'ℹ️' })
      }

      setReturnedFromAppPayment(null)
      setUserConfirmationNote('')
      await reloadPayments()
      setActiveTab('history')
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to update payment status'))
    } finally {
      setStatusUpdating(false)
    }
  }

  // Retry payment action
  const handleRetryPayment = async (payment) => {
    if (!payment) return

    // Never retry completed transactions
    if (payment.status === 'SUCCESS' || payment.status === 'CASH_PAID') {
      toast.error('Completed payments cannot be retried')
      return
    }

    // Warn the user to check their bank/payment app before retrying if the status is unknown
    if (payment.status === 'UNKNOWN') {
      const confirmed = window.confirm(
        '⚠️ Warning: Payment status is UNKNOWN.\n\nMoney may have already been debited from your bank account.\n\nPlease check your bank statement or SMS before retrying to prevent an accidental duplicate payment.\n\nDo you want to retry this payment now?'
      )
      if (!confirmed) return
    }

    try {
      const res = await paymentAPI.retry(payment.id, { platform })
      const { payment: updatedPayment, upiUri, referenceId } = res.data
      const qrDataUrl = await generateUpiQrDataUrl(upiUri)

      setActivePaymentAttempt({
        payment: updatedPayment,
        upiUri,
        referenceId,
        qrDataUrl,
        appLinks: getUpiAppLinks({
          upiId: updatedPayment.upiId,
          recipientName: updatedPayment.recipientName,
          amount: updatedPayment.amount,
          note: updatedPayment.notes,
          referenceId,
        }),
      })

      if (platform === 'android' || platform === 'ios') {
        appSwitchTimestampRef.current = Date.now()
        await launchUpiApp({ url: upiUri, appName: 'UPI' })
      }

      toast.success(`Retrying payment (Attempt #${updatedPayment.attemptCount})`)
      await reloadPayments()
    } catch (err) {
      toast.error(getServerMessage(err, 'Cannot retry payment'))
    }
  }

  // Cancel pending payment
  const handleCancelPayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to cancel this payment?')) return
    try {
      await paymentAPI.cancel(paymentId)
      toast.success('Payment cancelled')
      await reloadPayments()
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to cancel payment'))
    }
  }

  // Create standalone recipient
  const handleCreateRecipient = async (e) => {
    e.preventDefault()
    if (!newRecipientData.name.trim()) {
      toast.error('Recipient name is required')
      return
    }

    try {
      await paymentAPI.createRecipient(newRecipientData)
      toast.success('Recipient saved successfully!')
      setShowAddRecipientModal(false)
      setNewRecipientData({
        name: '',
        upiId: '',
        phone: '',
        recipientType: 'FRIEND',
        isFavorite: false,
      })
      await reloadRecipients()
    } catch (err) {
      toast.error(getServerMessage(err, 'Failed to save recipient'))
    }
  }

  const handleResetHistoryFilters = () => {
    setSearchQuery('')
    setFilterMethod('ALL')
    setFilterStatus('ALL')
    setFilterCategory('')
    setFilterStartDate('')
    setFilterEndDate('')
    setFilterMinAmount('')
    setFilterMaxAmount('')
  }

  const hasActiveHistoryFilters = Boolean(
    searchQuery.trim() ||
    filterMethod !== 'ALL' ||
    filterStatus !== 'ALL' ||
    filterCategory ||
    filterStartDate ||
    filterEndDate ||
    filterMinAmount ||
    filterMaxAmount
  )

  const formatPaymentDateTime = (dateStr, createdAtStr) => {
    if (createdAtStr) {
      try {
        return format(new Date(createdAtStr), 'MMM dd, yyyy • hh:mm a')
      } catch (_) {}
    }
    if (dateStr) {
      try {
        return format(new Date(dateStr), 'MMM dd, yyyy')
      } catch (_) {}
    }
    return dateStr || 'N/A'
  }

  // Multi-dimensional filtered payments list (Step 5)
  const filteredPayments = payments.filter((p) => {
    // 1. Payment Method filter
    if (filterMethod !== 'ALL' && p.paymentMethod !== filterMethod) return false

    // 2. Exact status filter
    if (filterStatus !== 'ALL') {
      if (filterStatus === 'CONFIRMED' && p.status !== 'SUCCESS' && p.status !== 'COMPLETED') return false
      if (filterStatus === 'CASH_PAID' && p.status !== 'CASH_PAID') return false
      if (filterStatus === 'PENDING' && p.status !== 'PENDING') return false
      if (filterStatus === 'UNKNOWN' && p.status !== 'UNKNOWN') return false
      if (filterStatus === 'UNVERIFIED' && p.status !== 'UNVERIFIED') return false
      if (filterStatus === 'FAILED' && p.status !== 'FAILED') return false
      if (filterStatus === 'CANCELLED' && p.status !== 'CANCELLED') return false
    }

    // 3. Category filter
    if (filterCategory && String(p.categoryId) !== String(filterCategory)) return false

    // 4. Date range filter
    if (filterStartDate && p.paymentDate < filterStartDate) return false
    if (filterEndDate && p.paymentDate > filterEndDate) return false

    // 5. Amount range filter
    const amt = parseFloat(p.amount) || 0
    if (filterMinAmount && amt < parseFloat(filterMinAmount)) return false
    if (filterMaxAmount && amt > parseFloat(filterMaxAmount)) return false

    // 6. Search query (search recipient, UPI ID, note, reference ID, category name)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      const matchName = p.recipientName?.toLowerCase().includes(q)
      const matchUpi = p.upiId?.toLowerCase().includes(q)
      const matchNotes = p.notes?.toLowerCase().includes(q)
      const matchRef = p.referenceId?.toLowerCase().includes(q)
      const matchCat = p.categoryName?.toLowerCase().includes(q)
      if (!matchName && !matchUpi && !matchNotes && !matchRef && !matchCat) return false
    }
    return true
  })

  const totalAmountPaid = payments
    .filter((p) => p.status === 'CASH_PAID' || p.status === 'SUCCESS' || p.status === 'COMPLETED')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  const totalAmountPending = payments
    .filter((p) => p.status === 'PENDING' || p.status === 'UNVERIFIED' || p.status === 'UNKNOWN')
    .reduce((sum, p) => sum + (p.amount || 0), 0)

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6">
        <div className="w-10 h-10 border-4 border-slate-200 border-t-slate-900 rounded-full animate-spin"></div>
        <p className="mt-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Loading Pay & Track...
        </p>
    </div>
    )
  }

  return (
    <div className="max-w-6xl mx-auto space-y-6 pb-12">
      {/* 1. Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white rounded-2xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-semibold tracking-wide uppercase mb-3 border border-indigo-400/20">
              <Sparkles size={13} />
              <span>Real UPI Intent & Instant Expense Tracking</span>
          </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Pay & Track
            </h1>
            <p className="text-sm sm:text-base text-slate-300 mt-1.5 max-w-xl">
              Pay friends, family, shops & merchants using your installed UPI apps (GPay, PhonePe, Paytm, BHIM) or physical Cash.
            </p>
        </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={() => setShowQrModal(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-sm transition-all border border-white/15 backdrop-blur-sm active:scale-95 shadow-sm"
            >
              <QrCode size={18} />
              <span>Scan UPI QR</span>
            </button>
            <button
              onClick={() => {
                setActiveTab('send')
                window.scrollTo({ top: 300, behavior: 'smooth' })
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white text-slate-950 font-semibold text-sm hover:bg-slate-100 transition-all active:scale-95 shadow-sm"
            >
              <Send size={16} />
              <span>Send Money</span>
            </button>
        </div>
      </div>

        {/* Platform detection indicator & KPI strip */}
        <div className="mt-6 pt-5 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-xs text-slate-300">
            {platform === 'android' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/20 font-medium">
                <Smartphone size={14} /> Android Device: Direct UPI Intent Supported
              </span>
            )}
            {platform === 'ios' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-sky-500/20 text-sky-300 border border-sky-400/20 font-medium">
                <Apple size={14} /> iOS Device: Launchable UPI Links + Copy Fallback
              </span>
            )}
            {platform === 'desktop' && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/20 font-medium">
                <Laptop size={14} /> Desktop Browser: Quick Copy VPA & Manual Tracking
              </span>
            )}
        </div>

          <div className="flex items-center gap-6">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Verified / Completed</span>
              <span className="text-base sm:text-lg font-bold text-emerald-400">
                ₹{totalAmountPaid.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
          </div>
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Pending / Unverified</span>
              <span className="text-base sm:text-lg font-bold text-amber-400">
                ₹{totalAmountPending.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
          </div>
        </div>
      </div>
    </div>

      {/* 2. Recent & Favorite Recipients Strip */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-slate-700" />
            <h2 className="text-base font-bold text-slate-900">Recent & Favorite Recipients</h2>
        </div>
          <button
            onClick={() => setShowAddRecipientModal(true)}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 px-2.5 py-1.5 rounded-lg hover:bg-indigo-50 transition-colors"
          >
            <Plus size={14} />
            <span>Add New</span>
          </button>
      </div>

        {recentRecipients.length === 0 && favoriteRecipients.length === 0 ? (
          <div className="text-center py-6 text-slate-400 text-xs">
            No recipients yet. Complete your first payment or add a recipient to quickly pay again.
        </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
            {/* Favorites first */}
            {favoriteRecipients.map((rec) => {
              const TypeIcon = RECIPIENT_TYPE_CONFIG[rec.recipientType]?.icon || Users
              return (
                <div
                  key={`fav-${rec.id}`}
                  onClick={() => handleSelectRecipient(rec)}
                  className="flex-shrink-0 w-36 sm:w-40 p-3 rounded-xl border border-amber-200 bg-amber-50/40 hover:bg-amber-50 hover:border-amber-300 transition-all cursor-pointer relative group text-left"
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleToggleFavorite(rec.id)
                    }}
                    className="absolute top-2 right-2 text-amber-500 hover:scale-110 transition-transform"
                    title="Toggle Favorite"
                  >
                    <Star size={14} fill="currentColor" />
                  </button>
                  <div className="w-10 h-10 rounded-full bg-amber-500 text-white font-bold flex items-center justify-center text-sm mb-2 shadow-xs">
                    {rec.name?.[0]?.toUpperCase() || 'R'}
                </div>
                  <div className="font-semibold text-slate-900 text-xs truncate">{rec.name}</div>
                  <div className="text-[10px] text-slate-500 truncate mt-0.5">
                    {rec.upiId || 'Cash Contact'}
                </div>
                  <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-700 font-medium">
                    <TypeIcon size={11} />
                    <span>{RECIPIENT_TYPE_CONFIG[rec.recipientType]?.label || 'Friend'}</span>
                </div>
              </div>
              )
            })}

            {/* Recents */}
            {recentRecipients
              .filter((rec) => !favoriteRecipients.some((f) => f.id === rec.id))
              .map((rec) => {
                const TypeIcon = RECIPIENT_TYPE_CONFIG[rec.recipientType]?.icon || Users
                return (
                  <div
                    key={`rec-${rec.id}`}
                    onClick={() => handleSelectRecipient(rec)}
                    className="flex-shrink-0 w-36 sm:w-40 p-3 rounded-xl border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/30 transition-all cursor-pointer relative group text-left"
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFavorite(rec.id)
                      }}
                      className="absolute top-2 right-2 text-slate-300 hover:text-amber-500 transition-colors"
                      title="Star as Favorite"
                    >
                      <Star size={14} />
                    </button>
                    <div className="w-10 h-10 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm mb-2 shadow-xs">
                      {rec.name?.[0]?.toUpperCase() || 'R'}
                  </div>
                    <div className="font-semibold text-slate-900 text-xs truncate">{rec.name}</div>
                    <div className="text-[10px] text-slate-500 truncate mt-0.5">
                      {rec.upiId || 'Cash Contact'}
                  </div>
                    <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-500 font-medium">
                      <TypeIcon size={11} />
                      <span>{RECIPIENT_TYPE_CONFIG[rec.recipientType]?.label || 'Friend'}</span>
                  </div>
                </div>
                )
              })}
        </div>
        )}
    </div>

      {/* 3. Navigation Tabs */}
      <div className="flex border-b border-slate-200">
        <button
          onClick={() => setActiveTab('send')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'send'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Send size={16} />
          <span>Send Money</span>
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm border-b-2 transition-all ${
            activeTab === 'history'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Clock size={16} />
          <span>Payment History ({filteredPayments.length})</span>
        </button>
    </div>

      {/* 4. Tab 1: Send Money Form */}
      {activeTab === 'send' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <form onSubmit={handleSubmitForm} className="space-y-6">
            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                1. Select Payment Method *
              </label>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 max-w-md">
                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'UPI' }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    formData.paymentMethod === 'UPI'
                      ? 'border-indigo-600 bg-indigo-50/50 text-indigo-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${formData.paymentMethod === 'UPI' ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Sparkles size={18} />
                </div>
                  <div>
                    <div className="text-sm font-bold">UPI Payment</div>
                    <div className="text-[11px] text-slate-500 font-normal">GPay, PhonePe, Paytm, BHIM</div>
                </div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, paymentMethod: 'CASH' }))}
                  className={`flex items-center gap-3 p-3.5 rounded-xl border-2 transition-all text-left ${
                    formData.paymentMethod === 'CASH'
                      ? 'border-emerald-600 bg-emerald-50/50 text-emerald-950 font-bold shadow-xs'
                      : 'border-slate-200 hover:border-slate-300 text-slate-700'
                  }`}
                >
                  <div className={`p-2 rounded-lg ${formData.paymentMethod === 'CASH' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Wallet size={18} />
                </div>
                  <div>
                    <div className="text-sm font-bold">Cash Payment</div>
                    <div className="text-[11px] text-slate-500 font-normal">Physical Cash Note</div>
                </div>
                </button>
            </div>
          </div>

            {/* Recipient Type Selector */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                2. Paying To *
              </label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(RECIPIENT_TYPE_CONFIG).map(([key, config]) => {
                  const Icon = config.icon
                  const isSelected = formData.recipientType === key
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, recipientType: key }))}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                        isSelected
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon size={14} />
                      <span>{config.label}</span>
                    </button>
                  )
                })}
            </div>
          </div>

            {/* Recipient Details */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Recipient Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma, Kirana Store, Mom"
                  value={formData.recipientName}
                  onChange={(e) => setFormData((prev) => ({ ...prev, recipientName: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
            </div>

              {formData.paymentMethod === 'UPI' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Recipient UPI ID (VPA) *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. rahul@okaxis or 9876543210@paytm"
                    value={formData.upiId}
                    onChange={(e) => setFormData((prev) => ({ ...prev, upiId: e.target.value }))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium font-mono"
                  />
                  <p className="mt-1 text-[11px] text-slate-400">
                    NPCI standard UPI virtual payment address
                  </p>
              </div>
              )}
          </div>

            {/* Amount Section */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Amount (INR) *
              </label>
              <div className="relative max-w-md">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-lg font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={formData.paymentMethod === 'UPI' ? '100000' : '200000'}
                  required
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                  className="w-full pl-9 pr-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-lg font-bold text-slate-900"
                />
            </div>

              {/* Quick preset chips */}
              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <span className="text-xs text-slate-400 font-medium">Quick Add:</span>
                {PRESET_AMOUNTS.map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => handleAddPresetAmount(preset)}
                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-colors"
                  >
                    +₹{preset}
                  </button>
                ))}
            </div>
          </div>

            {/* Category and Account selection */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Expense Category *
                </label>
                <select
                  required
                  value={formData.categoryId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, categoryId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium bg-white"
                >
                  <option value="" disabled>Select category</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
            </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Account *
                </label>
                <select
                  required
                  value={formData.accountId}
                  onChange={(e) => setFormData((prev) => ({ ...prev, accountId: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium bg-white"
                >
                  <option value="" disabled>Select account</option>
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>
                      {a.name} (₹{parseFloat(a.balance || 0).toFixed(2)})
                    </option>
                  ))}
                </select>
            </div>
          </div>

            {/* Date and Notes */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Date *
                </label>
                <input
                  type="date"
                  required
                  value={formData.paymentDate}
                  onChange={(e) => setFormData((prev) => ({ ...prev, paymentDate: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
            </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Payment Note (Optional)
                </label>
                <input
                  type="text"
                  maxLength={500}
                  placeholder="e.g. Dinner bill, Grocery items, Electricity"
                  value={formData.notes}
                  onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 text-sm font-medium"
                />
            </div>
          </div>

            {/* Cash Confirmation Box */}
            {formData.paymentMethod === 'CASH' && (
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 space-y-2">
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isCashHandedOver}
                    onChange={(e) => setFormData((prev) => ({ ...prev, isCashHandedOver: e.target.checked }))}
                    className="mt-0.5 w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <div className="text-xs text-emerald-950">
                    <span className="font-bold">Confirm Cash Handed Over:</span> I verify that physical cash was handed over to the recipient.
                </div>
                </label>
                <p className="text-[11px] text-emerald-700 pl-6 leading-relaxed">
                  When confirmed, an expense transaction is automatically recorded in your ledger with status{' '}
                  <span className="font-bold text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">CASH_PAID</span> and your account balance is deducted. If unchecked, it will be saved as PENDING.
                </p>
            </div>
            )}

            {/* Submit Button */}
            <div className="pt-2 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setFormData({
                  recipientName: '',
                  paymentMethod: 'UPI',
                  upiId: '',
                  amount: '',
                  categoryId: categories[0]?.id ? String(categories[0].id) : '',
                  accountId: accounts[0]?.id ? String(accounts[0].id) : '',
                  paymentDate: format(new Date(), 'yyyy-MM-dd'),
                  notes: '',
                  recipientType: 'FRIEND',
                  isCashHandedOver: false,
                  phone: '',
                })}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-sm transition-colors"
              >
                Reset
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm transition-all active:scale-95 shadow-sm disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>{formData.paymentMethod === 'UPI' ? 'Pay via UPI' : 'Save Cash Expense'}</span>
                  </>
                )}
              </button>
          </div>
          </form>
      </div>
      )}

      {/* 5. Tab 2: Payment History & Search */}
      {activeTab === 'history' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  placeholder="Search recipient name, UPI ID, note, reference ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
            </div>

              <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
                <select
                  value={filterMethod}
                  onChange={(e) => setFilterMethod(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="ALL">All Methods</option>
                  <option value="UPI">UPI Only</option>
                  <option value="CASH">Cash Only</option>
                </select>

                <select
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                  className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 bg-white"
                >
                  <option value="ALL">All Statuses</option>
                  <option value="CONFIRMED">Confirmed</option>
                  <option value="CASH_PAID">Cash paid</option>
                  <option value="PENDING">Pending</option>
                  <option value="UNVERIFIED">Unverified</option>
                  <option value="UNKNOWN">Unknown</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                </select>

                <button
                  onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                  className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-colors ${
                    showAdvancedFilters || filterCategory || filterStartDate || filterEndDate || filterMinAmount || filterMaxAmount
                      ? 'border-indigo-300 bg-indigo-50 text-indigo-700'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                  title="Toggle more filters"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                </button>

                <button
                  onClick={reloadPayments}
                  className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                  title="Refresh Payments"
                >
                  <RefreshCw size={15} />
                </button>

                {hasActiveHistoryFilters && (
                  <button
                    onClick={handleResetHistoryFilters}
                    className="p-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors"
                    title="Reset all filters"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
            </div>
          </div>

            {/* Advanced Filters Panel: Category, Date Range, Amount Range */}
            {showAdvancedFilters && (
              <div className="pt-3 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Category</label>
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    <option value="">All Categories</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
              </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">From Date</label>
                  <input
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
              </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">To Date</label>
                  <input
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
              </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Min Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Min ₹"
                    min="0"
                    value={filterMinAmount}
                    onChange={(e) => setFilterMinAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
              </div>

                <div>
                  <label className="block text-[11px] font-medium text-slate-500 mb-1">Max Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="Max ₹"
                    min="0"
                    value={filterMaxAmount}
                    onChange={(e) => setFilterMaxAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50/50 text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
              </div>
            </div>
            )}
        </div>

          {/* Transactions List */}
          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto mb-3">
                <Clock size={20} />
            </div>
              <h3 className="font-bold text-slate-900 text-sm">No payment records found</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                {hasActiveHistoryFilters ? 'No payments matched your search filters.' : 'Use the Send Money tab to make your first tracked payment.'}
              </p>
              {hasActiveHistoryFilters && (
                <button
                  onClick={handleResetHistoryFilters}
                  className="mt-3 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100"
                >
                  <RotateCcw size={12} />
                  <span>Clear Filters</span>
                </button>
              )}
          </div>
          ) : (
            <div className="space-y-3">
              {filteredPayments.map((p) => {
                const statusMeta = STATUS_CONFIG[p.status] || { label: p.status, color: 'bg-slate-100 text-slate-700 border-slate-200' }
                const isPending = p.status === 'PENDING'
                const isUnverified = p.status === 'UNVERIFIED'
                const isUnknown = p.status === 'UNKNOWN'
                const isFailed = p.status === 'FAILED'
                const isCancelled = p.status === 'CANCELLED'
                const isRetryEligible = p.paymentMethod === 'UPI' && ['PENDING', 'UNVERIFIED', 'UNKNOWN', 'FAILED', 'CANCELLED'].includes(p.status)

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-slate-200/80 p-4 sm:p-5 shadow-xs hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer group"
                    onClick={() => setSelectedPaymentForDetail(p)}
                  >
                    <div className="flex items-start gap-3.5 min-w-0">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center font-bold text-sm flex-shrink-0 ${
                        p.paymentMethod === 'UPI' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                      }`}>
                        {p.recipientName?.[0]?.toUpperCase() || 'P'}
                    </div>
                      <div className="min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 truncate group-hover:text-indigo-600 transition-colors">
                            {p.recipientName}
                          </span>
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                            p.paymentMethod === 'UPI'
                              ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                              : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                          }`}>
                            {p.paymentMethod === 'UPI' ? '⚡ UPI' : '💵 Cash'}
                          </span>
                          <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${statusMeta.color}`}>
                            {statusMeta.label}
                          </span>

                          {p.attemptCount > 1 && (
                            <span className="text-[10px] text-slate-400 font-medium">
                              (Attempt #{p.attemptCount})
                            </span>
                          )}
                      </div>

                        <div className="flex items-center gap-2 mt-1 text-xs text-slate-500 flex-wrap">
                          {p.upiId && (
                            <span className="font-mono text-[11px] flex items-center gap-1">
                              {p.upiId}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleCopy(p.upiId, `list-upi-${p.id}`)
                                }}
                                className="text-slate-400 hover:text-slate-600"
                                title="Copy UPI ID"
                              >
                                {copiedKey === `list-upi-${p.id}` ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                              </button>
                            </span>
                          )}
                          <span>•</span>
                          <span title="Date & Time">{formatPaymentDateTime(p.paymentDate, p.createdAt)}</span>
                          <span>•</span>
                          <span className="inline-flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full" style={{ backgroundColor: p.categoryColor || '#6366f1' }}></span>
                            {p.categoryName}
                          </span>
                          <span>•</span>
                          <span>{p.accountName}</span>
                      </div>

                        {p.notes && (
                          <div className="text-xs text-slate-600 mt-1.5 italic bg-slate-50 px-2 py-1 rounded-md inline-block">
                            "{p.notes}"
                        </div>
                        )}

                        <div className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1.5">
                          <span>Ref: {p.referenceId}</span>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopy(p.referenceId, `list-ref-${p.id}`)
                            }}
                            className="text-slate-400 hover:text-slate-600"
                            title="Copy Reference ID"
                          >
                            {copiedKey === `list-ref-${p.id}` ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                          </button>
                      </div>
                    </div>
                  </div>

                    <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-center border-t sm:border-t-0 pt-3 sm:pt-0 border-slate-100 flex-shrink-0 gap-2">
                      <div className="text-base sm:text-lg font-extrabold text-slate-900">
                        ₹{p.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </div>

                      {/* Action buttons based on status */}
                      <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setSelectedPaymentForDetail(p)}
                          className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-50 transition-colors"
                          title="View Full Transaction Details"
                        >
                          <Eye size={12} />
                          <span>Details</span>
                        </button>

                        {(isUnverified || isUnknown) && (
                          <button
                            onClick={() => setReturnedFromAppPayment(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white transition-colors shadow-2xs"
                          >
                            <span>Verify Result</span>
                          </button>
                        )}

                        {isRetryEligible && (
                          <button
                            onClick={() => handleRetryPayment(p)}
                            className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg border border-indigo-200 bg-indigo-50/70 text-indigo-700 hover:bg-indigo-100 transition-colors shadow-2xs"
                            title="Retry UPI Payment"
                          >
                            <RotateCcw size={12} />
                            <span>Retry</span>
                          </button>
                        )}

                        {isPending && (
                          <button
                            onClick={() => handleCancelPayment(p.id)}
                            className="text-xs font-semibold text-rose-600 hover:text-rose-700 px-2 py-1 rounded-lg hover:bg-rose-50 transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                    </div>
                  </div>
                </div>
                )
              })}
          </div>
          )}
      </div>
      )}

      {/* 6. Step 3: Final Payment Confirmation Modal (Before opening external UPI app) */}
      {pendingConfirmation && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl relative animate-in fade-in zoom-in-95 space-y-5">
            <button
              onClick={() => setPendingConfirmation(null)}
              className="absolute top-4 right-4 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X size={18} />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center flex-shrink-0 border border-indigo-100">
                <ShieldCheck size={26} />
            </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900">Confirm Payment Details</h3>
                <p className="text-xs text-slate-500">Review carefully before opening your UPI app</p>
            </div>
          </div>

            {/* Amount card */}
            <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-1">
              <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Paying Exactly</span>
              <div className="text-3xl font-extrabold text-white tracking-tight">
                ₹{pendingConfirmation.amount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
              <span className="text-xs text-indigo-300 font-medium">Currency: INR</span>
          </div>

            {/* Recipient & Transaction Metadata breakdown */}
            <div className="space-y-2.5 text-xs bg-slate-50 p-4 rounded-2xl border border-slate-200">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipient Name:</span>
                <span className="font-bold text-slate-900">{pendingConfirmation.recipientName}</span>
            </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipient UPI ID:</span>
                <span className="font-mono font-bold text-indigo-600">{pendingConfirmation.upiId}</span>
            </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Expense Category:</span>
                <span className="font-semibold text-slate-800">{pendingConfirmation.categoryName}</span>
            </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Deducting From:</span>
                <span className="font-semibold text-slate-800">{pendingConfirmation.accountName}</span>
            </div>
              {pendingConfirmation.notes && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Payment Note:</span>
                  <span className="font-medium text-slate-700 italic">"{pendingConfirmation.notes}"</span>
              </div>
              )}
          </div>

            {/* Platform-specific guidance */}
            <div className="p-3.5 rounded-xl bg-amber-50/80 border border-amber-200 text-[11px] text-amber-900 space-y-1">
              <div className="font-bold flex items-center gap-1.5 text-amber-950">
                <AlertCircle size={14} />
                <span>Security & App Launch Notice</span>
            </div>
              <p className="leading-relaxed">
                {platform === 'android' && 'Clicking below will open the UPI intent chooser (GPay, PhonePe, Paytm, BHIM) on your device. PIN entry is handled inside your bank app.'}
                {platform === 'ios' && 'Clicking below will trigger the UPI link. If your app does not open automatically, copy the UPI ID below.'}
                {platform === 'desktop' && 'Desktop browsers cannot open mobile bank apps directly. You can initiate the attempt to track it and copy the UPI details to pay on your phone.'}
              </p>
          </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setPendingConfirmation(null)}
                className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submitting}
                onClick={handleConfirmAndLaunchUpi}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs sm:text-sm transition-all shadow-sm active:scale-95 disabled:opacity-50"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Preparing...</span>
                  </>
                ) : (
                  <>
                    <ExternalLink size={16} />
                    <span>Confirm & Launch UPI App</span>
                  </>
                )}
              </button>
          </div>
        </div>
      </div>
      )}

      {/* 7. Step 3: Launching Payment State Modal */}
      {activePaymentAttempt && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 my-auto">
            {/* Fixed Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center shadow-2xs">
                  <Smartphone size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Pay via UPI</h3>
                  <p className="text-xs text-slate-500">
                    To <span className="font-semibold text-slate-800">{activePaymentAttempt.payment.recipientName}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setActivePaymentAttempt(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-3.5 flex-1 text-center">
              {/* Amount Hero Badge */}
              <div className="p-3.5 bg-gradient-to-br from-slate-900 to-indigo-950 rounded-2xl text-white flex items-center justify-between shadow-xs">
                <div className="text-left">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Total Amount</span>
                  <div className="text-2xl font-extrabold tracking-tight text-white">
                    ₹{Number(activePaymentAttempt.payment.amount)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-indigo-300 uppercase tracking-wider font-semibold block">Payee UPI ID</span>
                  <div className="flex items-center gap-1.5 mt-0.5 justify-end">
                    <span className="font-mono text-xs font-semibold text-slate-200">{activePaymentAttempt.payment.upiId}</span>
                    <button
                      type="button"
                      onClick={() => handleCopy(activePaymentAttempt.payment.upiId, 'hero-upi')}
                      className="p-1 rounded-md bg-white/10 hover:bg-white/20 text-white transition-colors"
                      title="Copy UPI ID"
                    >
                      {copiedKey === 'hero-upi' ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>

              {/* Segmented Switch: Open UPI App vs Scan QR Code */}
              <div className="flex rounded-xl bg-slate-100 p-1 text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => setLaunchModalTab('apps')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    launchModalTab === 'apps' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <Smartphone size={13} />
                  <span>Open UPI App</span>
                </button>
                <button
                  type="button"
                  onClick={() => setLaunchModalTab('qr')}
                  className={`flex-1 py-1.5 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    launchModalTab === 'qr' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
                  }`}
                >
                  <QrCode size={13} />
                  <span>Scan QR Code</span>
                </button>
              </div>

              {/* Tab 1: Installed UPI Apps */}
              {launchModalTab === 'apps' && (
                <div className="space-y-2.5 animate-in fade-in">
                  {/* Universal Copy UPI ID Fallback Banner */}
                  <div className="p-3 bg-indigo-50/70 rounded-2xl border border-indigo-200 text-left space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                        <ShieldCheck size={14} className="text-indigo-600" />
                        <span>Direct UPI ID</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(activePaymentAttempt.payment.upiId, 'universal-copy')}
                        className="inline-flex items-center gap-1 px-3 py-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-2xs active:scale-95"
                      >
                        {copiedKey === 'universal-copy' ? <Check size={12} /> : <Copy size={12} />}
                        <span>{copiedKey === 'universal-copy' ? 'Copied UPI ID!' : 'Copy UPI ID'}</span>
                      </button>
                    </div>
                    <p className="text-[11px] text-indigo-900/90 leading-relaxed">
                      If bank deep-linking is restricted, copy the UPI ID, open your payment app, and paste to pay directly.
                    </p>
                  </div>

                  {/* Primary Universal "Pay with Any UPI App" */}
                  <button
                    type="button"
                    onClick={() => handleLaunchSpecificApp(activePaymentAttempt.appLinks.generic, 'Any UPI App')}
                    className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-all flex items-center justify-center gap-2 active:scale-98"
                  >
                    <Sparkles size={16} />
                    <span>Open Any Installed UPI App</span>
                  </button>

                  {/* Grid of brand-specific apps */}
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-left space-y-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      Or launch a specific app:
                    </span>
                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => handleLaunchSpecificApp(activePaymentAttempt.appLinks.gpay, 'Google Pay')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      >
                        <span>Google Pay</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLaunchSpecificApp(activePaymentAttempt.appLinks.phonepe, 'PhonePe')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      >
                        <span>PhonePe</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLaunchSpecificApp(activePaymentAttempt.appLinks.paytm, 'Paytm')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      >
                        <span>Paytm</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleLaunchSpecificApp(activePaymentAttempt.appLinks.bhim, 'BHIM')}
                        className="p-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-xs font-semibold text-slate-800 flex items-center justify-center gap-1.5 transition-all shadow-2xs active:scale-95"
                      >
                        <span>BHIM</span>
                      </button>
                    </div>
                  </div>

                  {/* Anti-Fraud Troubleshooting Tips */}
                  <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
                    <div className="flex items-center gap-1.5 font-bold text-slate-800 text-[11px]">
                      <Info size={13} className="text-slate-600" />
                      <span>Security & Decline Troubleshooting</span>
                    </div>
                    <ul className="list-disc list-inside text-[10px] text-slate-500 space-y-0.5">
                      <li><strong>Declined for Security Reasons?</strong> NPCI blocks self-transfers (paying your own UPI ID or account on the same phone/SIM). Ensure the payee is a separate recipient.</li>
                      <li><strong>Accessibility/Screen Recording:</strong> Google Pay blocks transfers if any screen recorder or auto-clicker is active in the background.</li>
                      <li><strong>Gallery QR Limit:</strong> Bank apps enforce an NPCI limit of ₹2,000 for QR codes uploaded from your phone gallery.</li>
                    </ul>
                  </div>
                </div>
              )}

              {/* Tab 2: Scan QR Code */}
              {launchModalTab === 'qr' && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-2 animate-in fade-in">
                  <span className="text-[10px] font-bold text-slate-600 uppercase tracking-wider block">
                    Point Phone Camera or UPI App to Pay
                  </span>
                  {activePaymentAttempt.qrDataUrl ? (
                    <div className="inline-block p-2 bg-white rounded-2xl shadow-xs border border-slate-200">
                      <img
                        src={activePaymentAttempt.qrDataUrl}
                        alt="UPI QR Code"
                        className="w-36 h-36 mx-auto rounded-lg"
                      />
                    </div>
                  ) : (
                    <div className="w-36 h-36 mx-auto flex items-center justify-center bg-white rounded-2xl border border-slate-200 text-xs text-slate-400">
                      Generating QR...
                    </div>
                  )}
                  <div className="text-[11px] text-slate-600 flex items-center justify-center gap-2">
                    <span>Payee: <strong className="text-slate-900">{activePaymentAttempt.payment.recipientName}</strong></span>
                    <span>•</span>
                    <span className="text-indigo-600 font-bold">₹{Number(activePaymentAttempt.payment.amount)?.toFixed(2)}</span>
                  </div>
                  <p className="text-[10px] text-slate-500">
                    Scan live using Google Pay, PhonePe, Paytm, or BHIM camera.
                  </p>
                  <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded-xl border border-amber-200/60">
                    NPCI Notice: For QR codes uploaded from photos/gallery, bank apps restrict payments to ₹2,000.
                  </p>
                </div>
              )}
            </div>

            {/* Fixed Footer */}
            <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2">
              <button
                type="button"
                onClick={() => handleUserReturnedFromApp(activePaymentAttempt)}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm transition-all shadow-sm active:scale-98"
              >
                I have returned from payment app
              </button>
              <button
                type="button"
                onClick={() => setActivePaymentAttempt(null)}
                className="w-full py-1 text-xs font-medium text-slate-500 hover:text-slate-700 transition-colors"
              >
                Dismiss / Keep in background
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 8. Step 3: Returned From Payment App & Verification Screen */}
      {returnedFromAppPayment && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 my-auto">
            {/* Fixed Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shadow-2xs">
                  <Clock size={20} />
                </div>
                <div className="text-left">
                  <h3 className="text-base font-bold text-slate-900 leading-tight">Payment Verification</h3>
                  <p className="text-xs text-slate-500">
                    Did your payment succeed?
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setReturnedFromAppPayment(null)}
                className="p-2 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Scrollable Body */}
            <div className="overflow-y-auto p-4 sm:p-5 space-y-4 flex-1 text-center">
              {/* Payment Summary */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-center space-y-1">
                <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Transfer Summary</span>
                <p className="text-xs text-slate-600">
                  Paid to <span className="font-bold text-slate-900">{returnedFromAppPayment.recipientName}</span>
                </p>
                <div className="text-2xl font-black text-slate-900">
                  ₹{Number(returnedFromAppPayment.amount)?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </div>
                <div className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-100 text-amber-800">
                  STATUS: {returnedFromAppPayment.status}
                </div>
              </div>

              {/* Auto-filled Transaction ID Card */}
              <div className="p-3 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-left space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1">
                    <CheckCircle2 size={12} className="text-indigo-600" />
                    Transaction Tracking ID (Autofilled)
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded-md bg-indigo-100 font-semibold text-indigo-700">
                    System Assigned
                  </span>
                </div>
                <div className="flex items-center justify-between bg-white px-2.5 py-1.5 rounded-xl border border-indigo-200/80">
                  <span className="font-mono text-xs font-bold text-slate-800 select-all truncate">
                    {returnedFromAppPayment.referenceId || userConfirmationNote || 'EXP-UPI-TXN'}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(returnedFromAppPayment.referenceId || userConfirmationNote, 'verif-ref')}
                    className="ml-2 text-[10px] text-indigo-600 font-semibold hover:underline flex items-center gap-1 shrink-0"
                  >
                    {copiedKey === 'verif-ref' ? <Check size={11} className="text-emerald-600" /> : <Copy size={11} />}
                    <span>{copiedKey === 'verif-ref' ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
              </div>

              {/* Informative Explanation */}
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-left text-xs text-amber-900 space-y-1">
                <div className="font-bold flex items-center gap-1.5 text-amber-950">
                  <ShieldCheck size={14} className="text-amber-700" />
                  <span>Why UPI requires 1-tap confirmation</span>
                </div>
                <p className="leading-relaxed text-[11px] text-amber-900/90">
                  For banking privacy, external apps (Google Pay, PhonePe, Paytm) do not reveal bank PIN outcomes to web apps. 
                  Tap <strong>"Yes, Money Was Debited"</strong> below to automatically log this transaction into your expense ledger.
                </p>
              </div>

              <div className="text-left">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                    Confirmation Note / Bank UTR (Optional)
                  </label>
                  <button
                    type="button"
                    onClick={handlePasteClipboard}
                    className="inline-flex items-center gap-1 text-[10px] font-semibold text-indigo-600 hover:text-indigo-800 bg-indigo-50 hover:bg-indigo-100 px-2 py-0.5 rounded-md transition-colors"
                  >
                    <ClipboardPaste size={11} />
                    <span>Paste UTR</span>
                  </button>
                </div>
                <input
                  type="text"
                  placeholder="e.g. Debited from HDFC Bank, Ref #123456"
                  value={userConfirmationNote}
                  onChange={(e) => setUserConfirmationNote(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  Autofilled with your unique tracking ID. You can also paste your 12-digit bank UTR if desired.
                </span>
              </div>
            </div>

            {/* Fixed Footer with Resolution Choices */}
            <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/80 shrink-0 space-y-2">
              <button
                type="button"
                disabled={statusUpdating}
                onClick={() => handleResolvePaymentStatus('SUCCESS')}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-98"
              >
                {statusUpdating ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Yes, Money Was Debited (Log Expense)</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => handleResolvePaymentStatus('FAILED')}
                  className="py-2 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <XCircle size={14} />
                  <span>Payment Failed</span>
                </button>

                <button
                  type="button"
                  disabled={statusUpdating}
                  onClick={() => handleResolvePaymentStatus('UNKNOWN')}
                  className="py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-semibold text-xs transition-colors"
                >
                  Not Sure / Check Later
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. Camera Scan & Pay QR Modal */}
      <QrScannerModal
        isOpen={showQrModal}
        onClose={() => setShowQrModal(false)}
        onScanSuccess={handleQrScanSuccess}
        categories={categories}
        accounts={accounts}
      />

      {/* 10. Add Recipient Modal */}
      {showAddRecipientModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
              <h3 className="text-base font-bold text-slate-900">Add Saved Recipient</h3>
              <button
                type="button"
                onClick={() => setShowAddRecipientModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateRecipient} className="flex flex-col flex-1 overflow-hidden">
              <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Ramesh Kumar"
                    value={newRecipientData.name}
                    onChange={(e) => setNewRecipientData((prev) => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    UPI ID (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. ramesh@okaxis"
                    value={newRecipientData.upiId}
                    onChange={(e) => setNewRecipientData((prev) => ({ ...prev, upiId: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Phone (Optional)
                  </label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={newRecipientData.phone}
                    onChange={(e) => setNewRecipientData((prev) => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Recipient Type
                  </label>
                  <select
                    value={newRecipientData.recipientType}
                    onChange={(e) => setNewRecipientData((prev) => ({ ...prev, recipientType: e.target.value }))}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
                  >
                    <option value="FRIEND">Friend</option>
                    <option value="FAMILY">Family</option>
                    <option value="SHOP">Shop</option>
                    <option value="MERCHANT">Merchant</option>
                    <option value="OTHER">Other</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer pt-1">
                  <input
                    type="checkbox"
                    checked={newRecipientData.isFavorite}
                    onChange={(e) => setNewRecipientData((prev) => ({ ...prev, isFavorite: e.target.checked }))}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <span className="text-xs font-semibold text-slate-700">Add to Favorites ⭐</span>
                </label>
              </div>

              {/* Fixed Footer */}
              <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 shrink-0 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddRecipientModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs"
                >
                  Save Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* 8. Step 5: Transaction Detail Modal with attempts audit trail, retry & status resolution */}
      <PaymentDetailModal
        payment={selectedPaymentForDetail}
        isOpen={Boolean(selectedPaymentForDetail)}
        onClose={() => setSelectedPaymentForDetail(null)}
        onRetry={handleRetryPayment}
        onStatusUpdate={async (payment, status) => {
          try {
            await paymentAPI.updateStatus(payment.id, { status })
            toast.success(`Payment status updated to ${status}`)
            await reloadPayments()
          } catch (err) {
            toast.error(getServerMessage(err, 'Failed to update status'))
          }
        }}
      />
    </div>
  )
}

export default PayAndTrack
