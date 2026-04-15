import { useState, useEffect } from 'react'
import { getSettings, updateSettings } from '../api/settings.js'
import Button from '../components/ui/Button.jsx'
import Input from '../components/ui/Input.jsx'
import Spinner from '../components/ui/Spinner.jsx'

export default function SettingsPage() {
  const [form, setForm] = useState({ hourly_rate: '', new_password: '', confirm_password: '' })
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    getSettings()
      .then((s) => setForm((f) => ({ ...f, hourly_rate: s.hourly_rate })))
      .finally(() => setLoading(false))
  }, [])

  const handleSave = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (form.new_password && form.new_password !== form.confirm_password) {
      setError('Passwords do not match.')
      return
    }
    if (Number(form.hourly_rate) <= 0) {
      setError('Hourly rate must be a positive number.')
      return
    }

    setSaving(true)
    try {
      const payload = { hourly_rate: Number(form.hourly_rate) }
      if (form.new_password) payload.new_password = form.new_password
      await updateSettings(payload)
      setForm((f) => ({ ...f, new_password: '', confirm_password: '' }))
      setSuccess('Settings saved!')
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="flex justify-center py-20"><Spinner size="lg" /></div>

  return (
    <div className="p-5 max-w-md mx-auto">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Settings</h1>
      <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm p-6 space-y-5">
        <Input
          label="Hourly Labor Rate ($)"
          type="number"
          step="0.01"
          min="0.01"
          value={form.hourly_rate}
          onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
          required
        />
        <hr className="border-gray-100" />
        <p className="text-sm text-gray-500 font-medium">Change Password (leave blank to keep current)</p>
        <Input
          label="New Password"
          type="password"
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          placeholder="New password"
        />
        <Input
          label="Confirm New Password"
          type="password"
          value={form.confirm_password}
          onChange={(e) => setForm({ ...form, confirm_password: e.target.value })}
          placeholder="Confirm password"
        />

        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}

        <Button type="submit" size="lg" className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </form>
    </div>
  )
}
