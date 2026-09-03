import {
  collection, addDoc, updateDoc, deleteDoc, doc,
  getDocs, getDoc, query, orderBy, serverTimestamp,
} from 'firebase/firestore'
import { db } from '../firebase.js'

// ---------- Clients ----------
export async function listClients() {
  const q = query(collection(db, 'clients'), orderBy('name'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function addClient(client) {
  return addDoc(collection(db, 'clients'), {
    ...client,
    createdAt: serverTimestamp(),
  })
}

export async function updateClient(id, client) {
  return updateDoc(doc(db, 'clients', id), client)
}

export async function deleteClient(id) {
  return deleteDoc(doc(db, 'clients', id))
}

// ---------- Invoices ----------
export async function listInvoices() {
  const q = query(collection(db, 'invoices'), orderBy('createdAt', 'desc'))
  const snap = await getDocs(q)
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }))
}

export async function getInvoice(id) {
  const snap = await getDoc(doc(db, 'invoices', id))
  return snap.exists() ? { id: snap.id, ...snap.data() } : null
}

export async function addInvoice(invoice) {
  return addDoc(collection(db, 'invoices'), {
    ...invoice,
    createdAt: serverTimestamp(),
  })
}

export async function updateInvoice(id, invoice) {
  return updateDoc(doc(db, 'invoices', id), invoice)
}

export async function deleteInvoice(id) {
  return deleteDoc(doc(db, 'invoices', id))
}

// Simple running invoice number: INV-2026-0001 style, based on count.
export async function nextInvoiceNumber() {
  const invoices = await listInvoices()
  const year = new Date().getFullYear()
  const countThisYear = invoices.filter((i) => (i.number || '').includes(String(year))).length
  return `INV-${year}-${String(countThisYear + 1).padStart(4, '0')}`
}
