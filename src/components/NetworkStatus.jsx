import { useState, useEffect } from 'react'
import { WifiOff, Wifi } from 'lucide-react'

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [showRestored, setShowRestored] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleOnline = () => {
      setIsOnline(true)
      setShowRestored(true)
      const timer = setTimeout(() => setShowRestored(false), 3000)
      return () => clearTimeout(timer)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowRestored(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (isOnline && !showRestored) return null

  return (
    <div
      role="status"
      aria-live="polite"
      className={`fixed top-0 left-0 right-0 z-[100] safe-top transition-all duration-300 pointer-events-none flex justify-center p-2.5 sm:p-3`}
    >
      {!isOnline ? (
        <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-600/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-bounce">
          <WifiOff size={15} className="shrink-0" />
          <span>You are currently offline. Check your internet connection.</span>
        </div>
      ) : showRestored ? (
        <div className="pointer-events-auto inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-600/95 text-white text-xs font-semibold shadow-lg backdrop-blur-md animate-fadeIn">
          <Wifi size={15} className="shrink-0" />
          <span>Internet connection restored</span>
        </div>
      ) : null}
    </div>
  )
}
