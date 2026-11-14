import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import BottomNav from './BottomNav'

function Layout() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="layout-wrapper">
      <div className="layout-background">
        <div className="layout-gradient-orb layout-orb-1"></div>
        <div className="layout-gradient-orb layout-orb-2"></div>
        <div className="layout-gradient-orb layout-orb-3"></div>
      </div>
      
      <Sidebar isOpen={mobileMenuOpen} setIsOpen={setMobileMenuOpen} />
      <div className="layout-content">
        <Header />
        <main className="layout-main">
          <div className="layout-container">
            <Outlet />
          </div>
        </main>
        <footer className="layout-footer hidden lg:block">
          <div className="footer-content">
            <div className="footer-section">
              <p className="footer-copyright">
                © {new Date().getFullYear()} Expense Tracker. All rights reserved.
              </p>
            </div>
          </div>
        </footer>
        <BottomNav onOpenMenu={() => setMobileMenuOpen(true)} />
      </div>

      <style>{`
        .layout-wrapper {
          display: flex;
          height: 100vh;
          height: 100dvh;
          position: relative;
          overflow: hidden;
        }

        .layout-background {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #e0f2fe 0%, #ddd6fe 50%, #fce7f3 100%);
          z-index: -1;
        }

        .layout-gradient-orb {
          position: absolute;
          border-radius: 50%;
          filter: blur(100px);
          opacity: 0.3;
          animation: float 25s ease-in-out infinite;
        }

        .layout-orb-1 {
          width: 600px;
          height: 600px;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          top: -20%;
          left: -10%;
          animation-delay: 0s;
        }

        .layout-orb-2 {
          width: 500px;
          height: 500px;
          background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
          bottom: -20%;
          right: -10%;
          animation-delay: 8s;
        }

        .layout-orb-3 {
          width: 400px;
          height: 400px;
          background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
          top: 40%;
          right: 30%;
          animation-delay: 16s;
        }

        @keyframes float {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          33% { transform: translate(50px, -50px) rotate(120deg); }
          66% { transform: translate(-30px, 30px) rotate(240deg); }
        }

        .layout-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          overflow-x: hidden;
          overflow-y: auto;
          min-width: 0;
        }

        .layout-main {
          flex: 1;
          overflow-x: hidden;
          overflow-y: auto;
          position: relative;
        }

        .layout-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 2rem 1.5rem;
          padding-left: max(1.5rem, env(safe-area-inset-left, 0px));
          padding-right: max(1.5rem, env(safe-area-inset-right, 0px));
        }

        .layout-footer {
          background: rgba(255, 255, 255, 0.9);
          backdrop-filter: blur(20px);
          border-top: 1px solid rgba(255, 255, 255, 0.3);
          box-shadow: 0 -10px 30px rgba(0, 0, 0, 0.05);
        }

        .footer-content {
          max-width: 1280px;
          margin: 0 auto;
          padding: 0.75rem 1.5rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .footer-section {
          text-align: center;
        }

        .footer-copyright {
          font-size: 0.75rem;
          color: #9ca3af;
          font-weight: 500;
        }

        @media (max-width: 1024px) {
          .layout-main {
            padding-bottom: max(5rem, calc(4.25rem + env(safe-area-inset-bottom)));
          }
        }

        @media (max-width: 768px) {
          .layout-container {
            padding: 1rem 0.85rem;
            padding-left: max(0.85rem, env(safe-area-inset-left, 0px));
            padding-right: max(0.85rem, env(safe-area-inset-right, 0px));
          }

          .footer-content {
            padding: 0.75rem 1rem;
          }

          .footer-copyright {
            font-size: 0.7rem;
          }

          .layout-gradient-orb {
            filter: blur(60px);
            opacity: 0.2;
          }

          .layout-orb-1 {
            width: 300px;
            height: 300px;
          }

          .layout-orb-2 {
            width: 250px;
            height: 250px;
          }

          .layout-orb-3 {
            width: 200px;
            height: 200px;
          }
        }

        @media (max-width: 480px) {
          .layout-container {
            padding: 0.75rem 0.6rem;
          }
        }
      `}</style>
    </div>
  )
}

export default Layout
