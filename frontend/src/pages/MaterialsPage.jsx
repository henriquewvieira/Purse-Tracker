import { useState, useEffect } from 'react'
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials.js'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const EMPTY = { name: '', unit: '', price_per_unit: '', width_cm: '', height_cm: '', supplier: '', notes: '' }

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => getMaterials().then(setMaterials).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing({}); setForm(EMPTY); setError('') }
  const openEdit = (m) => {
    setEditing(m)
    setForm({
      name: m.name, unit: m.unit, price_per_unit: m.price_per_unit,
      width_cm: m.width_cm ?? '', height_cm: m.height_cm ?? '',
      supplier: m.supplier || '', notes: m.notes || '',
    })
    setError('')
  }
  const close = () => setEditing(null)

  const isArea = (unit) => unit.toLowerCase().includes('cm')

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const area = isArea(form.unit)
      const data = {
        ...form,
        price_per_unit: Number(form.price_per_unit),
        width_cm: area && form.width_cm !== '' ? Number(form.width_cm) : null,
        height_cm: area && form.height_cm !== '' ? Number(form.height_cm) : null,
      }
      if (editing?.id) {
        await updateMaterial(editing.id, data)
      } else {
        await createMaterial(data)
      }
      await load()
      close()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await deleteMaterial(confirmDelete.id)
      setMaterials((prev) => prev.filter((x) => x.id !== confirmDelete.id))
      setConfirmDelete(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="p-5 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Materials</h1>
        <Button onClick={openNew}>+ Add Material</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-500 text-left">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Unit</th>
                <th className="px-4 py-3 font-medium">Price/Unit</th>
                <th className="px-4 py-3 font-medium hidden md:table-cell">Supplier</th>
                <th className="px-4 py-3 font-medium w-24"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {materials.length === 0 && (
                <tr><td colSpan={5} className="text-center py-10 text-gray-400">No materials yet</td></tr>
              )}
              {materials.map((m) => (
                <tr key={m.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{m.name}</td>
                  <td className="px-4 py-3 text-gray-600">{m.unit}</td>
                  <td className="px-4 py-3">
                    {m.width_cm != null && m.height_cm != null
                      ? <>${Number(m.price_per_unit).toFixed(2)} <span className="text-gray-400 text-xs">({m.width_cm}×{m.height_cm} cm)</span></>
                      : `$${Number(m.price_per_unit).toFixed(2)}`}
                  </td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => setConfirmDelete(m)}>Del</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal isOpen={editing !== null} onClose={close} title={editing?.id ? 'Edit Material' : 'Add Material'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <Input label="Unit (e.g. cm², m², pcs) *" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          {isArea(form.unit) ? (
            <>
              <div className="flex gap-3">
                <Input label="Width (cm) *" type="number" step="any" min="0.01" value={form.width_cm} onChange={(e) => setForm({ ...form, width_cm: e.target.value })} required />
                <Input label="Height (cm) *" type="number" step="any" min="0.01" value={form.height_cm} onChange={(e) => setForm({ ...form, height_cm: e.target.value })} required />
              </div>
              {form.width_cm && form.height_cm && (
                <p className="text-xs text-gray-400">Piece area: {(Number(form.width_cm) * Number(form.height_cm)).toFixed(2)} cm²</p>
              )}
              <Input label="Price for this piece *" type="number" step="0.01" min="0" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} required />
              {form.price_per_unit && form.width_cm && form.height_cm && (
                <p className="text-xs text-gray-400">
                  = ${(Number(form.price_per_unit) / (Number(form.width_cm) * Number(form.height_cm))).toFixed(6)} / cm²
                </p>
              )}
            </>
          ) : (
            <Input label="Price per Unit *" type="number" step="0.01" min="0" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} required />
          )}
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete Material?">
        {confirmDelete && (
          <div className="space-y-4">
            <p className="text-gray-600 text-sm">
              Are you sure you want to delete <span className="font-semibold">"{confirmDelete.name}"</span>? This cannot be undone.
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
