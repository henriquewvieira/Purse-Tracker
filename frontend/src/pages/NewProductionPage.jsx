import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getPurseTypes } from '../api/purseTypes.js'
import { getSettings } from '../api/settings.js'
import { createProductionRecord } from '../api/productionRecords.js'
import { computeCosts } from '../lib/computeCosts.js'
import CostPreviewCard from '../components/ui/CostPreviewCard.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'

function today() {
  return new Date().toISOString().split('T')[0]
}

export default function NewProductionPage() {
  const navigate = useNavigate()
  const [step, setStep] = useState(1)
  const [purseTypes, setPurseTypes] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  const [selectedType, setSelectedType] = useState(null)
  const [form, setForm] = useState({
    date_produced: today(),
    quantity: 1,
    sale_price_per_unit: '',
    labor_minutes: 0,
    other_costs: 0,
    notes: '',
  })
  const [overrides, setOverrides] = useState({})
  const [preview, setPreview] = useState(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    Promise.all([getPurseTypes(), getSettings()])
      .then(([types, s]) => { setPurseTypes(types); setSettings(s) })
      .finally(() => setLoading(false))
  }, [])

  const buildMaterialsMap = () => {
    const map = {}
    for (const pm of selectedType.purse_materials) {
      map[pm.material_id] = pm.material
    }
    return map
  }

  const calcPreview = () => {
    if (!selectedType || !settings) return null
    const materialsMap = buildMaterialsMap()
    const numericOverrides = {}
    for (const [id, val] of Object.entries(overrides)) {
      if (val !== '' && val != null) numericOverrides[id] = Number(val)
    }
    return computeCosts(
      selectedType,
      materialsMap,
      {
        quantity: Number(form.quantity) || 1,
        labor_minutes: Number(form.labor_minutes) || 0,
        other_costs: Number(form.other_costs) || 0,
        sale_price_per_unit: form.sale_price_per_unit !== '' ? Number(form.sale_price_per_unit) : null,
        material_overrides: numericOverrides,
      },
      settings
    )
  }

  const handleSelectType = (t) => {
    setSelectedType(t)
    setOverrides({})
    // Pre-fill labor_minutes from purse type if available (no field on model; left as 0)
    setStep(2)
  }

  const handleNext = (e) => {
    e.preventDefault()
    const p = calcPreview()
    setPreview(p)
    setStep(3)
  }

  const handleSave = async () => {
    setSaving(true)
    setError('')
    const numericOverrides = {}
    for (const [id, val] of Object.entries(overrides)) {
      if (val !== '' && val != null) numericOverrides[id] = Number(val)
    }
    try {
      await createProductionRecord({
        purse_type_id: selectedType.id,
        date_produced: form.date_produced,
        quantity: Number(form.quantity),
        sale_price_per_unit: form.sale_price_per_unit !== '' ? Number(form.sale_price_per_unit) : null,
        labor_minutes: Number(form.labor_minutes) || 0,
        other_costs: Number(form.other_costs) || 0,
        material_overrides: numericOverrides,
        notes: form.notes,
      })
      navigate('/')
    } catch (err) {
      setError(err.message)
      setSaving(false)
    }
  }

  if (loading) {
    return <div className="flex justify-center py-20"><Spinner size="lg" /></div>
  }

  return (
    <div className="p-5 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-2">New Production Record</h1>

      {/* Step indicator */}
      <div className="flex gap-2 mb-6">
        {['Pick Type', 'Details', 'Preview'].map((label, i) => (
          <div key={i} className={`flex-1 text-center text-sm py-1 rounded-full font-medium ${step === i + 1 ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-400'}`}>
            {label}
          </div>
        ))}
      </div>

      {/* Step 1: Pick purse type */}
      {step === 1 && (
        <div className="space-y-3">
          {purseTypes.length === 0 && (
            <p className="text-gray-400 text-center py-10">No purse types. Add one first.</p>
          )}
          {purseTypes.map((t) => (
            <button
              key={t.id}
              onClick={() => handleSelectType(t)}
              className="w-full text-left bg-white border-2 border-gray-200 hover:border-indigo-400 rounded-2xl p-4 transition-colors"
            >
              <div className="font-semibold text-gray-800">{t.name}</div>
              {t.description && <div className="text-sm text-gray-500 mt-0.5">{t.description}</div>}
              <div className="text-xs text-gray-400 mt-1">
                {t.purse_materials.map((pm) => `${pm.material.name} ×${pm.quantity}`).join(', ')}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Step 2: Details */}
      {step === 2 && selectedType && (
        <form onSubmit={handleNext} className="space-y-4">
          <div className="text-sm font-semibold text-indigo-600 mb-1">Type: {selectedType.name}</div>
          <Input label="Date Produced *" type="date" value={form.date_produced} onChange={(e) => setForm({ ...form, date_produced: e.target.value })} required />
          <Input label="Quantity *" type="number" min="1" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} required />
          <Input label="Sale Price per Unit ($)" type="number" step="0.01" min="0" value={form.sale_price_per_unit} onChange={(e) => setForm({ ...form, sale_price_per_unit: e.target.value })} placeholder="Optional" />
          <Input label="Labor Minutes" type="number" min="0" value={form.labor_minutes} onChange={(e) => setForm({ ...form, labor_minutes: e.target.value })} />
          <Input label="Other Costs ($)" type="number" step="0.01" min="0" value={form.other_costs} onChange={(e) => setForm({ ...form, other_costs: e.target.value })} />

          {/* Material price overrides */}
          <div>
            <div className="text-sm font-medium text-gray-700 mb-2">Material Price Overrides (optional)</div>
            <div className="space-y-2">
              {selectedType.purse_materials.map((pm) => (
                <div key={pm.material_id} className="flex items-center gap-2">
                  <span className="flex-1 text-sm text-gray-600">{pm.material.name} (default: ${pm.material.price_per_unit})</span>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="Override $"
                    className="w-28 border border-gray-300 rounded-xl px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
                    value={overrides[pm.material_id] ?? ''}
                    onChange={(e) => setOverrides({ ...overrides, [pm.material_id]: e.target.value })}
                  />
                </div>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Notes</label>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              rows={2}
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="flex gap-3 pt-2">
            <Button variant="secondary" type="button" onClick={() => setStep(1)}>Back</Button>
            <Button type="submit" className="flex-1">Preview Cost →</Button>
          </div>
        </form>
      )}

      {/* Step 3: Preview + Confirm */}
      {step === 3 && preview && (
        <div className="space-y-4">
          <CostPreviewCard
            cost_per_unit={preview.cost_per_unit}
            total_cost={preview.total_cost}
            revenue={preview.revenue}
            profit={preview.profit}
          />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 pt-2">
            <Button variant="secondary" onClick={() => setStep(2)}>Back</Button>
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              {saving ? 'Saving…' : 'Save Record'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
