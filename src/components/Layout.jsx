import { useState, useEffect } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  // Auto-close mobile drawer on route transition
  useEffect(() => {
    setMobileMenuOpen(false)
  }, [location.pathname])

  return (
    <div className="flex h-screen h-[100dvh] bg-slate-50 text-slate-900 overflow-hidden">
      <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
      
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto pb-mobile-nav lg:pb-8">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <Outlet />
          </div>
        </main>

        <footer className="hidden lg:block border-t border-slate-200/80 bg-white py-3 text-center text-xs text-slate-400">
          © {new Date().getFullYear()} Expense Tracker. All rights reserved.
        </footer>

        <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      </div>
    </div>
  )
}

export default Layout
