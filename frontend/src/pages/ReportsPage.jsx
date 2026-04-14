import { useState, useEffect } from 'react'
import { getMonthlyReport, exportCSV } from '../api/reports.js'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState('revenue')
  const [sortAsc, setSortAsc] = useState(false)
  const [currency, setCurrency] = useState('USD')

  const fmt = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n ?? 0)

  const load = () => {
    setLoading(true)
    getMonthlyReport(year, month)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year, month])

  const handleSort = (field) => {
    if (sortField === field) setSortAsc((a) => !a)
    else { setSortField(field); setSortAsc(false) }
  }

  const sortedTypes = [...(report?.by_purse_type || [])].sort((a, b) => {
    const diff = (a[sortField] ?? 0) - (b[sortField] ?? 0)
    return sortAsc ? diff : -diff
  })

  const SortTh = ({ field, children }) => (
    <th
      className="px-4 py-3 font-medium cursor-pointer hover:text-indigo-600 select-none"
      onClick={() => handleSort(field)}
    >
      {children} {sortField === field ? (sortAsc ? '↑' : '↓') : ''}
    </th>
  )

  const years = Array.from({ length: 5 }, (_, i) => now.getFullYear() - i)

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Reports</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={year}
            onChange={(e) => setYear(Number(e.target.value))}
          >
            {years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <select
            className="border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
            value={month}
            onChange={(e) => setMonth(Number(e.target.value))}
          >
            {MONTHS.map((m, i) => <option key={i} value={i + 1}>{m}</option>)}
          </select>
          <Button variant="secondary" onClick={() => exportCSV(year, month)}>
            Export CSV
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : report ? (
        <>
          {/* Summary */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            {[
              { label: 'Revenue', value: fmt(report.summary.total_revenue) },
              { label: 'Total Cost', value: fmt(report.summary.total_cost) },
              { label: 'Profit', value: fmt(report.summary.total_profit) },
              { label: 'Margin', value: `${(report.summary.profit_margin || 0).toFixed(1)}%` },
            ].map((c) => (
              <div key={c.label} className="bg-gray-50 rounded-2xl p-4">
                <div className="text-xs text-gray-400">{c.label}</div>
                <div className="text-xl font-bold">{c.value}</div>
              </div>
            ))}
          </div>

          {/* Breakdown by purse type */}
          <div className="bg-white rounded-2xl shadow-sm overflow-hidden mb-6">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-gray-500 text-left">
                <tr>
                  <SortTh field="name">Purse Type</SortTh>
                  <SortTh field="quantity">Qty</SortTh>
                  <SortTh field="revenue">Revenue</SortTh>
                  <SortTh field="total_cost">Cost</SortTh>
                  <SortTh field="profit">Profit</SortTh>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sortedTypes.length === 0 && (
                  <tr><td colSpan={5} className="text-center py-10 text-gray-400">No data for this month</td></tr>
                )}
                {sortedTypes.map((t) => (
                  <tr key={t.purse_type_id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{t.name}</td>
                    <td className="px-4 py-3">{t.quantity}</td>
                    <td className="px-4 py-3">{fmt(t.revenue)}</td>
                    <td className="px-4 py-3">{fmt(t.total_cost)}</td>
                    <td className={`px-4 py-3 font-medium ${t.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {fmt(t.profit)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Individual records */}
          {report.records.length > 0 && (
            <div>
              <h2 className="text-lg font-semibold text-gray-700 mb-3">Production Records</h2>
              <div className="space-y-2">
                {report.records.map((r) => (
                  <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 text-sm">
                    <div>
                      <div className="text-gray-400 text-xs">Date</div>
                      <div>{new Date(r.date_produced).toLocaleDateString()}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Type</div>
                      <div>{r.purse_type.name}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Qty</div>
                      <div>{r.quantity}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Revenue</div>
                      <div>{fmt(r.computed_revenue)}</div>
                    </div>
                    <div>
                      <div className="text-gray-400 text-xs">Profit</div>
                      <div className={r.computed_profit >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {fmt(r.computed_profit)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}
    </div>
  )
}
