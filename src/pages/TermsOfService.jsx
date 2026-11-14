import React from 'react'
import { Link } from 'react-router-dom'
import { FileText, ArrowLeft, Shield, CheckCircle, Mail, AlertCircle } from 'lucide-react'

function TermsOfService() {
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
              to="/privacy-policy"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Privacy Policy →
            </Link>
          </div>
        </div>

        {/* Main Document Card */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 sm:p-12 space-y-8">
          {/* Header */}
          <div className="border-b border-slate-100 pb-6 space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 text-xs font-bold uppercase tracking-wider border border-purple-200">
              <FileText size={14} />
              <span>User Agreement</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Terms of Service
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Last Updated: November 2026 • Effective Immediately
            </p>
          </div>

          {/* Quick Summary Box */}
          <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
            <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <CheckCircle size={16} className="text-purple-600" />
              <span>Summary of Terms</span>
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              By accessing or using ExpenseTracker, you agree to these Terms. You retain full ownership of your data, you are responsible for maintaining the confidentiality of your login credentials, and the application is provided for informational and financial tracking purposes.
            </p>
          </div>

          {/* Detailed Terms */}
          <div className="space-y-6 text-sm sm:text-base text-slate-700 leading-relaxed">
            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">1. Acceptance of Terms</h2>
              <p>
                By creating an account, logging in, or accessing any part of the ExpenseTracker application (web or mobile), you agree to comply with and be legally bound by these Terms of Service and our Privacy Policy. If you do not agree to these terms, please do not use the application.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">2. Account Registration & Security</h2>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>You must provide accurate, current, and complete information during registration.</li>
                <li>You are solely responsible for maintaining the confidentiality of your password and credentials.</li>
                <li>You agree to notify us immediately of any unauthorized access to or compromise of your account.</li>
                <li>We reserve the right to suspend accounts that engage in fraudulent activity, security abuse, or violations of these terms.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">3. User Data & Ownership</h2>
              <p>
                You retain all rights and ownership to the financial entries, categories, budgets, and descriptions you log into ExpenseTracker. We do not claim any ownership over your content. You grant us the limited right to process and display this data solely for the operation of the application services on your behalf.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">4. Financial Disclaimer</h2>
              <p>
                ExpenseTracker is a self-service personal and shared expense logging tool. The charts, analytics, category breakdowns, and exportable reports are for your personal organizational purposes and do not constitute certified accounting, financial, legal, or investment advice. You remain responsible for verifying numbers prior to tax filings.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">5. Acceptable Use Policy</h2>
              <p>You agree not to misuse the platform, including but not limited to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
                <li>Attempting to probe, scan, or breach system security vulnerabilities.</li>
                <li>Interfering with or disrupting the integrity or performance of the servers or database.</li>
                <li>Impersonating another person or misrepresenting authorization within user groups.</li>
                <li>Attempting to reverse engineer or extract backend source code without written permission.</li>
              </ul>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">6. Modifications to Service</h2>
              <p>
                We continuously improve ExpenseTracker. We may add, modify, or remove features from time to time. Whenever significant updates are made to these terms, we will update the "Last Updated" date at the top of this document.
              </p>
            </section>

            <section className="space-y-2">
              <h2 className="text-lg sm:text-xl font-bold text-slate-900">7. Contact Information</h2>
              <p>
                For any questions or legal inquiries regarding these Terms of Service, please contact us at:
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
              to="/privacy-policy"
              className="text-xs sm:text-sm font-semibold text-purple-600 hover:text-purple-700 transition-colors"
            >
              Read Privacy Policy →
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TermsOfService