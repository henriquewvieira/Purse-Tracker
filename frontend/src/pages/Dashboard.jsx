import { useState, useEffect } from 'react'
import { getMonthlyReport } from '../api/reports.js'
import { RevenueChart } from '../components/charts/RevenueChart.jsx'
import { ProfitMarginChart } from '../components/charts/ProfitMarginChart.jsx'
import { TopPurseTypesChart } from '../components/charts/TopPurseTypesChart.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

function SummaryCard({ label, value, color = 'gray' }) {
  const colors = {
    gray: 'bg-gray-50',
    green: 'bg-green-50',
    red: 'bg-red-50',
    blue: 'bg-blue-50',
  }
  return (
    <div className={`${colors[color]} rounded-2xl p-5`}>
      <div className="text-sm text-gray-500 mb-1">{label}</div>
      <div className="text-2xl font-bold text-gray-800">{value}</div>
    </div>
  )
}

export default function Dashboard() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [history, setHistory] = useState([])
  const [loading, setLoading] = useState(true)

  const fmt = (n) =>
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)

  useEffect(() => {
    setLoading(true)
    // Fetch current month + 5 previous months for charts
    const months = Array.from({ length: 6 }, (_, i) => {
      const d = new Date(year, month - 1 - i, 1)
      return { year: d.getFullYear(), month: d.getMonth() + 1 }
    }).reverse()

    Promise.all([
      getMonthlyReport(year, month),
      ...months.map((m) => getMonthlyReport(m.year, m.month)),
    ])
      .then(([current, ...hist]) => {
        setReport(current)
        setHistory(hist)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [year, month])

  const prevMonth = () => {
    if (month === 1) { setYear(y => y - 1); setMonth(12) }
    else setMonth(m => m - 1)
  }
  const nextMonth = () => {
    if (month === 12) { setYear(y => y + 1); setMonth(1) }
    else setMonth(m => m + 1)
  }

  const chartData = history.map((h) => ({
    month: MONTHS[h.month - 1],
    revenue: h.summary.total_revenue,
    margin: h.summary.profit_margin,
  }))

  const topTypes = (report?.by_purse_type || []).map((t) => ({
    name: t.name,
    value: t.revenue,
  }))

  return (
    <div className="p-5 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button onClick={prevMonth} className="p-2 rounded-lg hover:bg-gray-100 text-xl">‹</button>
          <span className="font-semibold text-gray-700 min-w-[110px] text-center">
            {MONTHS[month - 1]} {year}
          </span>
          <button onClick={nextMonth} className="p-2 rounded-lg hover:bg-gray-100 text-xl">›</button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            <SummaryCard label="Revenue" value={fmt(report?.summary.total_revenue)} color="blue" />
            <SummaryCard label="Total Cost" value={fmt(report?.summary.total_cost)} color="gray" />
            <SummaryCard
              label="Profit"
              value={fmt(report?.summary.total_profit)}
              color={report?.summary.total_profit >= 0 ? 'green' : 'red'}
            />
            <SummaryCard label="Records" value={report?.summary.records_count ?? 0} />
          </div>

          {/* Charts */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-600 mb-3">Monthly Revenue (last 6 months)</h2>
              <RevenueChart data={chartData} />
            </div>
            <div className="bg-white rounded-2xl p-5 shadow-sm">
              <h2 className="text-base font-semibold text-gray-600 mb-3">Profit Margin % (last 6 months)</h2>
              <ProfitMarginChart data={chartData} />
            </div>
            {topTypes.length > 0 && (
              <div className="bg-white rounded-2xl p-5 shadow-sm">
                <h2 className="text-base font-semibold text-gray-600 mb-3">Revenue by Purse Type (this month)</h2>
                <TopPurseTypesChart data={topTypes} />
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
