import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { slidesApi, newsApi, galleryApi, committeeApi, adminContactsApi, expensesApi, incomesApi } from '../../api'

export default function Dashboard({ token }) {
  const [counts, setCounts] = useState({ slides: 0, news: 0, gallery: 0, committee: 0, contacts: 0, expenses: 0, incomes: 0 })
  const [recentNews, setRecentNews] = useState([])

  useEffect(() => {
    Promise.all([
      slidesApi.list(),
      newsApi.list(),
      galleryApi.list(),
      committeeApi.listAll(token).catch(() => []),
      adminContactsApi.list(token).catch(() => []),
      expensesApi.getSummary(token).catch(() => ({ total_amount: 0 })),
      incomesApi.getSummary(token).catch(() => ({ total_amount: 0 })),
    ]).then(([s, n, g, c, ct, exp, inc]) => {
      setCounts({
        slides: s.length,
        news: n.length,
        gallery: g.length,
        committee: c.length,
        contacts: ct.length,
        expenses: exp?.total_amount || 0,
        incomes: inc?.total_amount || 0
      })
      setRecentNews(n.slice(0, 5))
    }).catch(() => {})
  }, [])

  const stats = [
    { label: 'Hero Slides',    value: counts.slides,                                  icon: '🖼️', color: '#d4a017', link: '/admin/slides'    },
    { label: 'News Items',     value: counts.news,                                    icon: '📰', color: '#3b82f6', link: '/admin/news'      },
    { label: 'Gallery Photos', value: counts.gallery,                                 icon: '🎨', color: '#10b981', link: '/admin/gallery'   },
    { label: 'Committee',      value: counts.committee,                               icon: '👥', color: '#a78bfa', link: '/admin/committee' },
    { label: 'Contacts',       value: counts.contacts,                                icon: '📞', color: '#ef4444', link: '/admin/contacts'  },
    { label: 'Total Outflow',  value: '₹' + counts.expenses.toLocaleString('en-IN'), icon: '💸', color: '#FF007A', link: '/admin/expenses'  },
    { label: 'Other Income',   value: '₹' + counts.incomes.toLocaleString('en-IN'),  icon: '💰', color: '#CCFF00', link: '/admin/incomes'   },
  ]

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">Dashboard</span>
        <span style={{ fontSize: 12, color: 'var(--gray)' }}>{new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
      </div>
      <div className="admin-content">
        {/* Stats */}
        <div className="stats-grid">
          {stats.map(s => (
            <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
              <div className="stat-card" style={{ borderColor: s.color + '33', cursor: 'pointer' }}>
                <span className="stat-card-icon">{s.icon}</span>
                <span className="stat-card-value" style={{ color: s.color }}>{s.value}</span>
                <span className="stat-card-label">{s.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick actions */}
        <div style={{ marginBottom: 28 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Quick Actions</h2>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link to="/admin/expenses" className="btn btn-outline">💸 Manage Expenses</Link>
            <Link to="/admin/incomes"  className="btn btn-outline">💰 Manage Incomes</Link>
            <Link to="/admin/reports"  className="btn btn-outline">📁 Financial Reports</Link>
            <Link to="/admin/slides"   className="btn btn-outline">🖼️ Manage Slides</Link>
            <Link to="/admin/news"     className="btn btn-outline">📰 Add News</Link>
            <a href="/" target="_blank" rel="noreferrer" className="btn btn-primary">🌐 View Site</a>
          </div>
        </div>

        {/* Recent news */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 700, marginBottom: 16 }}>Recent News</h2>
          {recentNews.length === 0 ? (
            <p style={{ color: 'var(--gray)' }}>No news published yet. <Link to="/admin/news" style={{ color: 'var(--gold)' }}>Add some →</Link></p>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Category</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {recentNews.map(n => (
                  <tr key={n.id}>
                    <td style={{ fontWeight: 600 }}>{n.title}</td>
                    <td><span className={`badge badge-${n.category}`}>{n.category}</span></td>
                    <td><span className={`badge ${n.published ? 'badge-event' : 'badge-general'}`}>{n.published ? '✓ Published' : 'Draft'}</span></td>
                    <td style={{ color: 'var(--gray)', fontSize: 12 }}>{n.date ? new Date(n.date).toLocaleDateString('en-IN') : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
