import React from 'react'
import { Link } from 'react-router-dom'
import { Shield, ArrowLeft, Lock, FileText, CheckCircle, Mail } from 'lucide-react'

function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-slate-100 text-xs sm:text-sm font-semibold text-slate-700 border border-slate-200 shadow-sm transition-all"
          >
            <ArrowLeft size={16} />
            <span>Back to Home</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link
              to="/terms"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Terms of Service →
            </Link>
          </div>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-12 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
              <Shield size={14} />
              <span>Privacy & Trust</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Privacy Policy
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Last Updated: November 2026 • Effective Immediately
            </p>
          </div>

          {/* Quick Privacy Highlights */}
          <div className="grid sm:grid-cols-3 gap-4 p-5 rounded-2xl bg-purple-50/50 border border-purple-100">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs uppercase tracking-wider">
                <CheckCircle size={14} className="text-purple-600" />
                <span>Zero Data Selling</span>
              </div>
              <p className="text-xs text-slate-600">We never sell, rent, or trade your personal or financial data to advertisers.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs uppercase tracking-wider">
                <Lock size={14} className="text-purple-600" />
                <span>Encrypted Transport</span>
              </div>
              <p className="text-xs text-slate-600">All data in transit is encrypted using HTTPS and secure modern cryptographic protocols.</p>
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-purple-800 font-bold text-xs uppercase tracking-wider">
                <FileText size={14} className="text-purple-600" />
                <span>Full Ownership</span>
              </div>
              <p className="text-xs text-slate-600">You can download your entire financial history anytime via PDF or CSV export.</p>
            </div>
          </div>

          {/* Detailed Policy Sections */}
          <div className="space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">1. Overview</h2>
              <p>
                ExpenseTracker ("we", "our", or "us") provides a personal and shared finance tracking platform designed to help users log expenditures, set category budgets, manage accounts, and view visual analytics. This Privacy Policy outlines what information we collect, how it is handled, and your rights concerning your data.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">2. Information We Collect</h2>
              <p>We only collect information necessary to provide and optimize the ExpenseTracker service:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Account Credentials:</strong> Username, email address, password hash, and optional first/last names. If you register via Google OAuth 2.0, we receive your email and profile name as authorized by your Google consent screen.</li>
                <li><strong>User Preferences:</strong> Country choice (used exclusively to format currency symbols like ₹, $, €, and £) and occupation selection (used exclusively to pre-populate relevant expense categories).</li>
                <li><strong>Financial Records:</strong> Transaction descriptions, amounts, dates, categories, notes, account designations, recurring rules, and budget limits entered by you.</li>
                <li><strong>Device Camera (QR Code Scanning Only):</strong> Camera permission is requested at runtime exclusively when you open the Scan &amp; Pay scanner to scan UPI QR codes. We do not capture, record, store, or transmit any video footage or camera images to any server.</li>
                <li><strong>System &amp; Audit Logs:</strong> Timestamped login events and administrative audit records to detect unauthorized access and safeguard account security.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">3. How Your Information Is Used</h2>
              <p>We process your data strictly for the following purposes:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>To calculate monthly totals, budget burn rates, remaining limits, and spending trends.</li>
                <li>To display interactive dashboard graphs and generate exportable PDF and CSV reports.</li>
                <li>To deliver budget alert thresholds when you reach 80% or exceed category caps.</li>
                <li>To authenticate user sessions securely and prevent unauthorized access or account takeover.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">4. UPI Intent Payments &amp; Financial Security</h2>
              <p>
                Our Pay &amp; Track feature utilizes standard NPCI UPI Intent deep links (<code className="text-xs bg-slate-100 px-1 py-0.5 rounded">upi://pay</code>) to open compatible banking applications installed on your device (such as Google Pay, PhonePe, Paytm, or BHIM).
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li><strong>Zero Credential Access:</strong> We never collect, see, or store your UPI PIN, bank account credentials, debit card details, or banking passwords.</li>
                <li><strong>Secure Execution:</strong> All PIN entry and financial debits take place exclusively inside your bank or NPCI-regulated payment app.</li>
                <li><strong>Tracking Only:</strong> Our app serves strictly as an expense recording ledger to log your spending after you complete transactions.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">5. Data Security Measures</h2>
              <p>
                Passwords are encrypted using industry-standard salted hashing algorithms (bcrypt). Sessions are managed using secure JSON Web Tokens (JWT). We do not store raw, unencrypted passwords. Application traffic is enforced over TLS/HTTPS encryption.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">6. Third-Party Services &amp; Google OAuth</h2>
              <p>
                We do not share your financial information with third-party marketers. If you sign in via Google OAuth, authentication is handled directly by Google, and we only access basic identity scopes (email, profile) required for sign-in verification.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">7. Data Retention &amp; In-App Account Deletion</h2>
              <p>
                You retain complete ownership of your data. You may edit or delete individual transactions, categories, accounts, or budgets at any time. You can export your data to CSV or PDF from the Reports section.
              </p>
              <p>
                <strong>Account Deletion:</strong> You can permanently delete your entire account and all associated financial records directly inside the app at any time under <strong>Profile &gt; Delete Account &amp; Data</strong>, or by emailing <a href="mailto:experiencetracker52@gmail.com" className="text-purple-600 underline">experiencetracker52@gmail.com</a>. Upon deletion, all personal data, accounts, budgets, and transactions are irreversibly purged.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">8. Contact Us</h2>
              <p>
                If you have questions about this Privacy Policy, your personal data, or security practices, please contact us at:
              </p>
              <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm pt-1">
                <Mail size={16} />
                <a href="mailto:experiencetracker52@gmail.com" className="hover:underline">experiencetracker52@gmail.com</a>
              </div>
            </section>
          </div>

          {/* Footer Back Action */}
          <div className="pt-6 border-t border-slate-100 flex items-center justify-between">
            <Link
              to="/"
              className="text-xs sm:text-sm font-semibold text-slate-600 hover:text-purple-600 transition-colors"
            >
              ← Return to Welcome Page
            </Link>
            <Link
              to="/terms"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Review Terms of Service →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicy