import { useState, useEffect } from 'react'
import { getMaterials, createMaterial, updateMaterial, deleteMaterial } from '../api/materials.js'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'

const EMPTY = { name: '', unit: '', price_per_unit: '', supplier: '', notes: '' }

export default function MaterialsPage() {
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null) // null = closed, {} = new, {id,...} = edit
  const [form, setForm] = useState(EMPTY)
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const load = () => getMaterials().then(setMaterials).finally(() => setLoading(false))
  useEffect(() => { load() }, [])

  const openNew = () => { setEditing({}); setForm(EMPTY); setError('') }
  const openEdit = (m) => { setEditing(m); setForm({ name: m.name, unit: m.unit, price_per_unit: m.price_per_unit, supplier: m.supplier || '', notes: m.notes || '' }); setError('') }
  const close = () => setEditing(null)

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const data = { ...form, price_per_unit: Number(form.price_per_unit) }
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

  const handleDelete = async (m) => {
    if (!window.confirm(`Delete "${m.name}"?`)) return
    try {
      await deleteMaterial(m.id)
      setMaterials((prev) => prev.filter((x) => x.id !== m.id))
    } catch (err) {
      alert(err.message)
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
                  <td className="px-4 py-3">${Number(m.price_per_unit).toFixed(2)}</td>
                  <td className="px-4 py-3 text-gray-500 hidden md:table-cell">{m.supplier || '—'}</td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2 justify-end">
                      <Button variant="ghost" size="sm" onClick={() => openEdit(m)}>Edit</Button>
                      <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700" onClick={() => handleDelete(m)}>Del</Button>
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
          <Input label="Unit (e.g. m², pcs) *" value={form.unit} onChange={(e) => setForm({ ...form, unit: e.target.value })} required />
          <Input label="Price per Unit *" type="number" step="0.01" min="0" value={form.price_per_unit} onChange={(e) => setForm({ ...form, price_per_unit: e.target.value })} required />
          <Input label="Supplier" value={form.supplier} onChange={(e) => setForm({ ...form, supplier: e.target.value })} />
          <Input label="Notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
