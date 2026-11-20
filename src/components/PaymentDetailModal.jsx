import { useState, useEffect } from 'react'
import { 
  X, 
  Copy, 
  Check, 
  RotateCcw, 
  Clock, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ExternalLink,
  ShieldAlert,
  Smartphone,
  Wallet,
  Calendar,
  Tag,
  FileText,
  Loader2,
  HelpCircle,
  Sparkles
} from 'lucide-react'
import { paymentAPI } from '../services/api'
import { format } from 'date-fns'
import { copyToClipboard } from '../utils/upi'
import toast from 'react-hot-toast'

const STATUS_CONFIG = {
  SUCCESS: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  COMPLETED: { label: 'Confirmed', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  CASH_PAID: { label: 'Cash paid', color: 'bg-emerald-100 text-emerald-800 border-emerald-200', icon: CheckCircle2 },
  PENDING: { label: 'Pending', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: Clock },
  UNVERIFIED: { label: 'Unverified', color: 'bg-amber-100 text-amber-800 border-amber-300', icon: AlertTriangle },
  UNKNOWN: { label: 'Unknown', color: 'bg-yellow-100 text-yellow-800 border-yellow-300', icon: HelpCircle },
  FAILED: { label: 'Failed', color: 'bg-rose-100 text-rose-800 border-rose-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-slate-100 text-slate-700 border-slate-200', icon: XCircle },
}

function PaymentDetailModal({ payment, isOpen, onClose, onRetry, onStatusUpdate }) {
  const [copiedKey, setCopiedKey] = useState('')
  const [attempts, setAttempts] = useState([])
  const [loadingAttempts, setLoadingAttempts] = useState(false)
  const [showUnknownWarning, setShowUnknownWarning] = useState(false)

  useEffect(() => {
    if (payment && isOpen) {
      loadAttempts(payment.id)
      setShowUnknownWarning(payment.status === 'UNKNOWN')
    }
  }, [payment, isOpen])

  const loadAttempts = async (paymentId) => {
    setLoadingAttempts(true)
    try {
      const res = await paymentAPI.getAttempts(paymentId)
      setAttempts(res.data || [])
    } catch (_) {
      setAttempts([])
    } finally {
      setLoadingAttempts(false)
    }
  }

  const handleCopy = async (text, key) => {
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedKey(key)
      toast.success('Copied to clipboard!')
      setTimeout(() => setCopiedKey(''), 2500)
    }
  }

  if (!isOpen || !payment) return null

  const statusInfo = STATUS_CONFIG[payment.status] || STATUS_CONFIG.PENDING
  const StatusIcon = statusInfo.icon
  const isRetryEligible = payment.paymentMethod === 'UPI' && 
    ['PENDING', 'UNVERIFIED', 'UNKNOWN', 'FAILED', 'CANCELLED'].includes(payment.status)

  const formattedCreated = payment.createdAt ? (() => {
    try {
      return format(new Date(payment.createdAt), 'PPpp')
    } catch (_) {
      return String(payment.createdAt)
    }
  })() : 'N/A'

  const formattedUpdated = payment.updatedAt ? (() => {
    try {
      return format(new Date(payment.updatedAt), 'PPpp')
    } catch (_) {
      return String(payment.updatedAt)
    }
  })() : formattedCreated

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95">
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-3 min-w-0 pr-2">
            <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-white font-bold text-base flex-shrink-0 shadow-xs ${
              payment.paymentMethod === 'UPI' ? 'bg-indigo-600' : 'bg-emerald-600'
            }`}>
              {payment.recipientName?.[0]?.toUpperCase() || 'P'}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base font-bold text-slate-900 truncate">{payment.recipientName}</h3>
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.color}`}>
                  <StatusIcon size={11} />
                  <span>{statusInfo.label}</span>
                </span>
              </div>
              <span className="text-[11px] text-slate-500 block truncate">
                {payment.paymentMethod === 'UPI' ? '⚡ UPI Transfer' : '💵 Cash Note'}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {/* Amount Hero Card */}
          <div className="p-4 rounded-2xl bg-slate-900 text-white text-center space-y-0.5 shadow-xs">
            <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">Total Amount</span>
            <div className="text-3xl font-extrabold text-white tracking-tight">
              ₹{payment.amount?.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <span className="text-[11px] text-indigo-300 font-medium">Currency: INR</span>
          </div>

        {/* Core Metadata Breakdown */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/90 space-y-3 text-xs">
          {payment.upiId && (
            <div className="flex justify-between items-center">
              <span className="text-slate-500 font-medium">Payee UPI ID:</span>
              <div className="flex items-center gap-1.5 font-mono font-bold text-indigo-600">
                <span>{payment.upiId}</span>
                <button
                  onClick={() => handleCopy(payment.upiId, 'modal-upi')}
                  className="text-slate-400 hover:text-slate-700"
                  title="Copy UPI ID"
                >
                  {copiedKey === 'modal-upi' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
                </button>
              </div>
            </div>
          )}

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Transaction Reference:</span>
            <div className="flex items-center gap-1.5 font-mono text-slate-700 font-medium">
              <span>{payment.referenceId}</span>
              <button
                onClick={() => handleCopy(payment.referenceId, 'modal-ref')}
                className="text-slate-400 hover:text-slate-700"
                title="Copy Reference"
              >
                {copiedKey === 'modal-ref' ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              </button>
            </div>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Category:</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-slate-800">
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: payment.categoryColor || '#6366f1' }}></span>
              {payment.categoryName}
            </span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Account Used:</span>
            <span className="font-semibold text-slate-800">{payment.accountName}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-slate-500 font-medium">Payment Date:</span>
            <span className="font-semibold text-slate-800">{payment.paymentDate}</span>
          </div>

          {payment.notes && (
            <div className="border-t border-slate-200 pt-2 flex justify-between items-start gap-4">
              <span className="text-slate-500 font-medium flex-shrink-0">Notes:</span>
              <span className="italic text-slate-700 text-right">"{payment.notes}"</span>
            </div>
          )}

          <div className="border-t border-slate-200 pt-2 flex justify-between items-center text-[11px] text-slate-400">
            <span>Created At:</span>
            <span>{formattedCreated}</span>
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400">
            <span>Last Updated:</span>
            <span>{formattedUpdated}</span>
          </div>
        </div>

        {/* Audit Trail: Payment Attempts History */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-700 uppercase tracking-wider">
            <span>Payment Attempts ({attempts.length || payment.attemptCount || 1})</span>
            {loadingAttempts && <Loader2 size={13} className="animate-spin text-slate-400" />}
          </div>

          {attempts.length === 0 ? (
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-500 text-center">
              Initial Attempt #{payment.attemptCount || 1} • {payment.status}
            </div>
          ) : (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {attempts.map((att) => (
                <div
                  key={att.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs flex items-center justify-between"
                >
                  <div className="space-y-0.5">
                    <div className="font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Attempt #{att.attemptNumber}</span>
                      <span className="text-[10px] text-slate-500 uppercase font-mono px-1.5 py-0.5 bg-slate-200 rounded">
                        {att.platform || 'web'}
                      </span>
                    </div>
                    <div className="text-[10px] text-slate-400">
                      {att.createdAt ? format(new Date(att.createdAt), 'PPpp') : ''}
                    </div>
                  </div>
                  <span className="font-bold text-slate-700 text-xs">{att.status}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Step 5: Warning when status is UNKNOWN before retrying */}
        {payment.status === 'UNKNOWN' && (
          <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-900 space-y-1">
            <div className="font-bold flex items-center gap-1.5 text-amber-950">
              <AlertTriangle size={15} />
              <span>Verify Bank Account Before Retrying</span>
            </div>
            <p className="text-[11px] leading-relaxed text-amber-800">
              Money may already have been debited from your bank account. Please check your bank statement or SMS before retrying to prevent an accidental duplicate payment.
            </p>
          </div>
        )}

        {/* Verification action buttons for UNVERIFIED / UNKNOWN */}
        {(payment.status === 'UNVERIFIED' || payment.status === 'UNKNOWN') && onStatusUpdate && (
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 space-y-2">
            <span className="text-xs font-bold text-indigo-950 block">Resolve Payment Status:</span>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => {
                  onStatusUpdate(payment, 'SUCCESS')
                  onClose()
                }}
                className="py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition-colors"
              >
                Money Was Debited
              </button>
              <button
                onClick={() => {
                  onStatusUpdate(payment, 'FAILED')
                  onClose()
                }}
                className="py-2 rounded-xl border border-rose-200 bg-white hover:bg-rose-50 text-rose-700 font-semibold text-xs transition-colors"
              >
                Payment Failed
              </button>
            </div>
          </div>
        )}

        </div>

        {/* Fixed Footer Actions */}
        <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 shrink-0 flex items-center justify-between">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold"
          >
            Close
          </button>

          {isRetryEligible && onRetry && (
            <button
              onClick={() => {
                if (payment.status === 'UNKNOWN') {
                  const confirmed = window.confirm(
                    '⚠️ Warning: Payment status is UNKNOWN.\n\nMoney may have already been debited from your bank account.\n\nPlease check your bank statement or SMS before retrying to prevent an accidental duplicate payment.\n\nDo you want to retry now?'
                  )
                  if (!confirmed) return
                }
                onRetry(payment)
                onClose()
              }}
              className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <RotateCcw size={14} />
              <span>Retry Payment</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentDetailModal
