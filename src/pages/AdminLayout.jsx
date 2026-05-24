import { Routes, Route, NavLink, Link, useNavigate } from 'react-router-dom'
import Dashboard from './admin/Dashboard'
import ManageSlides from './admin/ManageSlides'
import ManageNews from './admin/ManageNews'
import ManageGallery from './admin/ManageGallery'
import ManageCommittee from './admin/ManageCommittee'
import ManageContacts from './admin/ManageContacts'
import ManageExpenses from './admin/ManageExpenses'
import ManageIncomes from './admin/ManageIncomes'
import ManageReports from './admin/ManageReports'

const NAV = [
  { to: '/admin',           icon: '📊', label: 'Dashboard',  end: true },
  { to: '/admin/committee', icon: '👥', label: 'Committee' },
  { to: '/admin/slides',    icon: '🖼️', label: 'Slides' },
  { to: '/admin/news',      icon: '📰', label: 'News' },
  { to: '/admin/gallery',   icon: '🎨', label: 'Gallery' },
  { to: '/admin/contacts',  icon: '📞', label: 'Contacts' },
  { to: '/admin/expenses',  icon: '💸', label: 'Expenses' },
  { to: '/admin/incomes',   icon: '💰', label: 'Other Incomes' },
  { to: '/admin/reports',   icon: '📁', label: 'Reports' },
]

export default function AdminLayout({ token, admin, onLogout }) {
  const navigate = useNavigate()
  const initials = admin?.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || 'A'

  const handleLogout = () => { onLogout(); navigate('/admin/login') }

  return (
    <div className="admin-layout">
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="sidebar-brand">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', border: '2px solid #d4a017', overflow: 'hidden', flexShrink: 0, background: '#0d1b3e', boxShadow: '0 0 10px rgba(212,160,23,0.35)' }}>
              <img src="/icon.png" alt="FNRA" style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
            </div>
            <div>
              <div className="sidebar-brand-title">FNRA Admin</div>
              <div className="sidebar-brand-sub">CONTENT MANAGEMENT</div>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {NAV.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              end={n.end}
              className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}
            >
              <span className="icon">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', margin: '12px 0' }} />
          <a href="/" className="sidebar-link" target="_blank" rel="noreferrer">
            <span className="icon">🌐</span> View Website
          </a>
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{initials}</div>
            <div>
              <div className="sidebar-username">{admin?.name || 'Admin'}</div>
              <div className="sidebar-role">{admin?.role || 'admin'}</div>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="btn btn-danger btn-sm"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8 }}
          >
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main area */}
      <main className="admin-main">
        <Routes>
          <Route index element={<Dashboard token={token} />} />
          <Route path="committee" element={<ManageCommittee token={token} />} />
          <Route path="slides"    element={<ManageSlides   token={token} />} />
          <Route path="news"      element={<ManageNews     token={token} />} />
          <Route path="gallery"   element={<ManageGallery  token={token} />} />
          <Route path="contacts"  element={<ManageContacts token={token} />} />
          <Route path="expenses"  element={<ManageExpenses token={token} />} />
          <Route path="incomes"   element={<ManageIncomes  token={token} />} />
          <Route path="reports"   element={<ManageReports  token={token} />} />
        </Routes>
      </main>
    </div>
  )
}
