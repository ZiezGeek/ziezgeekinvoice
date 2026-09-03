import { NavLink } from 'react-router-dom'
import Logo from './Logo.jsx'
import { useAuth } from '../context/AuthContext.jsx'

const links = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/invoices', label: 'Invoices' },
  { to: '/invoices/new', label: 'New invoice' },
  { to: '/clients', label: 'Clients' },
]

export default function Sidebar() {
  const { user, logout } = useAuth()

  return (
    <aside
      className="no-print"
      style={{
        borderRight: '1px solid var(--line)',
        background: 'var(--navy-900)',
        padding: '24px 18px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ marginBottom: 28 }}>
        <Logo variant="full" height={72} />
      </div>

      <nav style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: 1 }}>
        {links.map((l) => (
          <NavLink
            key={l.to}
            to={l.to}
            end={l.end}
            style={({ isActive }) => ({
              padding: '10px 12px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              color: isActive ? '#04121f' : 'var(--text)',
              background: isActive
                ? 'linear-gradient(100deg, var(--cyan), var(--green))'
                : 'transparent',
              textDecoration: 'none',
            })}
          >
            {l.label}
          </NavLink>
        ))}
      </nav>

      <div style={{ borderTop: '1px solid var(--line)', paddingTop: 14, marginTop: 14 }}>
        <div style={{ fontSize: 12.5, color: 'var(--text-dim)', marginBottom: 8, wordBreak: 'break-all' }}>
          {user?.email}
        </div>
        <button className="btn btn-ghost" style={{ width: '100%' }} onClick={logout}>
          Sign out
        </button>
      </div>
    </aside>
  )
}
