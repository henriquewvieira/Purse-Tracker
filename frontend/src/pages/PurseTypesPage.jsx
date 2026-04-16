import { useState, useEffect } from 'react'
import { getPurseTypes, createPurseType, updatePurseType, deletePurseType } from '../api/purseTypes.js'
import { getMaterials } from '../api/materials.js'
import Modal from '../components/ui/Modal.jsx'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'

function MaterialRow({ row, index, materials, onChange, onRemove }) {
  return (
    <div className="flex gap-2 items-end">
      <div className="flex-1">
        {index === 0 && <label className="text-xs text-gray-500 block mb-1">Material</label>}
        <select
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={row.material_id}
          onChange={(e) => onChange(index, 'material_id', e.target.value)}
          required
        >
          <option value="">Select material…</option>
          {materials.map((m) => (
            <option key={m.id} value={m.id}>{m.name} ({m.unit})</option>
          ))}
        </select>
      </div>
      <div className="w-24">
        {index === 0 && <label className="text-xs text-gray-500 block mb-1">Qty</label>}
        <input
          type="number"
          step="any"
          min="0.001"
          className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          value={row.quantity}
          onChange={(e) => onChange(index, 'quantity', e.target.value)}
          required
        />
      </div>
      <Button variant="ghost" size="sm" type="button" onClick={() => onRemove(index)} className="text-red-400 mb-0.5">×</Button>
    </div>
  )
}

const EMPTY_FORM = { name: '', description: '', image_url: '' }

export default function PurseTypesPage() {
  const [types, setTypes] = useState([])
  const [materials, setMaterials] = useState([])
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_FORM)
  const [rows, setRows] = useState([{ material_id: '', quantity: '' }])
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () =>
    Promise.all([getPurseTypes(), getMaterials()])
      .then(([t, m]) => { setTypes(t); setMaterials(m) })
      .finally(() => setLoading(false))

  useEffect(() => { load() }, [])

  const openNew = () => {
    setEditing({})
    setForm(EMPTY_FORM)
    setRows([{ material_id: '', quantity: '' }])
    setError('')
  }
  const openEdit = (t) => {
    setEditing(t)
    setForm({ name: t.name, description: t.description || '', image_url: t.image_url || '' })
    setRows(
      t.purse_materials.length
        ? t.purse_materials.map((pm) => ({ material_id: pm.material_id, quantity: pm.quantity }))
        : [{ material_id: '', quantity: '' }]
    )
    setError('')
  }
  const close = () => setEditing(null)

  const changeRow = (i, field, val) => {
    setRows((prev) => prev.map((r, idx) => idx === i ? { ...r, [field]: val } : r))
  }
  const addRow = () => setRows((prev) => [...prev, { material_id: '', quantity: '' }])
  const removeRow = (i) => setRows((prev) => prev.filter((_, idx) => idx !== i))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        ...form,
        purse_materials: rows.filter((r) => r.material_id).map((r) => ({
          material_id: Number(r.material_id),
          quantity: Number(r.quantity),
        })),
      }
      if (editing?.id) {
        await updatePurseType(editing.id, payload)
      } else {
        await createPurseType(payload)
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
      await deletePurseType(confirmDelete.id)
      setTypes((prev) => prev.filter((x) => x.id !== confirmDelete.id))
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
        <h1 className="text-2xl font-bold text-gray-800">Purse Types</h1>
        <Button onClick={openNew}>+ Add Purse Type</Button>
      </div>

      {loading ? (
        <div className="flex justify-center py-16"><Spinner size="lg" /></div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {types.length === 0 && (
            <p className="text-gray-400 py-10 text-center col-span-2">No purse types yet</p>
          )}
          {types.map((t) => (
            <div key={t.id} className="bg-white rounded-2xl shadow-sm p-5">
              <div className="flex justify-between items-start mb-2">
                <h2 className="text-lg font-bold text-gray-800">{t.name}</h2>
                <div className="flex gap-2">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(t)}>Edit</Button>
                  <Button variant="ghost" size="sm" className="text-red-500" onClick={() => setConfirmDelete(t)}>Del</Button>
                </div>
              </div>
              {t.description && <p className="text-sm text-gray-500 mb-3">{t.description}</p>}
              <div className="space-y-1">
                {t.purse_materials.map((pm) => (
                  <div key={pm.id} className="text-sm flex justify-between">
                    <span className="text-gray-700">{pm.material.name}</span>
                    <span className="text-gray-400">{pm.quantity} {pm.material.unit}</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={editing !== null} onClose={close} title={editing?.id ? 'Edit Purse Type' : 'Add Purse Type'}>
        <form onSubmit={handleSave} className="space-y-4">
          <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none"
              rows={2}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </div>
          <Input label="Image URL (optional)" value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Materials Used</label>
              <Button type="button" variant="ghost" size="sm" onClick={addRow}>+ Add Row</Button>
            </div>
            <div className="space-y-2">
              {rows.map((row, i) => (
                <MaterialRow key={i} row={row} index={i} materials={materials} onChange={changeRow} onRemove={removeRow} />
              ))}
            </div>
          </div>

          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div className="flex gap-3 justify-end pt-2">
            <Button variant="secondary" type="button" onClick={close}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save'}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={confirmDelete !== null} onClose={() => setConfirmDelete(null)} title="Delete Purse Type?">
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
