import { useState, useRef, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import { Globe } from 'lucide-react'

const LANGUAGES = [
  { code: 'en', label: 'English',  flag: '🇬🇧' },
  { code: 'hi', label: 'हिन्दी',    flag: '🇮🇳' },
  { code: 'es', label: 'Español',  flag: '🇪🇸' },
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'de', label: 'Deutsch',  flag: '🇩🇪' },
  { code: 'zh', label: '中文',      flag: '🇨🇳' },
  { code: 'ar', label: 'العربية',  flag: '🇸🇦' },
  { code: 'ja', label: '日本語',    flag: '🇯🇵' },
]

function LanguageSwitcher() {
  const { i18n } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0]

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    if (open) document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleSelect = (code) => {
    i18n.changeLanguage(code)
    // RTL support
    document.documentElement.dir = code === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = code
    setOpen(false)
  }

  return (
    <div className="lang-switcher" ref={ref}>
      <button
        type="button"
        className="lang-btn"
        onClick={() => setOpen(!open)}
        aria-label="Select language"
      >
        <Globe size={16} className="lang-globe" />
        <span className="lang-flag">{current.flag}</span>
        <span className="lang-label">{current.label}</span>
        <span className={`lang-chevron ${open ? 'lang-chevron-open' : ''}`}>▾</span>
      </button>

      {open && (
        <div className="lang-dropdown">
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              type="button"
              className={`lang-option ${lang.code === current.code ? 'lang-option-active' : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className="lang-option-flag">{lang.flag}</span>
              <span className="lang-option-label">{lang.label}</span>
              {lang.code === current.code && <span className="lang-option-check">✓</span>}
            </button>
          ))}
        </div>
      )}

      <style>{`
        .lang-switcher {
          position: relative;
          z-index: 100;
        }

        .lang-btn {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 12px;
          border-radius: 999px;
          background: rgba(255, 255, 255, 0.7);
          backdrop-filter: blur(12px);
          border: 1.5px solid rgba(139, 92, 246, 0.3);
          cursor: pointer;
          transition: all 0.25s ease;
          font-size: 0.82rem;
          font-weight: 600;
          color: #5b21b6;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.15);
        }

        .lang-btn:hover {
          background: rgba(139, 92, 246, 0.12);
          border-color: rgba(139, 92, 246, 0.5);
          box-shadow: 0 4px 16px rgba(139, 92, 246, 0.25);
          transform: translateY(-1px);
        }

        .lang-globe {
          color: #8b5cf6;
        }

        .lang-flag {
          font-size: 1rem;
          line-height: 1;
        }

        .lang-label {
          display: none;
        }

        @media (min-width: 640px) {
          .lang-label {
            display: inline;
          }
        }

        .lang-chevron {
          font-size: 0.65rem;
          transition: transform 0.2s ease;
          display: inline-block;
          opacity: 0.7;
        }

        .lang-chevron-open {
          transform: rotate(180deg);
        }

        .lang-dropdown {
          position: absolute;
          right: 0;
          top: calc(100% + 8px);
          width: 180px;
          background: rgba(255, 255, 255, 0.98);
          backdrop-filter: blur(20px);
          border: 1.5px solid rgba(139, 92, 246, 0.2);
          border-radius: 16px;
          box-shadow: 0 12px 40px rgba(139, 92, 246, 0.2), 0 4px 16px rgba(0,0,0,0.08);
          overflow: hidden;
          animation: langDropIn 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
          z-index: 9999;
        }

        [dir="rtl"] .lang-dropdown {
          right: auto;
          left: 0;
        }

        @keyframes langDropIn {
          from { opacity: 0; transform: translateY(-8px) scale(0.96); }
          to   { opacity: 1; transform: translateY(0) scale(1); }
        }

        .lang-option {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 14px;
          border: none;
          background: transparent;
          cursor: pointer;
          font-size: 0.85rem;
          font-weight: 500;
          color: #374151;
          transition: all 0.2s ease;
          text-align: left;
        }

        [dir="rtl"] .lang-option {
          text-align: right;
          flex-direction: row-reverse;
        }

        .lang-option:hover {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.08) 0%, rgba(219, 39, 119, 0.05) 100%);
          color: #7c3aed;
        }

        .lang-option-active {
          background: linear-gradient(90deg, rgba(139, 92, 246, 0.12) 0%, rgba(219, 39, 119, 0.08) 100%);
          color: #7c3aed;
          font-weight: 700;
        }

        .lang-option-flag {
          font-size: 1.1rem;
          line-height: 1;
          flex-shrink: 0;
        }

        .lang-option-label {
          flex: 1;
        }

        .lang-option-check {
          font-size: 0.75rem;
          color: #7c3aed;
          flex-shrink: 0;
        }
      `}</style>
    </div>
  )
}

export default LanguageSwitcher
