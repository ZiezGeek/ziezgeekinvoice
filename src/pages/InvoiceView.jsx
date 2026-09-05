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
  green: [126, 228, 74],   // --green
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
  // image) instead of taking a screenshot of the page. Uses a standard A4
  // page (the one size every PDF viewer handles correctly) filled edge to
  // edge with the dark navy background, with content anchored top-left —
  // this avoids any viewer quirks with unusual custom page shapes.
  async function buildPdf() {
    const { jsPDF } = await import('jspdf')

    const pdf = new jsPDF({ unit: 'pt', format: 'a4' })
    const PAGE_W = pdf.internal.pageSize.getWidth()
    const PAGE_H = pdf.internal.pageSize.getHeight()
    const MARGIN = 42
    const CONTENT_W = PAGE_W - MARGIN * 2

    const lines = invoice.lines || []
    const hasBank = BUSINESS.bank.accountNumber || BUSINESS.bank.accountName

    // Background covers the full standard page, so any unused space below
    // the content stays dark navy instead of showing blank white.
    pdf.setFillColor(...COLOR.bg)
    pdf.rect(0, 0, PAGE_W, PAGE_H, 'F')

    // A two-color line mimicking the app's cyan-to-green accent divider.
    function accentDivider(y) {
      const mid = MARGIN + CONTENT_W / 2
      pdf.setLineWidth(1.4)
      pdf.setDrawColor(...COLOR.accent)
      pdf.line(MARGIN, y, mid, y)
      pdf.setDrawColor(...COLOR.green)
      pdf.line(mid, y, PAGE_W - MARGIN, y)
    }

    let y = MARGIN

    // Logo (top-left), keeping its real aspect ratio.
    let logoH = 0
    try {
      const logoData = await imageToDataUrl(logoFullUrl)
      const logoW = 118
      logoH = logoW * (650 / 730)
      pdf.addImage(logoData, 'PNG', MARGIN, y, logoW, logoH)
    } catch {
      // If the logo can't be loaded, just skip it rather than fail the whole PDF.
    }

    y += logoH + 22
    accentDivider(y)
    y += 26

    // Header row: title + client (left) · quote meta (middle) · banking details (right)
    const headerTop = y
    const leftX = MARGIN
    const midX = MARGIN + CONTENT_W * 0.4
    const rightX = PAGE_W - MARGIN

    // Left: document title + who it's for
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(22)
    pdf.setTextColor(...COLOR.accent)
    pdf.text(invoice.type === 'quote' ? 'QUOTE' : 'INVOICE', leftX, y)
    y += 22
    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('BILLED TO', leftX, y)
    y += 14
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(12)
    pdf.setTextColor(...COLOR.text)
    pdf.text(invoice.clientSnapshot?.name || '', leftX, y)
    y += 15
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9.5)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text(invoice.clientSnapshot?.address || '', leftX, y, { maxWidth: midX - leftX - 16 })
    y += 13
    pdf.text(
      [invoice.clientSnapshot?.phone, invoice.clientSnapshot?.email].filter(Boolean).join(' · '),
      leftX, y, { maxWidth: midX - leftX - 16 }
    )
    const leftBottom = y

    // Middle: quote/invoice meta fields
    y = headerTop
    function metaField(label, value) {
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(9)
      pdf.setTextColor(...COLOR.textDim)
      pdf.text(label, midX, y)
      y += 13
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(11)
      pdf.setTextColor(...COLOR.text)
      pdf.text(value || '—', midX, y)
      y += 20
    }
    metaField(invoice.type === 'quote' ? 'QUOTE NUMBER' : 'INVOICE NUMBER', invoice.number)
    metaField('DATE', fmtDate(invoice.createdAt))
    if (invoice.dueDate) metaField('DUE DATE', invoice.dueDate)
    const midBottom = y

    // Right: banking details, prominent and up top
    y = headerTop
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('BANKING DETAILS', rightX, y, { align: 'right' })
    y += 15
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(10)
    pdf.setTextColor(...COLOR.text)
    if (hasBank) {
      const bankLines = [
        BUSINESS.bank.accountName,
        BUSINESS.bank.bankName,
        BUSINESS.bank.accountNumber ? `Acc ${BUSINESS.bank.accountNumber}` : null,
        BUSINESS.bank.branchCode ? `Branch ${BUSINESS.bank.branchCode}` : null,
      ].filter(Boolean)
      bankLines.forEach((line) => { pdf.text(line, rightX, y, { align: 'right' }); y += 14 })
    } else {
      pdf.setTextColor(...COLOR.textDim)
      pdf.text('Add banking details in', rightX, y, { align: 'right' })
      y += 13
      pdf.text('src/business.js', rightX, y, { align: 'right' })
      y += 13
    }
    const rightBottom = y

    y = Math.max(leftBottom, midBottom, rightBottom) + 20
    accentDivider(y)
    y += 26

    // Table header
    const col = {
      desc: MARGIN,
      qty: MARGIN + CONTENT_W * 0.55,
      rate: MARGIN + CONTENT_W * 0.7,
      amount: PAGE_W - MARGIN,
    }
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(9)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text('DESCRIPTION', col.desc, y)
    pdf.text('QTY', col.qty, y)
    pdf.text('RATE', col.rate, y)
    pdf.text('AMOUNT', col.amount, y, { align: 'right' })
    y += 8
    pdf.setDrawColor(...COLOR.line)
    pdf.setLineWidth(1)
    pdf.line(MARGIN, y, PAGE_W - MARGIN, y)
    y += 20

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
      pdf.setDrawColor(30, 50, 75)
      pdf.setLineWidth(0.5)
      pdf.line(MARGIN, y - 8, PAGE_W - MARGIN, y - 8)
    })

    y += 14

    // Total
    pdf.setFont('helvetica', 'bold')
    pdf.setFontSize(16)
    pdf.setTextColor(...COLOR.text)
    pdf.text(`Total: R ${Number(invoice.total).toFixed(2)}`, PAGE_W - MARGIN, y, { align: 'right' })
    y += 30

    // Notes, styled like a "Terms" section
    if (invoice.notes) {
      accentDivider(y)
      y += 20
      pdf.setFont('helvetica', 'bold')
      pdf.setFontSize(10)
      pdf.setTextColor(...COLOR.textDim)
      pdf.text('NOTES', MARGIN, y)
      y += 16
      pdf.setFont('helvetica', 'normal')
      pdf.setFontSize(10.5)
      pdf.setTextColor(...COLOR.text)
      pdf.text(invoice.notes, MARGIN, y, { maxWidth: CONTENT_W })
      y += 24
    }

    // Footer, anchored to the bottom of the page like a company registration line
    pdf.setFont('helvetica', 'normal')
    pdf.setFontSize(8.5)
    pdf.setTextColor(...COLOR.textDim)
    pdf.text(
      `${BUSINESS.name} · ${BUSINESS.address} · ${BUSINESS.phone} · ${BUSINESS.email}`,
      PAGE_W / 2, PAGE_H - 28, { align: 'center', maxWidth: CONTENT_W }
    )

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
