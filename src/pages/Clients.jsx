import { useEffect, useState } from 'react'
import { listClients, addClient, updateClient, deleteClient } from '../lib/firestore.js'

const empty = { name: '', phone: '', email: '', address: '' }

export default function Clients() {
  const [clients, setClients] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(empty)
  const [editingId, setEditingId] = useState(null)

  async function refresh() {
    setLoading(true)
    setClients(await listClients())
    setLoading(false)
  }

  useEffect(() => { refresh() }, [])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.name.trim()) return
    if (editingId) {
      await updateClient(editingId, form)
    } else {
      await addClient(form)
    }
    setForm(empty)
    setEditingId(null)
    refresh()
  }

  function startEdit(c) {
    setEditingId(c.id)
    setForm({ name: c.name || '', phone: c.phone || '', email: c.email || '', address: c.address || '' })
  }

  async function handleDelete(id) {
    if (!confirm('Remove this client?')) return
    await deleteClient(id)
    refresh()
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>Clients</h1>
      <p style={{ color: 'var(--text-dim)', marginTop: 0, marginBottom: 24 }}>
        Saved clients you quote and invoice regularly.
      </p>

      <div className="panel" style={{ padding: 20, marginBottom: 28 }}>
        <form onSubmit={handleSubmit} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Name</label>
            <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Phone</label>
            <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Email</label>
            <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Address</label>
            <input value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div style={{ gridColumn: '1 / -1', display: 'flex', gap: 10 }}>
            <button className="btn btn-primary" type="submit">
              {editingId ? 'Save changes' : 'Add client'}
            </button>
            {editingId && (
              <button
                type="button"
                className="btn btn-ghost"
                onClick={() => { setEditingId(null); setForm(empty) }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </div>

      <div className="panel" style={{ padding: 4 }}>
        {loading ? (
          <p style={{ padding: 20, color: 'var(--text-dim)' }}>Loading…</p>
        ) : clients.length === 0 ? (
          <p style={{ padding: 20, color: 'var(--text-dim)' }}>No clients yet — add your first one above.</p>
        ) : (
          <table>
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th></th></tr>
            </thead>
            <tbody>
              {clients.map((c) => (
                <tr key={c.id}>
                  <td>{c.name}</td>
                  <td>{c.phone}</td>
                  <td>{c.email}</td>
                  <td style={{ textAlign: 'right' }}>
                    <button className="btn btn-ghost" style={{ padding: '6px 12px', marginRight: 6 }} onClick={() => startEdit(c)}>Edit</button>
                    <button className="btn btn-danger" style={{ padding: '6px 12px' }} onClick={() => handleDelete(c.id)}>Remove</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
