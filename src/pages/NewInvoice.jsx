import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { listClients, addInvoice, nextInvoiceNumber } from '../lib/firestore.js'
import { useAuth } from '../context/AuthContext.jsx'
import { BUSINESS } from '../business.js'

function blankLine() {
  return { id: crypto.randomUUID(), description: '', qty: 1, rate: 0 }
}

export default function NewInvoice() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [clients, setClients] = useState([])
  const [clientId, setClientId] = useState('')
  const [docType, setDocType] = useState('quote') // quote | invoice
  const [number, setNumber] = useState('')
  const [dueDate, setDueDate] = useState('')
  const [notes, setNotes] = useState('')
  const [lines, setLines] = useState([blankLine()])
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    listClients().then(setClients)
    nextInvoiceNumber().then(setNumber)
  }, [])

  function updateLine(id, patch) {
    setLines((ls) => ls.map((l) => (l.id === id ? { ...l, ...patch } : l)))
  }

  function addLine(preset) {
    setLines((ls) => [...ls, { id: crypto.randomUUID(), description: preset?.description || '', qty: 1, rate: preset?.rate || 0 }])
  }

  function removeLine(id) {
    setLines((ls) => (ls.length > 1 ? ls.filter((l) => l.id !== id) : ls))
  }

  const total = lines.reduce((sum, l) => sum + (Number(l.qty) || 0) * (Number(l.rate) || 0), 0)

  async function handleSave(status) {
    if (!clientId) { alert('Select a client first.'); return }
    setSaving(true)
    const client = clients.find((c) => c.id === clientId)
    try {
      const ref = await addInvoice({
        type: docType,
        number,
        status,
        clientId,
        clientSnapshot: { name: client.name, phone: client.phone, email: client.email, address: client.address },
        dueDate: dueDate || null,
        notes,
        lines: lines.map(({ id, ...rest }) => rest),
        total,
        createdBy: user?.email || 'unknown',
      })
      navigate(`/invoices/${ref.id}`)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 26, marginBottom: 4 }}>New {docType === 'quote' ? 'quote' : 'invoice'}</h1>
      <p style={{ color: 'var(--text-dim)', marginTop: 0, marginBottom: 24 }}>
        {number ? `Reference ${number}` : 'Generating reference…'}
      </p>

      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 14 }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Document type</label>
            <select value={docType} onChange={(e) => setDocType(e.target.value)}>
              <option value="quote">Quote</option>
              <option value="invoice">Invoice</option>
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Client</label>
            <select value={clientId} onChange={(e) => setClientId(e.target.value)} required>
              <option value="">Select a client…</option>
              {clients.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Due date</label>
            <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </div>
        </div>
        {clients.length === 0 && (
          <p style={{ fontSize: 13, color: 'var(--text-dim)', marginTop: 12, marginBottom: 0 }}>
            No clients saved yet — add one on the Clients page first.
          </p>
        )}
      </div>

      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 16, margin: 0 }}>Line items</h2>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 18 }}>
          {BUSINESS.commonServices.map((s) => (
            <button key={s.description} type="button" className="btn btn-ghost" style={{ padding: '6px 12px', fontSize: 12.5 }} onClick={() => addLine(s)}>
              + {s.description}
            </button>
          ))}
        </div>

        <table>
          <thead>
            <tr><th style={{ width: '50%' }}>Description</th><th>Qty</th><th>Rate (R)</th><th>Amount</th><th></th></tr>
          </thead>
          <tbody>
            {lines.map((l) => (
              <tr key={l.id}>
                <td><input value={l.description} onChange={(e) => updateLine(l.id, { description: e.target.value })} placeholder="e.g. LCD replacement — iPhone 12" /></td>
                <td><input type="number" min="0" step="1" value={l.qty} onChange={(e) => updateLine(l.id, { qty: e.target.value })} /></td>
                <td><input type="number" min="0" step="0.01" value={l.rate} onChange={(e) => updateLine(l.id, { rate: e.target.value })} /></td>
                <td style={{ whiteSpace: 'nowrap' }}>R {((Number(l.qty) || 0) * (Number(l.rate) || 0)).toFixed(2)}</td>
                <td><button type="button" className="btn btn-danger" style={{ padding: '4px 10px' }} onClick={() => removeLine(l.id)}>×</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        <button type="button" className="btn btn-ghost" style={{ marginTop: 14 }} onClick={() => addLine()}>
          + Add line
        </button>

        <hr className="circuit-rule" style={{ margin: '20px 0' }} />
        <div style={{ textAlign: 'right', fontSize: 20, fontWeight: 700 }}>
          Total: R {total.toFixed(2)}
        </div>
      </div>

      <div className="panel" style={{ padding: 22, marginBottom: 20 }}>
        <div className="field" style={{ marginBottom: 0 }}>
          <label>Notes (optional)</label>
          <textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Warranty terms, turnaround time, etc." />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button className="btn btn-ghost" disabled={saving} onClick={() => handleSave('draft')}>Save as draft</button>
        <button className="btn btn-primary" disabled={saving} onClick={() => handleSave('sent')}>
          {saving ? 'Saving…' : `Save & mark as sent`}
        </button>
      </div>
    </div>
  )
}
