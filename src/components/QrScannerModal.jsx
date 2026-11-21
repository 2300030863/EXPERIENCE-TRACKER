import { useState, useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'
import { 
  X, 
  Camera, 
  AlertCircle, 
  CheckCircle2, 
  Flashlight, 
  RefreshCw, 
  ShieldCheck, 
  ExternalLink,
  Loader2,
  Sparkles,
  ArrowRight,
  HelpCircle,
  Image as ImageIcon,
  Upload
} from 'lucide-react'
import { parseUpiQr } from '../utils/upiQrParser'
import toast from 'react-hot-toast'

function QrScannerModal({ isOpen, onClose, onScanSuccess, categories = [], accounts = [] }) {
  const [scannerState, setScannerState] = useState('READY') // 'READY', 'SCANNING', 'PARSED', 'ERROR'
  const [errorMessage, setErrorMessage] = useState('')
  const [torchOn, setTorchOn] = useState(false)
  const [hasTorch, setHasTorch] = useState(false)
  const [parsedData, setParsedData] = useState(null)
  const [customAmount, setCustomAmount] = useState('')
  const [customNote, setCustomNote] = useState('')
  const [selectedCategoryId, setSelectedCategoryId] = useState('')
  const [selectedAccountId, setSelectedAccountId] = useState('')
  const [scannedFromGallery, setScannedFromGallery] = useState(false)
  const [galleryScanning, setGalleryScanning] = useState(false)

  const html5QrCodeRef = useRef(null)
  const fileInputRef = useRef(null)
  const scannerContainerId = 'qr-reader-container'

  useEffect(() => {
    if (categories.length > 0 && !selectedCategoryId) {
      setSelectedCategoryId(String(categories[0].id))
    }
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(String(accounts[0].id))
    }
  }, [categories, accounts])

  // Clean up scanner on unmount or close
  useEffect(() => {
    return () => {
      stopCamera()
    }
  }, [])

  const stopCamera = async () => {
    if (html5QrCodeRef.current) {
      try {
        if (html5QrCodeRef.current.isScanning) {
          await html5QrCodeRef.current.stop()
        }
      } catch (err) {
        console.warn('Error stopping scanner:', err)
      }
      html5QrCodeRef.current = null
    }
    setTorchOn(false)
    setHasTorch(false)
  }

  const handleStartScanning = async () => {
    setScannerState('SCANNING')
    setErrorMessage('')

    try {
      // Ensure any existing instance is cleaned up
      await stopCamera()

      const html5QrCode = new Html5Qrcode(scannerContainerId)
      html5QrCodeRef.current = html5QrCode

      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
      }

      await html5QrCode.start(
        { facingMode: 'environment' },
        config,
        async (decodedText) => {
          // Successfully scanned a QR
          await handleQrDecoded(decodedText)
        },
        () => {
          // Frame scan error / no QR in frame - ignore
        }
      )

      // Check if torch/flashlight is supported
      try {
        const capabilities = html5QrCode.getRunningTrackCapabilities()
        if (capabilities && capabilities.torch) {
          setHasTorch(true)
        }
      } catch (_) {}
    } catch (err) {
      console.error('Camera start error:', err)
      await stopCamera()
      setScannerState('ERROR')

      const errStr = String(err).toLowerCase()
      if (errStr.includes('permission') || errStr.includes('denied') || errStr.includes('notallowederror')) {
        setErrorMessage('Camera access was denied. Please allow camera permissions in your browser or device settings to scan QR codes.')
      } else if (errStr.includes('notfounderror') || errStr.includes('devicesnotfound')) {
        setErrorMessage('No camera device found on this system.')
      } else {
        setErrorMessage('Could not start camera scanner. Please check your camera permissions.')
      }
    }
  }

  const handleToggleTorch = async () => {
    if (!html5QrCodeRef.current || !hasTorch) return
    try {
      const nextTorch = !torchOn
      await html5QrCodeRef.current.applyVideoConstraints({
        advanced: [{ torch: nextTorch }],
      })
      setTorchOn(nextTorch)
    } catch (err) {
      console.warn('Torch toggle failed:', err)
      toast.error('Flashlight not supported on this device')
    }
  }

  const handleQrDecoded = async (decodedText, isGallery = false) => {
    // 1. Stop scanning immediately
    await stopCamera()

    // 2. Strict validation & parsing
    const result = parseUpiQr(decodedText)
    if (!result.isValid) {
      setScannerState('ERROR')
      setErrorMessage(result.error)
      setScannedFromGallery(isGallery)
      return
    }

    // 3. Pre-populate parsed data
    setParsedData(result)
    setScannedFromGallery(isGallery)
    setCustomAmount(result.amount ? String(result.amount) : '')
    setCustomNote(result.note || '')
    setScannerState('PARSED')
    toast.success(`Scanned UPI QR: ${result.recipientName}`)
  }

  // Handle QR scanning from an image file uploaded from the user's gallery / photos
  const handleGalleryFileSelect = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setGalleryScanning(true)
    setErrorMessage('')

    try {
      await stopCamera()

      // Instantiating Html5Qrcode on the container for file scanning
      let html5QrCode = html5QrCodeRef.current
      if (!html5QrCode) {
        html5QrCode = new Html5Qrcode(scannerContainerId)
        html5QrCodeRef.current = html5QrCode
      }

      const decodedText = await html5QrCode.scanFile(file, true)
      await handleQrDecoded(decodedText, true)
    } catch (err) {
      console.warn('Gallery QR scan error:', err)
      await stopCamera()
      setScannerState('ERROR')
      setScannedFromGallery(true)
      setErrorMessage('Could not find a valid UPI QR code in the selected photo. Please make sure the QR is clear and uncropped.')
    } finally {
      setGalleryScanning(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleConfirmScanPayment = () => {
    if (!parsedData) return

    const finalAmount = parseFloat(customAmount)
    if (!finalAmount || finalAmount <= 0) {
      toast.error('Please enter a valid payment amount')
      return
    }
    if (finalAmount > 100000) {
      toast.error('Amount exceeds NPCI UPI limit of ₹1,00,000')
      return
    }

    if (!selectedCategoryId) {
      toast.error('Please select an expense category')
      return
    }
    if (!selectedAccountId) {
      toast.error('Please select an account')
      return
    }

    // Pass validated QR payment data back to parent
    onScanSuccess({
      recipientName: parsedData.recipientName,
      upiId: parsedData.upiId,
      amount: finalAmount,
      categoryId: Number(selectedCategoryId),
      accountId: Number(selectedAccountId),
      notes: customNote.trim(),
      recipientType: parsedData.merchantCode ? 'MERCHANT' : 'SHOP',
    })

    handleClose()
  }

  const handleClose = async () => {
    await stopCamera()
    setScannerState('READY')
    setParsedData(null)
    setScannedFromGallery(false)
    setErrorMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-md w-full shadow-2xl relative animate-in fade-in zoom-in-95 overflow-hidden max-h-[92vh] flex flex-col my-auto">
        {/* Fixed Header */}
        <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
              <Camera size={18} />
            </div>
            <span className="font-bold text-sm text-slate-900">
              {scannerState === 'PARSED' ? 'Confirm Scanned Payee' : 'Scan & Pay UPI QR'}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">

        {/* State 1: READY / Permission Screen */}
        {scannerState === 'READY' && (
          <div className="text-center space-y-4 py-3">
            <div className="w-16 h-16 rounded-3xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center mx-auto shadow-xs">
              <Camera size={32} />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900">Scan & Pay UPI QR</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto">
                Scan any BharatQR or merchant QR code from Google Pay, PhonePe, Paytm, or BHIM using your device camera.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 text-left text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                <ShieldCheck size={14} className="text-emerald-600" />
                <span>Camera Privacy Assurance</span>
              </div>
              <p className="text-[11px] text-slate-500">
                Camera access is requested only while this scanner is open. Frames are processed locally on your device and are never stored or transmitted.
              </p>
            </div>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleStartScanning}
                className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm transition-all shadow-sm flex items-center justify-center gap-2 active:scale-95"
              >
                <Camera size={16} />
                <span>Enable Camera & Scan</span>
              </button>

              <button
                type="button"
                disabled={galleryScanning}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-indigo-200 bg-indigo-50/60 hover:bg-indigo-50 text-indigo-700 font-semibold text-xs transition-all shadow-2xs flex items-center justify-center gap-2 active:scale-95"
              >
                {galleryScanning ? <Loader2 size={15} className="animate-spin" /> : <ImageIcon size={15} />}
                <span>{galleryScanning ? 'Analyzing photo...' : 'Choose QR from Photos / Gallery'}</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* State 2: SCANNING Viewfinder */}
        {scannerState === 'SCANNING' && (
          <div className="space-y-4 text-center">
            <div className="flex items-center justify-between pb-1">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping"></div>
                <span className="text-xs font-bold text-slate-800">Scanning for UPI QR...</span>
              </div>

              {hasTorch && (
                <button
                  type="button"
                  onClick={handleToggleTorch}
                  className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                    torchOn
                      ? 'bg-amber-100 border-amber-300 text-amber-800'
                      : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
                  }`}
                  title="Toggle Flashlight"
                >
                  <Flashlight size={14} />
                  <span>{torchOn ? 'Flash On' : 'Flash'}</span>
                </button>
              )}
            </div>

            {/* Video Viewfinder Container */}
            <div className="relative rounded-2xl overflow-hidden bg-slate-950 aspect-square max-w-[280px] mx-auto border-2 border-indigo-500/30 shadow-inner">
              <div id={scannerContainerId} className="w-full h-full"></div>

              {/* Viewfinder Overlay Frame */}
              <div className="absolute inset-0 pointer-events-none border-2 border-dashed border-indigo-400/50 m-4 rounded-xl flex items-center justify-center">
                <div className="w-full h-0.5 bg-indigo-400 shadow-[0_0_8px_#818cf8] animate-bounce"></div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              Align the merchant QR code inside the box to scan automatically.
            </p>

            <div className="flex items-center justify-center gap-2">
              <button
                type="button"
                disabled={galleryScanning}
                onClick={() => fileInputRef.current?.click()}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition-colors shadow-2xs"
              >
                <ImageIcon size={14} className="text-indigo-600" />
                <span>Pick from Gallery</span>
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* State 3: PARSED / Payment Confirmation */}
        {scannerState === 'PARSED' && parsedData && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center flex-shrink-0 border border-emerald-100">
                <CheckCircle2 size={26} />
              </div>
              <div>
                <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full uppercase">
                  {scannedFromGallery ? 'Gallery QR Verified' : 'Valid UPI QR Verified'}
                </span>
                <h3 className="text-base font-bold text-slate-900 mt-1">
                  Pay {parsedData.recipientName}
                </h3>
              </div>
            </div>

            {/* NPCI Gallery Advisory Banner if scanned from photo */}
            {scannedFromGallery && (
              <div className={`p-3 rounded-2xl border text-xs space-y-1 ${
                (Number(customAmount) || parsedData.amount || 0) > 2000
                  ? 'bg-amber-50 border-amber-200 text-amber-900'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-900'
              }`}>
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck size={14} className={(Number(customAmount) || parsedData.amount || 0) > 2000 ? 'text-amber-700' : 'text-emerald-700'} />
                  <span>
                    {(Number(customAmount) || parsedData.amount || 0) > 2000
                      ? 'NPCI ₹2,000 Gallery Notice'
                      : 'Safe Amount: Within NPCI ₹2,000 Threshold'}
                  </span>
                </div>
                <p className="text-[11px] leading-relaxed opacity-90">
                  {(Number(customAmount) || parsedData.amount || 0) > 2000
                    ? 'Most Indian UPI apps (Google Pay, PhonePe) restrict gallery QR payments above ₹2,000 for fraud protection. If declined by your bank, point your camera to scan live or pay using the UPI ID directly.'
                    : 'This amount is within the NPCI security threshold for gallery QR uploads.'}
                </p>
              </div>
            )}

            {/* Payee Info Card */}
            <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Recipient UPI ID:</span>
                <span className="font-mono font-bold text-indigo-600">{parsedData.upiId}</span>
              </div>
              {parsedData.merchantCode && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-500">Merchant Code:</span>
                  <span className="font-mono text-slate-700">{parsedData.merchantCode}</span>
                </div>
              )}
            </div>

            {/* Amount Input (Mandatory if QR had no amount) */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Amount (INR) *
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-base font-bold text-slate-400">
                  ₹
                </span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max="100000"
                  required
                  placeholder="Enter amount to pay"
                  value={customAmount}
                  onChange={(e) => setCustomAmount(e.target.value)}
                  className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-300 font-bold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
                />
              </div>
              {parsedData.hasFixedAmount ? (
                <p className="mt-1 text-[10px] text-slate-400">Pre-filled from scanned merchant QR.</p>
              ) : (
                <p className="mt-1 text-[10px] text-amber-600 font-medium">Static QR without fixed amount. Please enter the amount to pay.</p>
              )}
            </div>

            {/* Category and Account selection */}
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category *
                </label>
                <select
                  value={selectedCategoryId}
                  onChange={(e) => setSelectedCategoryId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Account *
                </label>
                <select
                  value={selectedAccountId}
                  onChange={(e) => setSelectedAccountId(e.target.value)}
                  className="w-full px-2.5 py-2 rounded-xl border border-slate-300 bg-white font-medium"
                >
                  {accounts.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Payment Note (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Grocery items, Tea, Lunch"
                value={customNote}
                onChange={(e) => setCustomNote(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600"
              />
            </div>

            {/* Confirmation Buttons */}
            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleStartScanning}
                className="px-3 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-semibold transition-colors"
              >
                Scan Again
              </button>
              <button
                type="button"
                onClick={handleConfirmScanPayment}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition-all shadow-sm flex items-center gap-1.5"
              >
                <span>Proceed to Pay</span>
                <ArrowRight size={14} />
              </button>
            </div>
          </div>
        )}

        {/* State 4: ERROR / Rejection Screen */}
        {scannerState === 'ERROR' && (
          <div className="text-center space-y-4 py-2">
            <div className="w-16 h-16 rounded-3xl bg-rose-50 text-rose-600 border border-rose-200 flex items-center justify-center mx-auto">
              <AlertCircle size={32} />
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900">QR Code Rejected</h3>
              <p className="text-xs text-rose-700 mt-1 max-w-xs mx-auto leading-relaxed bg-rose-50 p-3 rounded-2xl border border-rose-100">
                {errorMessage || 'This is not a valid UPI payment QR code.'}
              </p>
            </div>

            <p className="text-[11px] text-slate-500">
              Only authentic NPCI UPI QR codes (BharatQR, Google Pay, PhonePe, Paytm, BHIM) are accepted.
            </p>

            <div className="pt-2 space-y-2">
              <button
                type="button"
                onClick={handleStartScanning}
                className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs transition-all shadow-sm flex items-center justify-center gap-1.5"
              >
                <RefreshCw size={14} />
                <span>Try Camera Scanning Again</span>
              </button>

              <button
                type="button"
                disabled={galleryScanning}
                onClick={() => fileInputRef.current?.click()}
                className="w-full py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-semibold text-xs transition-all flex items-center justify-center gap-1.5"
              >
                <ImageIcon size={14} className="text-indigo-600" />
                <span>Choose Another Photo from Gallery</span>
              </button>

              <button
                type="button"
                onClick={handleClose}
                className="w-full py-1 text-xs font-semibold text-slate-500 hover:text-slate-700"
              >
                Close
              </button>
            </div>
          </div>
        )}
        </div>

        {/* Hidden File Input for Gallery / Photo QR scanning */}
        <input
          type="file"
          ref={fileInputRef}
          accept="image/*"
          className="hidden"
          onChange={handleGalleryFileSelect}
        />
      </div>
    </div>
  )
}

export default QrScannerModal
