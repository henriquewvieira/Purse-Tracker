import { useState, useEffect } from 'react'
import { getMonthlyReport, exportCSV } from '../api/reports.js'
import { updateProductionRecord, deleteProductionRecord } from '../api/productionRecords.js'
import { getPurseTypes } from '../api/purseTypes.js'
import { getSettings } from '../api/settings.js'
import { computeCosts } from '../lib/computeCosts.js'
import Button from '../components/ui/Button.jsx'
import Spinner from '../components/ui/Spinner.jsx'
import Modal from '../components/ui/Modal.jsx'
import Input from '../components/ui/Input.jsx'
import CostPreviewCard from '../components/ui/CostPreviewCard.jsx'

const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']

const fmt = (n) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n ?? 0)

function toDateInput(isoString) {
  return new Date(isoString).toISOString().split('T')[0]
}

export default function ReportsPage() {
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [report, setReport] = useState(null)
  const [loading, setLoading] = useState(false)
  const [sortField, setSortField] = useState('revenue')
  const [sortAsc, setSortAsc] = useState(false)

  // Edit modal state
  const [editRecord, setEditRecord] = useState(null)
  const [purseTypes, setPurseTypes] = useState([])
  const [settings, setSettings] = useState(null)
  const [editForm, setEditForm] = useState(null)
  const [editOverrides, setEditOverrides] = useState({})
  const [editStep, setEditStep] = useState('form') // 'form' | 'preview'
  const [editPreview, setEditPreview] = useState(null)
  const [editSaving, setEditSaving] = useState(false)
  const [editError, setEditError] = useState('')

  // Delete confirm state
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    getMonthlyReport(year, month)
      .then(setReport)
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [year, month])

  // Load purse types + settings once for the edit modal
  useEffect(() => {
    Promise.all([getPurseTypes(), getSettings()])
      .then(([types, s]) => { setPurseTypes(types); setSettings(s) })
  }, [])

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

  // --- Edit ---
  const openEdit = (r) => {
    setEditRecord(r)
    setEditForm({
      purse_type_id: r.purse_type_id,
      date_produced: toDateInput(r.date_produced),
      quantity: r.quantity,
      sale_price_per_unit: r.sale_price_per_unit ?? '',
      labor_minutes: r.labor_minutes,
      other_costs: r.other_costs,
      notes: r.notes || '',
    })
    setEditOverrides(r.material_overrides || {})
    setEditStep('form')
    setEditPreview(null)
    setEditError('')
  }

  const selectedEditType = purseTypes.find((t) => t.id === Number(editForm?.purse_type_id))

  const calcEditPreview = () => {
    if (!selectedEditType || !settings) return null
    const map = {}
    for (const pm of selectedEditType.purse_materials) map[pm.material_id] = pm.material
    const numericOverrides = {}
    for (const [id, val] of Object.entries(editOverrides)) {
      if (val !== '' && val != null) numericOverrides[id] = Number(val)
    }
    return computeCosts(
      selectedEditType, map,
      {
        quantity: Number(editForm.quantity) || 1,
        labor_minutes: Number(editForm.labor_minutes) || 0,
        other_costs: Number(editForm.other_costs) || 0,
        sale_price_per_unit: editForm.sale_price_per_unit !== '' ? Number(editForm.sale_price_per_unit) : null,
        material_overrides: numericOverrides,
      },
      settings
    )
  }

  const handleEditPreview = (e) => {
    e.preventDefault()
    setEditPreview(calcEditPreview())
    setEditStep('preview')
  }

  const handleEditSave = async () => {
    setEditSaving(true)
    setEditError('')
    const numericOverrides = {}
    for (const [id, val] of Object.entries(editOverrides)) {
      if (val !== '' && val != null) numericOverrides[id] = Number(val)
    }
    try {
      await updateProductionRecord(editRecord.id, {
        purse_type_id: Number(editForm.purse_type_id),
        date_produced: editForm.date_produced,
        quantity: Number(editForm.quantity),
        sale_price_per_unit: editForm.sale_price_per_unit !== '' ? Number(editForm.sale_price_per_unit) : null,
        labor_minutes: Number(editForm.labor_minutes) || 0,
        other_costs: Number(editForm.other_costs) || 0,
        material_overrides: numericOverrides,
        notes: editForm.notes,
      })
      setEditRecord(null)
      load()
    } catch (err) {
      setEditError(err.message)
    } finally {
      setEditSaving(false)
    }
  }

  // --- Delete ---
  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteProductionRecord(confirmDelete.id)
      setConfirmDelete(null)
      load()
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

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
                  <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm flex flex-wrap gap-4 text-sm items-center">
                    <div>
                      <div className="text-gray-400 text-xs">Date</div>
                      <div>{new Date(r.date_produced).toLocaleDateString('pt-BR')}</div>
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
                    <div className="ml-auto flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(r)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setConfirmDelete(r)}>Delete</Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      ) : null}

      {/* Edit Modal */}
      <Modal isOpen={editRecord !== null} onClose={() => setEditRecord(null)} title="Edit Production Record">
        {editForm && (
          editStep === 'form' ? (
            <form onSubmit={handleEditPreview} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Purse Type</label>
                <select
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  value={editForm.purse_type_id}
                  onChange={(e) => setEditForm({ ...editForm, purse_type_id: Number(e.target.value) })}
                  required
                >
                  {purseTypes.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
                </select>
              </div>
              <Input label="Date Produced *" type="date" value={editForm.date_produced} onChange={(e) => setEditForm({ ...editForm, date_produced: e.target.value })} required />
              <Input label="Quantity *" type="number" min="1" value={editForm.quantity} onChange={(e) => setEditForm({ ...editForm, quantity: e.target.value })} required />
              <Input label="Sale Price per Unit (R$)" type="number" step="0.01" min="0" value={editForm.sale_price_per_unit} onChange={(e) => setEditForm({ ...editForm, sale_price_per_unit: e.target.value })} placeholder="Optional" />
              <Input label="Labor Minutes" type="number" min="0" value={editForm.labor_minutes} onChange={(e) => setEditForm({ ...editForm, labor_minutes: e.target.value })} />
              <Input label="Other Costs (R$)" type="number" step="0.01" min="0" value={editForm.other_costs} onChange={(e) => setEditForm({ ...editForm, other_costs: e.target.value })} />

              {selectedEditType && (
                <div>
                  <div className="text-sm font-medium text-gray-700 mb-2">Material Price Overrides (optional)</div>
                  <div className="space-y-2">
                    {selectedEditType.purse_materials.map((pm) => (
                      <div key={pm.material_id} className="flex items-center gap-2">
                        <span className="flex-1 text-sm text-gray-600">{pm.material.name} (padrão: R${pm.material.price_per_unit})</span>
                        <input
                          type="number" step="0.01" min="0" placeholder="Override R$"
                          className="w-28 border border-gray-300 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                          value={editOverrides[pm.material_id] ?? ''}
                          onChange={(e) => setEditOverrides({ ...editOverrides, [pm.material_id]: e.target.value })}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
                <textarea
                  className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
                  rows={2}
                  value={editForm.notes}
                  onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                />
              </div>

              <div className="flex gap-3 justify-end pt-2">
                <Button variant="secondary" type="button" onClick={() => setEditRecord(null)}>Cancel</Button>
                <Button type="submit">Preview Cost →</Button>
              </div>
            </form>
          ) : (
            <div className="space-y-4">
              <CostPreviewCard
                cost_per_unit={editPreview.cost_per_unit}
                total_cost={editPreview.total_cost}
                revenue={editPreview.revenue}
                profit={editPreview.profit}
              />
              {editError && <p className="text-red-500 text-sm">{editError}</p>}
              <div className="flex gap-3 pt-2">
                <Button variant="secondary" onClick={() => setEditStep('form')}>Back</Button>
                <Button onClick={handleEditSave} disabled={editSaving} className="flex-1">
                  {editSaving ? 'Saving…' : 'Save Changes'}
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete Record?">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete the record for <span className="font-semibold">{confirmDelete.purse_type.name}</span> on{' '}
              <span className="font-semibold">{new Date(confirmDelete.date_produced).toLocaleDateString('pt-BR')}</span>?
              This cannot be undone.
            </p>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setConfirmDelete(null)}>Cancel</Button>
              <Button onClick={handleDelete} disabled={deleting} className="bg-red-600 hover:bg-red-700 text-white">
                {deleting ? 'Deleting…' : 'Delete'}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
