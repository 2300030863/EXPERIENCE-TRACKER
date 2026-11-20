import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { 
  ArrowRight, DollarSign, TrendingUp, PieChart, Shield, 
  Users, Tag, CreditCard, Zap, Star, CheckCircle,
  Sparkles, BarChart3, Wallet, Repeat, FileText, Download,
  Lock, Globe, ArrowUpRight, HelpCircle, Check, ChevronRight,
  Target
} from 'lucide-react'

function Welcome() {
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('all')

  const coreFeatures = [
    {
      icon: CreditCard,
      title: "Smart Transaction Tracking",
      category: "daily",
      tag: "Core Feature",
      desc: "Record income and expenses in seconds with custom dates, detailed receipt notes, account assignment, and categorization. Filter and search through thousands of records instantly.",
      badge: "Real-time"
    },
    {
      icon: Target,
      title: "Proactive Budgeting & Alerts",
      category: "planning",
      tag: "Financial Safety",
      desc: "Set monthly, weekly, or custom category spending limits. Visual progress meters keep you informed with automatic warnings when you reach 80% or exceed your budget limit.",
      badge: "Threshold Alerts"
    },
    {
      icon: BarChart3,
      title: "Visual Reports & Analytics",
      category: "insights",
      tag: "Deep Analytics",
      desc: "Gain crystal-clear visibility into your financial health with interactive category spending pie charts, monthly spending trend curves, and net balance breakdowns.",
      badge: "Visual Charts"
    },
    {
      icon: Repeat,
      title: "Automated Recurring Bills",
      category: "daily",
      tag: "Automation",
      desc: "Never miss a recurring payment. Track monthly subscriptions (Netflix, Spotify, gym), house rent, insurance premiums, and recurring salaries automatically.",
      badge: "Zero Hassle"
    },
    {
      icon: Wallet,
      title: "Multi-Account & Wallet Management",
      category: "daily",
      tag: "Asset Ledger",
      desc: "Manage all your financial assets in one place: Bank Accounts, Credit Cards, Cash, Savings, Digital Wallets, and Investments with automatic balance calculations.",
      badge: "Multi-Account"
    },
    {
      icon: Tag,
      title: "Occupation-Tailored Categories",
      category: "planning",
      tag: "Personalized",
      desc: "Choose your profession (Software Engineer, Doctor, Freelancer, Student, Designer, Lawyer, Business) and get pre-populated, tailored expense categories instantly.",
      badge: "Smart Setup"
    },
    {
      icon: Download,
      title: "1-Click PDF & CSV Export",
      category: "insights",
      tag: "Reporting",
      desc: "Download presentation-ready PDF reports with embedded color charts, summary statistics, and itemized transaction tables ready for accounting and tax filing.",
      badge: "Print Ready"
    },
    {
      icon: Shield,
      title: "Enterprise Multi-Role Security",
      category: "security",
      tag: "Access Control",
      desc: "Protected by industry-standard bcrypt encryption, JWT security, Google OAuth 2.0 integration, and tiered role-based access for Users, Group Admins, and System Owners.",
      badge: "Enterprise Grade"
    }
  ]

  const howItWorks = [
    {
      step: "01",
      title: "Create Your Account",
      desc: "Sign up in 30 seconds using your email with OTP verification or use 1-tap Google Sign-In. Select your home country to set your preferred currency symbol (₹, $, €, £).",
      icon: Users
    },
    {
      step: "02",
      title: "Choose Your Occupation",
      desc: "Select what you do for a living. The system automatically creates a tailored set of color-coded expense categories suited to your exact lifestyle and professional needs.",
      icon: Tag
    },
    {
      step: "03",
      title: "Track Income & Expenses",
      desc: "Quickly log daily purchases, assign them to your bank or card accounts, and set budget limits to monitor spending before month-end surprises occur.",
      icon: CreditCard
    },
    {
      step: "04",
      title: "Analyze & Export Reports",
      desc: "Inspect beautiful visual charts, identify spending leaks, and download audit-ready PDF or CSV financial statements with a single click.",
      icon: FileText
    }
  ]

  const audienceList = [
    {
      title: "Individuals & Students",
      desc: "Take command of personal daily cashflow, eliminate impulse purchases, and build healthy long-term savings habits with clear category breakdown charts.",
      highlights: ["Track pocket money and allowances", "Avoid unexpected overdraft fees", "Set monthly spending limits"]
    },
    {
      title: "Freelancers & Contractors",
      desc: "Easily separate business expenses from personal funds. Track software subscriptions, home office bills, and export clean statements for tax deductions.",
      highlights: ["Categorize professional software & gear", "Track recurring client income & subscriptions", "Export formatted CSV/PDF statements for tax"]
    },
    {
      title: "Families & Shared Households",
      desc: "Collaborate with family members or roommates. Group admins manage shared budgets and monitor collective grocery, rent, and utility bills.",
      highlights: ["Centralized multi-account tracking", "Shared category budgeting thresholds", "Unified monthly financial summaries"]
    }
  ]

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 selection:bg-slate-900 selection:text-white">
      {/* Top Announcement Bar */}
      <div className="bg-slate-900 text-slate-300 text-[11px] sm:text-xs py-1.5 px-4 text-center font-medium">
        <span>Expense Tracker — Personal finance management and real-time cash flow tracking.</span>
      </div>

      {/* Main Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Brand Logo */}
          <Link to="/" className="flex items-center gap-2.5 flex-shrink-0">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <CreditCard className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 leading-tight">
                Expense<span className="text-slate-600">Tracker</span>
              </span>
            </div>
          </Link>

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs sm:text-sm font-medium text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <a href="#audience" className="hover:text-slate-900 transition-colors">Who It's For</a>
            <Link to="/privacy-policy" className="hover:text-slate-900 transition-colors">Privacy</Link>
            <Link to="/terms" className="hover:text-slate-900 transition-colors">Terms</Link>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center gap-2.5 flex-shrink-0">
            <button
              onClick={() => navigate('/login')}
              className="btn-secondary text-xs"
            >
              Sign In
            </button>
            <button
              onClick={() => navigate('/register')}
              className="btn-primary text-xs"
            >
              <span>Get Started</span>
              <ArrowRight size={14} className="ml-1" />
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-white border-b border-slate-200 py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Column */}
            <div className="lg:col-span-7 space-y-5">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-slate-100 text-slate-700 text-xs font-semibold">
                <span>Personal & Family Finance</span>
              </div>

              <h1 className="text-3xl sm:text-5xl font-bold text-slate-900 tracking-tight leading-tight">
                Take control of your income, expenses, and monthly budgets.
              </h1>

              <p className="text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                A clean, reliable expense tracker to log transactions, manage multiple accounts, automate recurring subscriptions, and understand your cash flow with clear visual reports.
              </p>

              {/* Call to action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <button
                  onClick={() => navigate('/register')}
                  className="btn-primary py-3 px-6 text-sm"
                >
                  <span>Create Account</span>
                  <ArrowRight size={16} className="ml-1.5" />
                </button>
                <button
                  onClick={() => navigate('/login')}
                  className="btn-secondary py-3 px-6 text-sm"
                >
                  Sign In to Existing Account
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4 pt-6 border-t border-slate-100 max-w-md text-xs">
                <div>
                  <div className="font-bold text-slate-900 text-base">Multi-Currency</div>
                  <div className="text-slate-500">₹, $, €, £ supported</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">Secure TLS</div>
                  <div className="text-slate-500">Encrypted in transit</div>
                </div>
                <div>
                  <div className="font-bold text-slate-900 text-base">Data Export</div>
                  <div className="text-slate-500">PDF & CSV downloads</div>
                </div>
              </div>
            </div>

            {/* Right Column: Hero Visual Card */}
            <div className="lg:col-span-5">
              <div className="bg-white rounded-3xl border border-slate-200 shadow-xl p-6 sm:p-8 space-y-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <PieChart size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-slate-900 text-sm">Monthly Financial Summary</h3>
                      <p className="text-xs text-slate-500">Live Dashboard Preview</p>
                    </div>
                  </div>
                  <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    Healthy Budget
                  </span>
                </div>

                {/* Sample Stats Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-100">
                    <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">Total Income</span>
                    <span className="text-lg font-black text-emerald-800">₹85,000.00</span>
                  </div>
                  <div className="p-3.5 rounded-2xl bg-rose-50/60 border border-rose-100">
                    <span className="text-[11px] font-bold text-rose-700 uppercase tracking-wider block">Total Expenses</span>
                    <span className="text-lg font-black text-rose-800">₹32,450.00</span>
                  </div>
                </div>

                {/* Budget Progress Meter */}
                <div className="space-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <div className="flex justify-between text-xs font-bold">
                    <span className="text-slate-700">Monthly Budget (₹50,000)</span>
                    <span className="text-purple-600">64.9% Used</span>
                  </div>
                  <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-500 to-indigo-600 h-3 rounded-full" style={{ width: '64.9%' }}></div>
                  </div>
                  <div className="flex justify-between text-[11px] text-slate-500 font-medium">
                    <span>Spent: ₹32,450.00</span>
                    <span className="text-emerald-600 font-bold">Remaining: ₹17,550.00</span>
                  </div>
                </div>

                {/* Quick Feature Highlights list */}
                <div className="space-y-2 pt-2">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle size={16} className="text-purple-600 flex-shrink-0" />
                    <span>Multi-account ledger (Cash, Bank, Credit Card)</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle size={16} className="text-purple-600 flex-shrink-0" />
                    <span>Automatic 80% budget limit warning notifications</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <CheckCircle size={16} className="text-purple-600 flex-shrink-0" />
                    <span>1-click export to PDF report and raw CSV file</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* About Section: What is ExpenseTracker? */}
      <section id="about" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              About This Application
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Why We Built ExpenseTracker
            </h2>
            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Managing money across multiple bank accounts, credit cards, digital wallets, and cash can be chaotic. Spreadsheets are tedious to maintain, and generic banking apps don't connect your accounts or alert you before you overspend.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center font-bold mb-4">
                <Wallet size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Unified Financial Overview</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Connect your Cash, Savings, Checking, Credit Card, and Digital Wallet balances in one intuitive interface. Know your net worth and available liquid cash with zero guesswork.
              </p>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold mb-4">
                <Target size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Discipline Before Overspending</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Standard apps only tell you what you already spent. Our dynamic threshold alerts notify you when you cross 80% of your category allowance, giving you time to adjust before it's too late.
              </p>
            </div>

            <div className="bg-slate-50 p-6 sm:p-8 rounded-3xl border border-slate-200 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center font-bold mb-4">
                <FileText size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-900">Tax & Audit Ready Data</h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Generate clean, formatted PDF reports containing category charts, monthly trend graphs, and itemized records. Export to CSV for accountant reviews or tax filing anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Comprehensive Features Grid */}
      <section id="features" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-12">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Powerful Capabilities
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Everything You Need to Manage Your Money
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Every tool and module has been engineered for speed, responsiveness, and maximum financial clarity.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {coreFeatures.map((feat, idx) => {
              const Icon = feat.icon
              return (
                <div
                  key={idx}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-700 flex items-center justify-center border border-purple-100">
                        <Icon size={22} />
                      </div>
                      <span className="text-[11px] font-bold text-purple-700 bg-purple-50 px-2.5 py-1 rounded-full border border-purple-200">
                        {feat.badge}
                      </span>
                    </div>
                    <h3 className="text-base font-bold text-slate-900 leading-snug">{feat.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed">{feat.desc}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                    {feat.tag}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Simple 4-Step Process
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              How ExpenseTracker Works
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              From initial registration to comprehensive financial clarity in under 2 minutes.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {howItWorks.map((item, index) => {
              const Icon = item.icon
              return (
                <div key={index} className="relative bg-slate-50 p-6 rounded-3xl border border-slate-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black text-purple-600">{item.step}</span>
                    <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
                      <Icon size={18} />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{item.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">{item.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* Audience Section: Who It's Built For */}
      <section id="audience" className="py-16 sm:py-24 bg-slate-50 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center space-y-4 mb-14">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-600 bg-purple-50 px-3 py-1 rounded-full border border-purple-200">
              Designed For Real Lives
            </span>
            <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
              Tailored For Everyone Who Values Financial Clarity
            </h2>
            <p className="text-base sm:text-lg text-slate-600">
              Whether you are an individual wanting to save, a freelancer tracking deductions, or a family budgeting together.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {audienceList.map((aud, index) => (
              <div key={index} className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4 flex flex-col justify-between">
                <div className="space-y-3">
                  <h3 className="text-xl font-bold text-slate-900">{aud.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">{aud.desc}</p>
                  <ul className="space-y-2 pt-3 border-t border-slate-100">
                    {aud.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-medium text-slate-700">
                        <Check size={14} className="text-purple-600 shrink-0 mt-0.5" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <button
                  onClick={() => navigate('/register')}
                  className="w-full py-2.5 rounded-xl bg-slate-100 hover:bg-purple-50 text-slate-700 hover:text-purple-700 font-bold text-xs transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Start with this profile</span>
                  <ArrowRight size={13} />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security, Privacy & Terms Summary Section */}
      <section className="py-16 sm:py-24 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl">
            <div className="grid lg:grid-cols-2 gap-10 items-center">
              <div className="space-y-4">
                <span className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-white/20 border border-white/30 text-white">
                  Data Protection & Compliance
                </span>
                <h2 className="text-2xl sm:text-4xl font-black text-white tracking-tight">
                  Your Privacy & Data Security Are Our Top Priorities
                </h2>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  We believe your financial logs are strictly confidential. We do not sell your personal data or transaction history to advertisers, lenders, or third parties. All accounts are guarded with robust cryptographic hashing, encrypted transport (HTTPS), and role segregation.
                </p>
                <div className="flex flex-wrap gap-4 pt-2">
                  <Link
                    to="/privacy-policy"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs sm:text-sm shadow-md transition-colors"
                  >
                    <span>Read Privacy Policy</span>
                    <ArrowUpRight size={15} />
                  </Link>
                  <Link
                    to="/terms"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 border border-white/25 text-white font-bold text-xs sm:text-sm transition-colors"
                  >
                    <span>Read Terms of Service</span>
                    <ArrowUpRight size={15} />
                  </Link>
                </div>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-2">
                  <Shield className="text-purple-400" size={24} />
                  <h4 className="font-bold text-sm text-white">Zero Data Selling</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    We never monetize, harvest, or broker your personal budget logs or transaction details.
                  </p>
                </div>
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-2">
                  <Lock className="text-indigo-400" size={24} />
                  <h4 className="font-bold text-sm text-white">Bcrypt Encrypted</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    All authentication credentials are protected with one-way salted password hashing.
                  </p>
                </div>
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-2">
                  <Download className="text-emerald-400" size={24} />
                  <h4 className="font-bold text-sm text-white">Full Data Portability</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    You own your records. Export your full transaction dataset to CSV or PDF at any time.
                  </p>
                </div>
                <div className="bg-white/10 p-5 rounded-2xl border border-white/10 space-y-2">
                  <Globe className="text-cyan-400" size={24} />
                  <h4 className="font-bold text-sm text-white">Fair Usage Terms</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    Clear, transparent service terms. No hidden subscriptions or forced paywalls.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Registration Section */}
      <section className="py-16 sm:py-20 bg-slate-100 border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-2xl sm:text-4xl font-black text-slate-900 tracking-tight">
            Ready to Take Control of Your Financial Journey?
          </h2>
          <p className="text-sm sm:text-base text-slate-600 max-w-xl mx-auto">
            Join thousands of users who track their spending and meet their budget goals every single month. Free to register, no credit card required.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-3 pt-2">
            <button
              onClick={() => navigate('/register')}
              className="px-8 py-3.5 bg-purple-600 hover:bg-purple-700 text-white font-bold text-sm sm:text-base rounded-2xl shadow-lg shadow-purple-600/30 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>Get Started Now — It's Free</span>
              <ArrowRight size={17} />
            </button>
            <button
              onClick={() => navigate('/login')}
              className="px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 font-bold text-sm sm:text-base rounded-2xl shadow-sm transition-all text-center"
            >
              Sign In to Your Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer with Legal, Terms, and Privacy Links */}
      <footer className="bg-slate-900 text-white py-12 sm:py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 pb-10 border-b border-slate-800">
            {/* Column 1: Brand Info */}
            <div className="md:col-span-2 space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600 flex items-center justify-center text-white font-bold">
                  <CreditCard size={18} />
                </div>
                <span className="text-lg font-black tracking-tight">ExpenseTracker</span>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
                A modern, intuitive expense tracking and budget analytics platform designed to give you clarity and control over every transaction, account, and financial goal.
              </p>
              <p className="text-xs text-slate-500">
                © {new Date().getFullYear()} ExpenseTracker. All rights reserved.
              </p>
            </div>

            {/* Column 2: Quick Links */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Navigation</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li><a href="#about" className="hover:text-purple-400 transition-colors">About Application</a></li>
                <li><a href="#features" className="hover:text-purple-400 transition-colors">Features & Modules</a></li>
                <li><a href="#how-it-works" className="hover:text-purple-400 transition-colors">How It Works</a></li>
                <li><a href="#audience" className="hover:text-purple-400 transition-colors">Who It's Built For</a></li>
                <li><Link to="/login" className="hover:text-purple-400 transition-colors">User Sign In</Link></li>
                <li><Link to="/register" className="hover:text-purple-400 transition-colors">Register Free</Link></li>
              </ul>
            </div>

            {/* Column 3: Legal & Compliance */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">Legal & Terms</h4>
              <ul className="space-y-1.5 text-xs text-slate-300">
                <li>
                  <Link to="/privacy-policy" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <span>Privacy Policy</span>
                    <ArrowUpRight size={12} className="text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link to="/terms" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <span>Terms of Service</span>
                    <ArrowUpRight size={12} className="text-slate-500" />
                  </Link>
                </li>
                <li>
                  <Link to="/contact" className="hover:text-purple-400 transition-colors flex items-center gap-1">
                    <span>Contact Support</span>
                    <ArrowUpRight size={12} className="text-slate-500" />
                  </Link>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
            <p>ExpenseTracker • Built for personal and shared financial well-being.</p>
            <div className="flex gap-6">
              <Link to="/privacy-policy" className="hover:text-slate-400 transition-colors">Privacy Policy</Link>
              <Link to="/terms" className="hover:text-slate-400 transition-colors">Terms of Service</Link>
              <Link to="/contact" className="hover:text-slate-400 transition-colors">Contact</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Welcome