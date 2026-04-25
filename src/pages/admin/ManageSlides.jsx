import { useEffect, useState } from 'react'
import { slidesApi, resolveUrl } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const EMPTY = { title: '', subtitle: '', image_url: '', link: '', order: 0, active: true }

export default function ManageSlides({ token }) {
  const [slides, setSlides]     = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing]   = useState(null)
  const [form, setForm]         = useState(EMPTY)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState('')
  const [deleting, setDeleting] = useState(null)  // id of row being deleted

  const load = () => slidesApi.list().then(setSlides).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = s => {
    setEditing(s)
    setForm({ title: s.title, subtitle: s.subtitle||'', image_url: s.image_url, link: s.link||'', order: s.order, active: s.active })
    setError(''); setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.image_url) { setError('Title and Image URL are required.'); return }
    setSaving(true)
    try {
      if (editing) await slidesApi.update(editing.id, form, token)
      else         await slidesApi.create(form, token)
      setShowModal(false); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this slide?')) return
    setDeleting(id)
    try {
      await slidesApi.delete(id, token)
      setSlides(prev => prev.filter(s => s.id !== id))  // optimistic update
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'))
      load()  // refresh to restore state
    } finally {
      setDeleting(null)
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">🖼️ Hero Slides</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Slide</button>
      </div>
      <div className="admin-content">
        {slides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
            <p>No slides yet. Add your first hero slide!</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>Add Slide</button>
          </div>
        ) : (
          <table className="admin-table">
            <thead><tr><th>Preview</th><th>Title</th><th>Order</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              {slides.map(s => (
                <tr key={s.id}>
                  <td><img src={resolveUrl(s.image_url)} alt={s.title} style={{ width: 80, height: 50, objectFit: 'cover', borderRadius: 8, background: '#1a2d5a' }} onError={e => e.target.style.background='#1a2d5a'} /></td>
                  <td>
                    <div style={{ fontWeight: 600 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--gray)', marginTop: 2 }}>{s.subtitle?.slice(0, 60)}…</div>
                  </td>
                  <td style={{ color: 'var(--gray)' }}>{s.order}</td>
                  <td><span className={`badge ${s.active ? 'badge-event' : 'badge-general'}`}>{s.active ? '✓ Active' : 'Hidden'}</span></td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)} disabled={deleting === s.id}>✏ Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(s.id)}
                        disabled={deleting === s.id}
                        style={{ minWidth: 52, opacity: deleting === s.id ? 0.6 : 1 }}
                      >
                        {deleting === s.id ? '…' : '🗑 Del'}
                      </button>
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
              <h2 className="modal-title">{editing ? 'Edit Slide' : 'Add Slide'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input className="form-input" value={form.title} onChange={e => setForm(f => ({...f, title: e.target.value}))} placeholder="Welcome to Falcon Nagar" />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <textarea className="form-input form-textarea" value={form.subtitle} onChange={e => setForm(f => ({...f, subtitle: e.target.value}))} placeholder="Short description shown on the slide" />
              </div>
              <div className="form-group">
                <label className="form-label">Image *</label>
                <ImageUploader token={token} value={form.image_url} onChange={url => setForm(f => ({...f, image_url: url}))} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({...f, order: Number(e.target.value)}))} />
                </div>
                <div className="form-group">
                  <label className="form-label">Link (optional)</label>
                  <input className="form-input" value={form.link} onChange={e => setForm(f => ({...f, link: e.target.value}))} placeholder="https://..." />
                </div>
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <label className="toggle">
                  <input type="checkbox" checked={form.active} onChange={e => setForm(f => ({...f, active: e.target.checked}))} />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Active (visible on website)</span>
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Slide'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
