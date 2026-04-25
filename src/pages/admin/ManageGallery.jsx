import { useEffect, useState } from 'react'
import { galleryApi, resolveUrl } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const CATS = ['general', 'event', 'facility', 'maintenance']
const EMPTY = { title: '', image_url: '', category: 'general', order: 0 }

export default function ManageGallery({ token }) {
  const [items, setItems]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm]       = useState(EMPTY)
  const [saving, setSaving]   = useState(false)
  const [error, setError]     = useState('')
  const [view, setView]       = useState('grid') // grid | table

  const load = () => galleryApi.list().then(setItems).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = g => { setEditing(g); setForm({ title: g.title, image_url: g.image_url, category: g.category, order: g.order }); setError(''); setShowModal(true) }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.image_url) { setError('Title and Image URL are required.'); return }
    setSaving(true)
    try {
      if (editing) await galleryApi.update(editing.id, form, token)
      else         await galleryApi.create(form, token)
      setShowModal(false); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this photo?')) return
    await galleryApi.delete(id, token).catch(() => {})
    load()
  }

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">🎨 Photo Gallery</span>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-outline btn-sm" onClick={() => setView(v => v === 'grid' ? 'table' : 'grid')}>
            {view === 'grid' ? '☰ Table' : '⊞ Grid'}
          </button>
          <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Photo</button>
        </div>
      </div>
      <div className="admin-content">
        {items.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
            <p>No photos yet. <button className="btn btn-primary btn-sm" onClick={openAdd} style={{ marginLeft: 8 }}>Add one →</button></p>
          </div>
        ) : view === 'grid' ? (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 16 }}>
            {items.map(g => (
              <div key={g.id} className="card" style={{ cursor: 'default' }}>
                <img src={resolveUrl(g.image_url)} alt={g.title} style={{ width: '100%', height: 140, objectFit: 'cover', background: '#1a2d5a' }} onError={e => e.target.style.background='#1a2d5a'} />
                <div style={{ padding: '12px 14px' }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 6 }}>{g.title}</div>
                  <span className={`badge badge-${g.category}`}>{g.category}</span>
                  <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(g)}>✏</button>
                    <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>🗑</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Photo</th><th>Title</th><th>Category</th><th>Order</th><th>Actions</th></tr></thead>
            <tbody>
              {items.map(g => (
                <tr key={g.id}>
                  <td><img src={resolveUrl(g.image_url)} alt={g.title} style={{ width: 72, height: 48, objectFit: 'cover', borderRadius: 8, background: '#1a2d5a' }} onError={e => e.target.style.background='#1a2d5a'} /></td>
                  <td style={{ fontWeight: 600 }}>{g.title}</td>
                  <td><span className={`badge badge-${g.category}`}>{g.category}</span></td>
                  <td style={{ color: 'var(--gray)' }}>{g.order}</td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(g)}>✏ Edit</button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(g.id)}>🗑</button>
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
              <h2 className="modal-title">{editing ? 'Edit Photo' : 'Add Photo'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="e.g. Annual Day 2024" />
              </div>
              <div className="form-group">
                <label className="form-label">Image *</label>
                <ImageUploader token={token} value={form.image_url} onChange={url => setForm(f => ({...f, image_url: url}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category</label>
                  <select className="form-input form-select" value={form.category} onChange={e => setForm(f => ({...f, category: e.target.value}))}>
                    {CATS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({...f, order: Number(e.target.value)}))} />
                </div>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Photo'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
