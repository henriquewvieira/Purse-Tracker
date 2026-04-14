export default function CostPreviewCard({ cost_per_unit, total_cost, revenue, profit, currency = 'USD' }) {
  const fmt = (n) =>
    new Intl.NumberFormat(undefined, { style: 'currency', currency }).format(n ?? 0)

  const margin = revenue > 0 ? ((profit / revenue) * 100).toFixed(1) : null
  const isProfit = profit >= 0

  return (
    <div className="border rounded-2xl p-5 bg-white shadow-sm space-y-3">
      <h3 className="text-lg font-semibold text-gray-700">Cost Preview</h3>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-gray-500">Cost per unit</div>
          <div className="text-xl font-bold">{fmt(cost_per_unit)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-gray-500">Total cost</div>
          <div className="text-xl font-bold">{fmt(total_cost)}</div>
        </div>
        <div className="bg-gray-50 rounded-xl p-3">
          <div className="text-gray-500">Revenue</div>
          <div className="text-xl font-bold">{fmt(revenue)}</div>
        </div>
        <div className={`rounded-xl p-3 ${isProfit ? 'bg-green-50' : 'bg-red-50'}`}>
          <div className="text-gray-500">Profit</div>
          <div className={`text-xl font-bold ${isProfit ? 'text-green-700' : 'text-red-700'}`}>
            {fmt(profit)}
          </div>
          {margin !== null && (
            <div className={`text-xs mt-0.5 ${isProfit ? 'text-green-600' : 'text-red-600'}`}>
              {margin}% margin
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
