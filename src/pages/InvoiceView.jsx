import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getInvoice, updateInvoice } from '../lib/firestore.js'
import Logo from '../components/Logo.jsx'
import { BUSINESS } from '../business.js'

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

export default function InvoiceView() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)

  useEffect(() => { getInvoice(id).then(setInvoice) }, [id])

  async function setStatus(status) {
    await updateInvoice(id, { status })
    setInvoice((inv) => ({ ...inv, status }))
  }

  if (!invoice) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>

  const hasBank = BUSINESS.bank.accountNumber || BUSINESS.bank.accountName

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20 }}>
        <button className="btn btn-primary" onClick={() => window.print()}>Print / save as PDF</button>
        {invoice.status !== 'paid' && (
          <button className="btn btn-ghost" onClick={() => setStatus('paid')}>Mark as paid</button>
        )}
        {invoice.status === 'draft' && (
          <button className="btn btn-ghost" onClick={() => setStatus('sent')}>Mark as sent</button>
        )}
      </div>

      <div className="panel invoice-print" style={{ padding: 40, maxWidth: 820, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 6 }}>
          <Logo variant="full" height={90} />
          <div style={{ textAlign: 'right' }}>
            <h2 style={{ margin: 0, fontFamily: 'var(--font-display)', textTransform: 'capitalize' }}>{invoice.type}</h2>
            <p style={{ margin: '4px 0 0', color: 'var(--text-dim)' }}>{invoice.number}</p>
            <p style={{ margin: '4px 0 0', color: 'var(--text-dim)' }}>{fmtDate(invoice.createdAt)}</p>
          </div>
        </div>

        <hr className="circuit-rule" style={{ margin: '20px 0' }} />

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginBottom: 24 }}>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', margin: '0 0 6px' }}>From</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{BUSINESS.name}</p>
            <p style={{ margin: '2px 0', color: 'var(--text-dim)', fontSize: 13.5 }}>{BUSINESS.address}</p>
            <p style={{ margin: '2px 0', color: 'var(--text-dim)', fontSize: 13.5 }}>{BUSINESS.phone} · {BUSINESS.email}</p>
          </div>
          <div>
            <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', margin: '0 0 6px' }}>Billed to</p>
            <p style={{ margin: 0, fontWeight: 600 }}>{invoice.clientSnapshot?.name}</p>
            <p style={{ margin: '2px 0', color: 'var(--text-dim)', fontSize: 13.5 }}>{invoice.clientSnapshot?.address}</p>
            <p style={{ margin: '2px 0', color: 'var(--text-dim)', fontSize: 13.5 }}>{invoice.clientSnapshot?.phone} · {invoice.clientSnapshot?.email}</p>
          </div>
        </div>

        <table>
          <thead>
            <tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {invoice.lines?.map((l, i) => (
              <tr key={i}>
                <td>{l.description}</td>
                <td>{l.qty}</td>
                <td>R {Number(l.rate).toFixed(2)}</td>
                <td>R {(Number(l.qty) * Number(l.rate)).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ textAlign: 'right', marginTop: 16, fontSize: 20, fontWeight: 700 }}>
          Total: R {Number(invoice.total).toFixed(2)}
        </div>

        {invoice.notes && (
          <>
            <hr className="circuit-rule" style={{ margin: '20px 0' }} />
            <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', margin: '0 0 6px' }}>Notes</p>
            <p style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{invoice.notes}</p>
          </>
        )}

        <hr className="circuit-rule" style={{ margin: '20px 0' }} />
        <p style={{ color: 'var(--text-dim)', fontSize: 12, textTransform: 'uppercase', margin: '0 0 6px' }}>
          Banking details
        </p>
        {hasBank ? (
          <p style={{ margin: 0, fontSize: 13.5 }}>
            {BUSINESS.bank.accountName} · {BUSINESS.bank.bankName} · Acc {BUSINESS.bank.accountNumber} · Branch {BUSINESS.bank.branchCode}
          </p>
        ) : (
          <p style={{ margin: 0, fontSize: 13.5, color: 'var(--text-dim)' }}>
            Add your banking details in src/business.js once ready — they'll appear here automatically.
          </p>
        )}
      </div>
    </div>
  )
}
