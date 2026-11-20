import { useState, useEffect } from 'react'
import { analyticsAPI, transactionAPI } from '../services/api'
import { PieChart, Pie, Cell, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { Download, Calendar, TrendingUp, TrendingDown, FileText, PieChart as PieIcon, BarChart3, AlertCircle, CheckCircle, Sparkles, Filter } from 'lucide-react'
import { format, subMonths } from 'date-fns'
import toast from 'react-hot-toast'
import { useAuth } from '../contexts/AuthContext'
import { formatCurrency as formatCurrencyUtil } from '../utils/currency'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import html2canvas from 'html2canvas'

const COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EC4899', '#8B5CF6', '#06B6D4', '#EF4444', '#14B8A6']

function Reports() {
  const { user } = useAuth()
  const [reportData, setReportData] = useState({
    categorySpending: [],
    monthlyTrend: [],
    budgetStatus: []
  })
  const [loading, setLoading] = useState(true)
  const [activePreset, setActivePreset] = useState('6m')
  const [dateRange, setDateRange] = useState({
    startDate: subMonths(new Date(), 6),
    endDate: new Date()
  })
  const [windowWidth, setWindowWidth] = useState(typeof window !== 'undefined' ? window.innerWidth : 1024)

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth)
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const isMobile = windowWidth < 640

  useEffect(() => {
    fetchReportData()
  }, [dateRange])

  const fetchReportData = async () => {
    try {
      setLoading(true)
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const [categoryRes, trendRes, budgetRes] = await Promise.all([
        analyticsAPI.getCategorySpending(params),
        analyticsAPI.getMonthlyTrend(params),
        analyticsAPI.getBudgetStatus()
      ])
      
      setReportData({
        categorySpending: categoryRes.data,
        monthlyTrend: trendRes.data,
        budgetStatus: budgetRes.data
      })
    } catch (error) {
      toast.error('Failed to load report data')
      console.error('Reports error:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatCurrency = (amount) => {
    const userCountry = user?.country || 'India'
    return formatCurrencyUtil(amount, userCountry)
  }

  const formatCategoryData = (categorySpending) => {
    return categorySpending?.map((item, index) => ({
      name: item[0],
      value: parseFloat(item[1]),
      color: COLORS[index % COLORS.length]
    })) || []
  }

  const formatTrendData = (monthlyTrend) => {
    return monthlyTrend?.map(item => ({
      month: item[0],
      amount: parseFloat(item[1])
    })) || []
  }

  const setPresetRange = (preset) => {
    setActivePreset(preset)
    const now = new Date()
    if (preset === '1m') {
      setDateRange({
        startDate: subMonths(now, 1),
        endDate: now
      })
    } else if (preset === '3m') {
      setDateRange({
        startDate: subMonths(now, 3),
        endDate: now
      })
    } else if (preset === '6m') {
      setDateRange({
        startDate: subMonths(now, 6),
        endDate: now
      })
    } else if (preset === 'ytd') {
      setDateRange({
        startDate: new Date(now.getFullYear(), 0, 1),
        endDate: now
      })
    }
  }

  const escapeCsvValue = (value) => {
    if (value === null || value === undefined) return ''
    const stringValue = String(value)
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`
    }
    return stringValue
  }

  const exportToCSV = async () => {
    try {
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      
      const res = await transactionAPI.search(params)
      const rows = res.data || []

      if (rows.length === 0) {
        toast.error('No transactions found for the selected date range')
        return
      }

      const header = ['Date', 'Time', 'Account Type', 'Type', 'Amount', 'Category', 'Description', 'Created By', 'Email']
      const csvRows = [header.map(escapeCsvValue).join(',')]

      let totalIncome = 0
      let totalExpense = 0

      rows.forEach(t => {
        const createdAt = t.createdAt ? new Date(t.createdAt) : null
        const dateStr = createdAt ? format(createdAt, 'yyyy-MM-dd') : (t.transactionDate || '')
        const timeStr = createdAt ? format(createdAt, 'HH:mm:ss') : ''
        const isExpense = t.type === 'EXPENSE'
        const isIncome = t.type === 'INCOME'
        const amount = Number(t.amount)
        const amountStr = amount.toFixed(2)
        
        if (isIncome) totalIncome += amount
        else if (isExpense) totalExpense += amount
        
        const row = [
          escapeCsvValue(dateStr),
          escapeCsvValue(timeStr),
          escapeCsvValue(t.accountType || ''),
          escapeCsvValue(isExpense ? 'Expense' : isIncome ? 'Income' : t.type),
          escapeCsvValue(amountStr),
          escapeCsvValue(t.categoryName || ''),
          escapeCsvValue(t.description || ''),
          escapeCsvValue(t.username || 'N/A'),
          escapeCsvValue(t.userEmail || '')
        ]
        csvRows.push(row.join(','))
      })

      csvRows.push('')
      csvRows.push(['', '', '', 'TOTAL INCOME', totalIncome.toFixed(2), '', '', '', ''].map(escapeCsvValue).join(','))
      csvRows.push(['', '', '', 'TOTAL EXPENSE', totalExpense.toFixed(2), '', '', '', ''].map(escapeCsvValue).join(','))
      csvRows.push(['', '', '', 'NET BALANCE', (totalIncome - totalExpense).toFixed(2), '', '', '', ''].map(escapeCsvValue).join(','))

      const csvContent = csvRows.join('\r\n')
      const BOM = '\uFEFF'
      const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' })
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `expense-report-${format(new Date(), 'yyyy-MM-dd')}.csv`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast.success(`CSV exported with ${rows.length} transactions`)
    } catch (e) {
      console.error('CSV export error:', e)
      toast.error('Failed to export CSV: ' + (e.message || 'Unknown error'))
    }
  }

  const exportToPDF = async () => {
    try {
      const doc = new jsPDF()
      let yPos = 10
      
      // Header background
      doc.setFillColor(79, 70, 229) // Indigo-600
      doc.rect(0, 0, 210, 40, 'F')
      
      // Title
      yPos = 20
      doc.setFontSize(22)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('FINANCIAL REPORT & ANALYTICS', 105, yPos, { align: 'center' })
      yPos += 8
      
      doc.setFontSize(10)
      doc.setFont(undefined, 'normal')
      doc.setTextColor(224, 231, 255)
      doc.text('Period: ' + format(dateRange.startDate, 'dd MMM yyyy') + ' - ' + format(dateRange.endDate, 'dd MMM yyyy'), 105, yPos, { align: 'center' })
      yPos += 5
      doc.text('Generated: ' + format(new Date(), 'dd MMM yyyy HH:mm'), 105, yPos, { align: 'center' })
      yPos += 18
      
      // Capture Category Spending Chart
      const categoryChart = document.getElementById('category-chart')
      if (categoryChart) {
        try {
          const canvas = await html2canvas(categoryChart, { 
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          })
          const imgData = canvas.toDataURL('image/png', 1.0)
          const imgWidth = 180
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          if (yPos + imgHeight > 270) {
            doc.addPage()
            yPos = 20
          }
          
          doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight, undefined, 'FAST')
          yPos += imgHeight + 12
        } catch (err) {
          console.error('Error capturing category chart:', err)
        }
      }
      
      // Capture Monthly Trend Chart
      const trendChart = document.getElementById('trend-chart')
      if (trendChart) {
        try {
          const canvas = await html2canvas(trendChart, { 
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          })
          const imgData = canvas.toDataURL('image/png', 1.0)
          const imgWidth = 180
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          if (yPos + imgHeight > 270) {
            doc.addPage()
            yPos = 20
          }
          
          doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight, undefined, 'FAST')
          yPos += imgHeight + 12
        } catch (err) {
          console.error('Error capturing trend chart:', err)
        }
      }
      
      // Capture Budget Status
      const budgetSection = document.getElementById('budget-status')
      if (budgetSection) {
        try {
          const canvas = await html2canvas(budgetSection, { 
            scale: 2,
            backgroundColor: '#ffffff',
            logging: false,
            useCORS: true
          })
          const imgData = canvas.toDataURL('image/png', 1.0)
          const imgWidth = 180
          const imgHeight = (canvas.height * imgWidth) / canvas.width
          
          if (yPos + imgHeight > 270) {
            doc.addPage()
            yPos = 20
          }
          
          doc.addImage(imgData, 'PNG', 15, yPos, imgWidth, imgHeight, undefined, 'FAST')
          yPos += imgHeight + 10
        } catch (err) {
          console.error('Error capturing budget section:', err)
        }
      }
      
      // Transactions Table Page
      doc.addPage()
      yPos = 15
      
      doc.setFillColor(79, 70, 229)
      doc.rect(0, 0, 210, 25, 'F')
      
      doc.setFontSize(14)
      doc.setFont(undefined, 'bold')
      doc.setTextColor(255, 255, 255)
      doc.text('TRANSACTION LEDGER DETAILS', 105, 17, { align: 'center' })
      yPos = 35
      
      const params = {
        startDate: format(dateRange.startDate, 'yyyy-MM-dd'),
        endDate: format(dateRange.endDate, 'yyyy-MM-dd')
      }
      const res = await transactionAPI.search(params)
      const rows = res.data || []
      
      const tableData = rows.map(t => {
        const createdAt = t.createdAt ? new Date(t.createdAt) : null
        const dateStr = createdAt ? format(createdAt, 'dd MMM yyyy') : (t.transactionDate || '')
        const isExpense = t.type === 'EXPENSE'
        const isIncome = t.type === 'INCOME'
        return [
          dateStr,
          t.accountType || 'Default',
          isExpense ? 'Expense' : isIncome ? 'Income' : t.type,
          Number(t.amount || 0).toFixed(2),
          t.categoryName || '',
          (t.description || '').substring(0, 40)
        ]
      })
      
      autoTable(doc, {
        head: [['Date', 'Account', 'Type', 'Amount', 'Category', 'Description']],
        body: tableData,
        startY: yPos,
        theme: 'striped',
        headStyles: { 
          fillColor: [79, 70, 229],
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold'
        },
        styles: { 
          fontSize: 9, 
          cellPadding: 4,
          textColor: [51, 65, 85]
        },
        columnStyles: {
          0: { cellWidth: 26 },
          1: { cellWidth: 24 },
          2: { cellWidth: 22, halign: 'center' },
          3: { cellWidth: 26, halign: 'right', fontStyle: 'bold' },
          4: { cellWidth: 32 },
          5: { cellWidth: 60 }
        },
        margin: { left: 10, right: 10 }
      })
      
      // Page numbering
      const pageCount = doc.internal.getNumberOfPages()
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i)
        doc.setFontSize(8)
        doc.setTextColor(148, 163, 184)
        doc.text(
          'Financial Analytics Report - Page ' + i + ' of ' + pageCount,
          105,
          290,
          { align: 'center' }
        )
      }
      
      doc.save('expense-report-' + format(new Date(), 'yyyy-MM-dd') + '.pdf')
      toast.success('PDF exported successfully!')
    } catch (e) {
      console.error('PDF export error:', e)
      toast.error('Failed to export PDF: ' + (e.message || 'Unknown error'))
    }
  }

  if (loading && !reportData.categorySpending.length) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    )
  }

  const categoryData = formatCategoryData(reportData.categorySpending)
  const trendData = formatTrendData(reportData.monthlyTrend)
  const budgetList = reportData.budgetStatus || []
  const totalCategoryExpenses = categoryData.reduce((sum, item) => sum + item.value, 0)
  const overBudgetCount = budgetList.filter(b => b.isOverBudget).length

  return (
    <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Reports & Statements
            </h1>
            <p className="text-sm text-slate-500 mt-0.5">
              Comprehensive spending trends, category distributions, and downloadable statements.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
            <button
              onClick={exportToCSV}
              className="btn-secondary"
            >
              <Download size={15} className="mr-1.5 text-slate-500" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="btn-primary"
            >
              <FileText size={15} className="mr-1.5" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        {/* Date Range & Period Filter Bar */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 bg-white p-3 sm:p-4 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1 hidden sm:inline">
              Period:
            </span>
            <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
              <button
                onClick={() => setPresetRange('1m')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === '1m'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                1 Month
              </button>
              <button
                onClick={() => setPresetRange('3m')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === '3m'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                3 Months
              </button>
              <button
                onClick={() => setPresetRange('6m')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === '6m'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                6 Months
              </button>
              <button
                onClick={() => setPresetRange('ytd')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                  activePreset === 'ytd'
                    ? 'bg-white text-indigo-600 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                YTD
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
              <Calendar size={14} className="text-slate-400 shrink-0" />
              <span>Range:</span>
            </div>
            <input
              type="date"
              value={format(dateRange.startDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setActivePreset('custom')
                setDateRange({ ...dateRange, startDate: new Date(e.target.value) })
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={format(dateRange.endDate, 'yyyy-MM-dd')}
              onChange={(e) => {
                setActivePreset('custom')
                setDateRange({ ...dateRange, endDate: new Date(e.target.value) })
              }}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5 text-slate-700 outline-none focus:bg-white focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
            />
          </div>
        </div>

        {/* 3 Analytics KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Analyzed Expenses</p>
              <h3 className="text-2xl sm:text-3xl font-black text-rose-600 mt-1">
                {formatCurrency(totalCategoryExpenses)}
              </h3>
              <span className="text-[11px] font-medium text-slate-500 mt-1 inline-block">
                Across {categoryData.length} active categor{categoryData.length !== 1 ? 'ies' : 'y'}
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <TrendingDown size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Budgets</p>
              <h3 className="text-2xl sm:text-3xl font-black text-indigo-600 mt-1">
                {budgetList.length} <span className="text-xs font-semibold text-slate-400">tracked</span>
              </h3>
              <span className="text-[11px] font-medium text-indigo-600 mt-1 inline-block">
                Financial guardrails set
              </span>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
              <CheckCircle size={24} />
            </div>
          </div>

          <div className="bg-white rounded-2xl p-5 shadow-sm border border-slate-200/80 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Budget Compliance</p>
              <h3 className={`text-2xl sm:text-3xl font-black mt-1 ${overBudgetCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {overBudgetCount > 0 ? `${overBudgetCount} Over Limit` : '100% On Track'}
              </h3>
              <span className={`text-[11px] font-medium mt-1 inline-block ${overBudgetCount > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                {overBudgetCount > 0 ? 'Requires budget re-balancing' : 'All category targets maintained'}
              </span>
            </div>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold ${
              overBudgetCount > 0 ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
            }`}>
              {overBudgetCount > 0 ? <AlertCircle size={24} /> : <CheckCircle size={24} />}
            </div>
          </div>
        </div>

        {/* Category Spending Chart Card */}
        <div id="category-chart" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <PieIcon size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Expenses by Category</h3>
                <p className="text-xs text-slate-500">Distribution of expenditures across classification tags</p>
              </div>
            </div>
            <span className="text-xs font-mono font-bold text-slate-800 bg-slate-100 px-3 py-1 rounded-xl">
              {formatCurrency(totalCategoryExpenses)}
            </span>
          </div>

          {categoryData.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              <div className="lg:col-span-6 h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={isMobile ? 45 : 60}
                      outerRadius={isMobile ? 70 : 90}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={2} stroke="#ffffff" />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => formatCurrency(value)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>

              <div className="lg:col-span-6 space-y-2.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Category Breakdown
                </h4>
                <div className="space-y-2">
                  {categoryData.map((item, index) => {
                    const pct = totalCategoryExpenses > 0 ? ((item.value / totalCategoryExpenses) * 100).toFixed(1) : 0
                    return (
                      <div key={index} className="p-3 bg-slate-50/70 hover:bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between transition-colors">
                        <div className="flex items-center gap-2.5">
                          <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                          <span className="text-xs font-bold text-slate-800">{item.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-bold text-slate-900">{formatCurrency(item.value)}</span>
                          <span className="text-[11px] font-semibold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-md">
                            {pct}%
                          </span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <PieIcon size={36} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No expense records available</p>
              <p className="text-slate-400 mt-0.5">Expenses in the selected date range will appear here</p>
            </div>
          )}
        </div>

        {/* Monthly Trend Chart Card */}
        <div id="trend-chart" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                <BarChart3 size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Monthly Spending Trend</h3>
                <p className="text-xs text-slate-500">Expenditure trajectory over the selected chronological timeframe</p>
              </div>
            </div>
          </div>

          {trendData.length > 0 ? (
            <div className="h-[320px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={trendData}>
                  <defs>
                    <linearGradient id="reportsSpendGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#4F46E5" stopOpacity={0.25} />
                      <stop offset="95%" stopColor="#4F46E5" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#F1F5F9" vertical={false} />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11, fontWeight: 500 }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: '#64748B', fontSize: 11 }}
                    tickFormatter={(val) => `${val >= 1000 ? `${(val / 1000).toFixed(0)}k` : val}`}
                  />
                  <Tooltip
                    formatter={(value) => [formatCurrency(value), 'Expenditure']}
                    contentStyle={{
                      borderRadius: '12px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.06)'
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="amount"
                    stroke="#4F46E5"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#reportsSpendGrad)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400 text-xs text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <BarChart3 size={36} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No trend velocity data available</p>
              <p className="text-slate-400 mt-0.5">Monthly trajectory updates as multi-month records are stored</p>
            </div>
          )}
        </div>

        {/* Budget Status Card */}
        <div id="budget-status" className="bg-white rounded-2xl p-5 sm:p-6 shadow-sm border border-slate-200/80">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CheckCircle size={16} />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-900">Budget Status & Guardrails</h3>
                <p className="text-xs text-slate-500">Real-time expenditure tracking against user-defined budget thresholds</p>
              </div>
            </div>
            <span className="text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-xl">
              {budgetList.length} Targets
            </span>
          </div>

          {budgetList.length > 0 ? (
            <div className="space-y-4">
              {budgetList.map((budget, index) => {
                const categoryName = budget.budget.category ? budget.budget.category.name : 'Overall Portfolio Budget'
                const isOver = budget.isOverBudget
                const isNear = budget.isNearLimit && !isOver

                return (
                  <div key={index} className="p-4 sm:p-5 rounded-2xl border border-slate-200/90 bg-slate-50/40 space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex items-center gap-2">
                        <span className={`w-2.5 h-2.5 rounded-full ${isOver ? 'bg-rose-500' : isNear ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                        <h4 className="font-bold text-sm text-slate-900">{categoryName}</h4>
                      </div>
                      <div>
                        {isOver ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertCircle size={11} />
                            Over Limit
                          </span>
                        ) : isNear ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            <AlertCircle size={11} />
                            Near Limit (80%+)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle size={11} />
                            On Target
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-xs">
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Target</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-800 mt-0.5 block">{formatCurrency(budget.budget.amount)}</span>
                      </div>
                      <div className="bg-white p-3 rounded-xl border border-slate-200/80">
                        <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Consumed</span>
                        <span className="text-xs sm:text-sm font-bold text-slate-900 mt-0.5 block">{formatCurrency(budget.spent)}</span>
                      </div>
                      <div className={`p-3 rounded-xl border ${
                        budget.remaining >= 0 ? 'bg-white border-slate-200/80' : 'bg-rose-50/50 border-rose-200'
                      }`}>
                        <span className={`text-[10px] font-bold uppercase tracking-wider block ${budget.remaining >= 0 ? 'text-slate-400' : 'text-rose-600'}`}>Remaining</span>
                        <span className={`text-xs sm:text-sm font-bold mt-0.5 block ${budget.remaining >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                          {formatCurrency(budget.remaining)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1">
                      <div className="w-full bg-slate-200/80 rounded-full h-2.5 overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${
                            isOver ? 'bg-rose-600' : isNear ? 'bg-amber-500' : 'bg-emerald-600'
                          }`}
                          style={{ width: `${Math.min(budget.percentage, 100)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                        <span>{budget.percentage.toFixed(1)}% consumed</span>
                        <span>{budget.remaining >= 0 ? `${formatCurrency(budget.remaining)} available` : `${formatCurrency(Math.abs(budget.remaining))} exceeded`}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-10 text-slate-400 text-xs text-center bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <CheckCircle size={36} className="text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No active budgets configured</p>
              <p className="text-slate-400 mt-0.5">Create monthly category budgets to monitor compliance guardrails</p>
            </div>
          )}
        </div>
      </div>
  )
}

export default Reports
