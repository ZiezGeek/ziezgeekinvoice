import { useEffect, useRef, useState } from 'react'
import { useParams } from 'react-router-dom'
import { getInvoice, updateInvoice } from '../lib/firestore.js'
import Logo from '../components/Logo.jsx'
import logoFullUrl from '../assets/logo-full.png'
import { BUSINESS } from '../business.js'

function fmtDate(ts) {
  if (!ts) return '—'
  const d = ts.toDate ? ts.toDate() : new Date(ts)
  return d.toLocaleDateString('en-ZA', { year: 'numeric', month: 'short', day: 'numeric' })
}

// Theme colors as RGB triples, matching the app's dark navy theme.
const COLOR = {
  bg: [11, 24, 48],       // --navy-800
  bgDark: [7, 16, 33],    // --navy-900
  line: [50, 85, 115],
  text: [234, 243, 251],  // --text
  textDim: [144, 164, 189], // --text-dim
  accent: [63, 201, 255],  // --cyan
}

async function imageToDataUrl(url) {
  const res = await fetch(url)
  const blob = await res.blob()
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

export default function InvoiceView() {
  const { id } = useParams()
  const [invoice, setInvoice] = useState(null)
  const [working, setWorking] = useState(false)
  const panelRef = useRef(null)

  useEffect(() => { getInvoice(id).then(setInvoice) }, [id])

  async function setStatus(status) {
    await updateInvoice(id, { status })
    setInvoice((inv) => ({ ...inv, status }))
  }

  // Builds the PDF by drawing directly with code (text, lines, the logo
  // image) instead of taking a screenshot of the page. This guarantees
  // the layout, so nothing can get cut off or leave stray white space
  // regardless of the phone's screen size.
  async function buildPdf() {
    const { jsPDF } = await import('jspdf')

    const PAGE_W = 620
    const MARGIN = 40
    const CONTENT_W = PAGE_W - MARGIN * 2

    const lines = invoice.lines || []
    const hasBank = BUSINESS.bank.accountNumber || BUSINESS.bank.accountName

    // Work out the page height up front from the content, so there's no
    // leftover blank space at the bottom.
    let estimatedHeight = 170 // header + from/billed-to + table header
    estimatedHeight += lines.length * 24 + 40 // rows + total
    if (invoice.notes) estimatedHeight += 60
    estimatedHeight += 70 // banking details
    estimatedHeight += MARGIN * 2

    const pdf = new jsPDF({ unit: 'pt', format: [PAGE_W, estimatedHeight] })

    // Background
    pdf.setFillColor(...COLOR.bg)
    pdf.rect(0, 0, PAGE_W, estimatedHeight, 'F')

    let y = MARGIN

    // Logo (top-left), keeping its real aspect ratio.
    try {
      const logoData = await imageToDataUrl(logoFullUrl)
      const logoW = 130
      const logoH = logoW * (650 / 730)
      pdf.addImage(logoData, 'PNG', MARGIN, y, logoW, logoH)
    } catch {
      // If the logo can't be loaded, just skip it rather than fail the whole PDF.
    }

    // Title block (top-right)
    pdf.setTextColor(...COLOR.text)
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(20)
    const title = invoice.type === 'quote' ? 'Quote' : 'Invoice'
    pdf.text(title, PAGE_W - MARGIN, y + 18, { align: 'right' })
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(11)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text(invoice.number || '', PAGE_W - MARGIN, y + 36, { align: 'right' })
    pdf.text(fmtDate(invoice.createdAt), PAGE_W - MARGIN, y + 52, { align: 'right' })

    y += 100
    pdf.setDrawColor(...COLOR.line)
    pdf.setLineWidth(1)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 24

    // FROM / BILLED TO
    const colW = CONTENT_W / 2
    const fromX = MARGIN
    const billedX = MARGIN + colW

    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('FROM', fromX, y)
    pdf.text('BILLED TO', billedX, y)

    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.setTextColor(...COLOR.text)
    pdf.text(BUSINESS.name, fromX, y + 16)
    pdf.text(invoice.clientSnapshot?.name || '', billedX, y + 16)

    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text(BUSINESS.address, fromX, y + 30, { maxWidth: colW - 16 })
    pdf.text(`${BUSINESS.phone} · ${BUSINESS.email}`, fromX, y + 43, { maxWidth: colW - 16 })

    pdf.text(invoice.clientSnapshot?.address || '', billedX, y + 30, { maxWidth: colW - 16 })
    pdf.text(
      [invoice.clientSnapshot?.phone, invoice.clientSnapshot?.email].filter(Boolean).join(' · '),
      billedX, y + 43, { maxWidth: colW - 16 }
    )

    y += 70

    // Table header
    const col = {
      desc: MARGIN,
      qty: MARGIN + CONTENT_W * 0.55,
      rate: MARGIN + CONTENT_W * 0.7,
      amount: PAGE_W - MARGIN,
    }
    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('DESCRIPTION', col.desc, y)
    pdf.text('QTY', col.qty, y)
    pdf.text('RATE', col.rate, y)
    pdf.text('AMOUNT', col.amount, y, { align: 'right' })
    y += 8
    pdf.setDrawColor(...COLOR.line)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 18

    // Table rows
    pdf.setFontSize(11)
    pdf.setTextColor(...COLOR.text)
    lines.forEach((l) => {
      const amount = (Number(l.qty) || 0) * (Number(l.rate) || 0)
      pdf.text(String(l.description || ''), col.desc, y, { maxWidth: col.qty - col.desc - 10 })
      pdf.text(String(l.qty), col.qty, y)
      pdf.text(`R ${Number(l.rate).toFixed(2)}`, col.rate, y)
      pdf.text(`R ${amount.toFixed(2)}`, col.amount, y, { align: 'right' })
      y += 24
    })

    y += 6
    pdf.setDrawColor(...COLOR.line)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 22

    // Total
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(15)
    pdf.setTextColor(...COLOR.text)
    pdf.text(`Total: R ${Number(invoice.total).toFixed(2)}`, PAGE_W - MARGIN, y, { align: 'right' })
    y += 24

    // Notes
    if (invoice.notes) {
      pdf.setDrawColor(...COLOR.line)
      pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
      y += 18
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(...COLOR.textDim)
      pdf.text('NOTES', MARGIN, y)
      y += 14
      pdf.setFontSize(11)
      pdf.setTextColor(...COLOR.text)
      pdf.text(invoice.notes, MARGIN, y, { maxWidth: CONTENT_W })
      y += 24
    }

    // Banking details
    pdf.setDrawColor(...COLOR.line)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 18
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('BANKING DETAILS', MARGIN, y)
    y += 14
    pdf.setFontSize(10.5)
    pdf.setTextColor(...COLOR.text)
    if (hasBank) {
      const parts = [
        BUSINESS.bank.accountName,
        BUSINESS.bank.bankName,
        BUSINESS.bank.accountNumber ? `Acc ${BUSINESS.bank.accountNumber}` : null,
        BUSINESS.bank.branchCode ? `Branch ${BUSINESS.bank.branchCode}` : null,
      ].filter(Boolean)
      pdf.text(parts.join(' · '), MARGIN, y, { maxWidth: CONTENT_W })
    } else {
      pdf.setTextColor(...COLOR.textDim)
      pdf.text('Add your banking details in src/business.js once ready.', MARGIN, y, { maxWidth: CONTENT_W })
    }

    return pdf.output('blob')
  }

  function fileName() {
    return `${invoice.type === 'quote' ? 'Quote' : 'Invoice'}-${invoice.number}.pdf`
  }

  async function handleDownload() {
    setWorking(true)
    try {
      const blob = await buildPdf()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName()
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } finally {
      setWorking(false)
    }
  }

  async function handleShare() {
    setWorking(true)
    try {
      const blob = await buildPdf()
      const file = new File([blob], fileName(), { type: 'application/pdf' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: fileName(),
          text: `${invoice.type === 'quote' ? 'Quote' : 'Invoice'} ${invoice.number} from ${BUSINESS.name}`,
        })
      } else {
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = fileName()
        document.body.appendChild(a)
        a.click()
        a.remove()
        URL.revokeObjectURL(url)
      }
    } finally {
      setWorking(false)
    }
  }

  if (!invoice) return <p style={{ color: 'var(--text-dim)' }}>Loading…</p>

  const hasBank = BUSINESS.bank.accountNumber || BUSINESS.bank.accountName

  return (
    <div>
      <div className="no-print" style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
        <button className="btn btn-primary" onClick={handleShare} disabled={working}>
          {working ? 'Preparing…' : 'Share (WhatsApp etc.)'}
        </button>
        <button className="btn btn-ghost" onClick={handleDownload} disabled={working}>
          {working ? 'Preparing…' : 'Download PDF'}
        </button>
        {invoice.status !== 'paid' && (
          <button className="btn btn-ghost" onClick={() => setStatus('paid')}>Mark as paid</button>
        )}
        {invoice.status === 'draft' && (
          <button className="btn btn-ghost" onClick={() => setStatus('sent')}>Mark as sent</button>
        )}
      </div>

      <div ref={panelRef} className="panel invoice-print" style={{ padding: 40, maxWidth: 820, margin: '0 auto' }}>
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
