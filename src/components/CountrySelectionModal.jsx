import { useState } from 'react'
import { Globe, X } from 'lucide-react'
import { COUNTRIES, getCurrencyInfo } from '../utils/currency'
import { profileAPI } from '../services/api'
import toast from 'react-hot-toast'

function CountrySelectionModal({ isOpen, onClose, onCountrySelected, userProfile }) {
  const [selectedCountry, setSelectedCountry] = useState('India')
  const [saving, setSaving] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSaving(true)
    
    try {
      // Fetch current profile and update with selected country
      const currentProfile = userProfile || (await profileAPI.get()).data
      
      // Update user profile with all fields including new country
      await profileAPI.update({
        username: currentProfile.username,
        email: currentProfile.email,
        firstName: currentProfile.firstName || '',
        lastName: currentProfile.lastName || '',
        country: selectedCountry
      })
      
      toast.success(`Currency set to ${getCurrencyInfo(selectedCountry).name}`)
      onCountrySelected(selectedCountry)
      onClose()
    } catch (error) {
      console.error('Failed to save country:', error)
      const errorMessage = error.response?.data?.message || error.response?.data || 'Failed to save country preference'
      toast.error(errorMessage)
    } finally {
      setSaving(false)
    }
  }

  if (!isOpen) return null

  const currencyInfo = getCurrencyInfo(selectedCountry)

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] my-auto animate-in fade-in zoom-in-95">
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          {/* Header */}
          <div className="p-4 sm:p-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0 bg-slate-50/70">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Globe size={18} />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Select Your Country
              </h3>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-full hover:bg-slate-200/60 transition-colors"
              title="Close"
            >
              <X size={18} />
            </button>
          </div>

          {/* Body */}
          <div className="p-5 sm:p-6 space-y-4 overflow-y-auto flex-1">
            <div className="bg-indigo-50/80 border border-indigo-200 rounded-2xl p-3.5 text-xs text-indigo-900">
              <p>
                <span className="font-bold">Welcome!</span> Please select your country to set the appropriate currency symbol across all your reports and ledger entries.
              </p>
            </div>

            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
                Country <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedCountry}
                onChange={(e) => setSelectedCountry(e.target.value)}
                className="input-field"
                required
              >
                {COUNTRIES.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>

            {/* Currency Preview */}
            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-xs space-y-2">
              <h4 className="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Currency Preview</h4>
              <div className="space-y-1.5 text-slate-700">
                <div className="flex justify-between">
                  <span className="text-slate-500">Currency Name:</span>
                  <span className="font-semibold">{currencyInfo.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Symbol:</span>
                  <span className="font-bold text-sm text-indigo-600">{currencyInfo.symbol}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">ISO Code:</span>
                  <span className="font-mono font-medium">{currencyInfo.code}</span>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-200 flex justify-between items-center">
                  <span className="text-slate-500">Sample:</span>
                  <span className="text-base font-extrabold text-slate-900 font-mono">
                    {currencyInfo.symbol}1,234.56
                  </span>
                </div>
              </div>
            </div>

            <p className="text-[11px] text-slate-400">
              You can change this anytime later in your Profile settings.
            </p>
          </div>

          {/* Footer */}
          <div className="p-4 pt-3 border-t border-slate-100 bg-slate-50/70 shrink-0 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
            >
              {saving ? 'Saving...' : 'Save Country'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CountrySelectionModal
