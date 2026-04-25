import { useEffect, useState } from 'react'
import { newsApi } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const CATS = ['general', 'event', 'notice', 'urgent']
const EMPTY = { title: '', content: '', image_url: '', category: 'general', published: true, date: new Date().toISOString().slice(0, 10) }

export default function ManageNews({ token }) {
  const [news, setNews]       = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [filter, setFilter]   = useState('all')

  const load = () => newsApi.list().then(setNews).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = n => {
    setEditing(n)
    setForm({ title: n.title, content: n.content, image_url: n.image_url||'', category: n.category, published: n.published, date: n.date ? n.date.slice(0,10) : new Date().toISOString().slice(0,10) })
    setError(''); setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.content) { setError('Title and content are required.'); return }
    setSaving(true)
    try {
      if (editing) await newsApi.update(editing.id, form, token)
      else         await newsApi.create(form, token)
      setShowModal(false); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this news item?')) return
    await newsApi.delete(id, token).catch(() => {})
    load()
  }

  const visible = filter === 'all' ? news : news.filter(n => n.category === filter)

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">📰 News & Notices</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add News</button>
      </div>
      <div className="admin-content">
        {/* Filter chips */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
          {['all', ...CATS].map(c => (
            <button key={c} onClick={() => setFilter(c)} className="btn btn-sm" style={{ background: filter === c ? 'var(--gold)' : 'rgba(255,255,255,0.06)', color: filter === c ? 'var(--navy)' : 'var(--gray)', border: '1px solid rgba(255,255,255,0.1)' }}>
              {c.charAt(0).toUpperCase() + c.slice(1)}
            </button>
          ))}
        </div>

        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
            <p>No news items. <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ marginLeft: 8 }}>Add one →</button></p>
          </div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Title</th><th>Category</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {visible.map(n => (
                <tr key={n.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{n.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{n.content.slice(0, 70)}…</div>
                  </td>
                  <td><span className={`badge badge-${n.category}`}>{n.category}</span></td>
                  <td style={{ color: 'var(--gray)', fontSize: 12 }}>{n.date ? new Date(n.date).toLocaleDateString('en-IN') : '—'}</td>
                  <td><span className={`badge ${n.published ? 'badge-event' : 'badge-general'}`}>{n.published ? '✓ Published' : 'Draft'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(n)}>✏ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(n.id)}>🗑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit News' : 'Add News'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="News headline" />
              </div>
              <div className="form-group">
                <label className="form-label">Content *</label>
                <textarea className="form-input form-textarea" style={{ minHeight: 120 }} value={form.content} onChange={e => setForm(f => ({...f, content: e.target.value}))} placeholder="Full news content…" />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Date</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm(f => ({...f, date: e.target.value}))} />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Image (optional)</label>
                <ImageUploader token={token} value={form.image_url} onChange={url => setForm(f => ({...f, image_url: url}))} />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <label className="toggle">
                  <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({...f, published: e.target.checked}))} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Published (visible on website)</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Publish'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
