import { useEffect, useState } from 'react'
import { committeeApi, resolveUrl } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const ROLES = [
  'President',
  'Vice President',
  'Secretary',
  'Joint Secretary',
  'Treasurer',
  'Executive Member',
]

const ROLE_COLORS = {
  'President':        '#d4a017',
  'Vice President':   '#a78bfa',
  'Secretary':        '#38bdf8',
  'Joint Secretary':  '#34d399',
  'Treasurer':        '#fb923c',
  'Executive Member': '#94a3b8',
}

const EMPTY = {
  name: '', role: 'Executive Member', photo_url: '',
  phone: '', email: '', bio: '', order: 99, published: true,
}

export default function ManageCommittee({ token }) {
  const [members,   setMembers]   = useState([])
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [error,     setError]     = useState('')

  const load = () => committeeApi.listAll(token).then(setMembers).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = () => { setEditing(null); setForm(EMPTY); setError(''); setShowModal(true) }
  const openEdit = m => {
    setEditing(m)
    setForm({ name: m.name, role: m.role, photo_url: m.photo_url||'', phone: m.phone||'', email: m.email||'', bio: m.bio||'', order: m.order, published: m.published })
    setError(''); setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name || !form.role) { setError('Name and Role are required.'); return }
    setSaving(true)
    try {
      if (editing) await committeeApi.update(editing.id, form, token)
      else         await committeeApi.create(form, token)
      setShowModal(false); load()
    } catch (e) { setError(e.message) }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Remove this member?')) return
    setDeleting(id)
    try {
      await committeeApi.delete(id, token)
      setMembers(prev => prev.filter(m => m.id !== id))
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'))
      load()
    } finally { setDeleting(null) }
  }

  const togglePublish = async m => {
    try {
      await committeeApi.update(m.id, { ...m, published: !m.published }, token)
      setMembers(prev => prev.map(x => x.id === m.id ? { ...x, published: !x.published } : x))
    } catch (e) { alert('Update failed: ' + e.message) }
  }

  // Group by role priority
  const priority = ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member']
  const sorted = [...members].sort((a, b) => {
    const ai = priority.indexOf(a.role), bi = priority.indexOf(b.role)
    if (ai !== bi) return ai - bi
    return a.order - b.order
  })

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">👥 Executive Committee</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Member</button>
      </div>

      <div className="admin-content">
        {/* Summary badges */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 24 }}>
          {ROLES.map(r => {
            const count = members.filter(m => m.role === r).length
            if (!count) return null
            return (
              <div key={r} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 20, background: ROLE_COLORS[r] + '22', border: `1px solid ${ROLE_COLORS[r]}44`, fontSize: 12, fontWeight: 700, color: ROLE_COLORS[r] }}>
                {count} {r}{count > 1 ? 's' : ''}
              </div>
            )
          })}
        </div>

        {sorted.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 56, marginBottom: 12 }}>👥</div>
            <p style={{ marginBottom: 16 }}>No committee members yet.</p>
            <button className="btn btn-primary" onClick={openAdd}>Add First Member</button>
          </div>
        ) : (
          /* Card grid */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 20 }}>
            {sorted.map(m => (
              <div key={m.id} style={{
                background: 'rgba(255,255,255,0.05)',
                border: `1px solid ${m.published ? ROLE_COLORS[m.role] + '44' : 'rgba(255,255,255,0.08)'}`,
                borderTop: `3px solid ${m.published ? ROLE_COLORS[m.role] : '#374151'}`,
                borderRadius: 16, overflow: 'hidden',
                opacity: m.published ? 1 : 0.65,
                transition: 'all 0.2s',
              }}>
                {/* Photo */}
                <div style={{ position: 'relative', height: 160, background: 'linear-gradient(135deg, #1a2d5a, #0d1b3e)', overflow: 'hidden' }}>
                  {m.photo_url ? (
                    <img src={resolveUrl(m.photo_url)} alt={m.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => e.target.style.display='none'} />
                  ) : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 52, color: ROLE_COLORS[m.role] + '88' }}>
                      {m.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Publish badge */}
                  <div style={{ position: 'absolute', top: 10, right: 10 }}>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, padding: '3px 8px', borderRadius: 10, background: m.published ? 'rgba(16,185,129,0.85)' : 'rgba(107,114,128,0.85)', color: '#fff' }}>
                      {m.published ? '● Published' : '○ Draft'}
                    </span>
                  </div>
                </div>

                {/* Info */}
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1.5, color: ROLE_COLORS[m.role], marginBottom: 4 }}>
                    {m.role}
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 16, color: '#fff', marginBottom: 6 }}>{m.name}</div>
                  {m.phone && <div style={{ fontSize: 12, color: '#9ca3af' }}>📞 {m.phone}</div>}
                  {m.email && <div style={{ fontSize: 12, color: '#9ca3af' }}>✉ {m.email}</div>}
                  {m.bio   && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 6, lineHeight: 1.5 }}>{m.bio.slice(0, 80)}{m.bio.length > 80 ? '…' : ''}</div>}

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: 8, marginTop: 14 }}>
                    <button
                      onClick={() => togglePublish(m)}
                      className="btn btn-sm"
                      style={{ flex: 1, justifyContent: 'center', background: m.published ? 'rgba(107,114,128,0.15)' : 'rgba(16,185,129,0.15)', color: m.published ? '#9ca3af' : '#34d399', border: `1px solid ${m.published ? 'rgba(107,114,128,0.3)' : 'rgba(16,185,129,0.3)'}` }}
                    >
                      {m.published ? '⊘ Unpublish' : '✓ Publish'}
                    </button>
                    <button className="btn btn-outline btn-sm" onClick={() => openEdit(m)}>✏</button>
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => handleDelete(m.id)}
                      disabled={deleting === m.id}
                      style={{ minWidth: 36, opacity: deleting === m.id ? 0.5 : 1 }}
                    >
                      {deleting === m.id ? '…' : '🗑'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Modal ──────────────────────────────────────── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 580 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Member' : '+ Add Committee Member'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {error && <div className="login-error" style={{ marginBottom: 16 }}>⚠ {error}</div>}

            <form onSubmit={handleSave} className="admin-form">
              {/* Name + Role */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Full Name *</label>
                  <input className="form-input" value={form.name} onChange={e => setForm(f => ({...f, name: e.target.value}))} placeholder="e.g. Rajesh Kumar" />
                </div>
                <div className="form-group">
                  <label className="form-label">Role *</label>
                  <select className="form-input form-select" value={form.role} onChange={e => setForm(f => ({...f, role: e.target.value}))}>
                    {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>

              {/* Photo */}
              <div className="form-group">
                <label className="form-label">Photo</label>
                <ImageUploader token={token} value={form.photo_url} onChange={url => setForm(f => ({...f, photo_url: url}))} label="Member Photo" />
              </div>

              {/* Phone + Email */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Phone</label>
                  <input className="form-input" value={form.phone} onChange={e => setForm(f => ({...f, phone: e.target.value}))} placeholder="+91 99999 99999" />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e => setForm(f => ({...f, email: e.target.value}))} placeholder="name@example.com" />
                </div>
              </div>

              {/* Bio */}
              <div className="form-group">
                <label className="form-label">Bio / Note</label>
                <textarea className="form-input form-textarea" style={{ minHeight: 80 }} value={form.bio} onChange={e => setForm(f => ({...f, bio: e.target.value}))} placeholder="Short description about the member…" />
              </div>

              {/* Order + Publish */}
              <div className="form-row" style={{ alignItems: 'center' }}>
                <div className="form-group">
                  <label className="form-label">Display Order</label>
                  <input className="form-input" type="number" value={form.order} onChange={e => setForm(f => ({...f, order: Number(e.target.value)}))} />
                </div>
                <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 20 }}>
                  <label className="toggle">
                    <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({...f, published: e.target.checked}))} />
                    <span className="toggle-slider" />
                  </label>
                  <span style={{ fontSize: 14, color: 'var(--gray)' }}>
                    {form.published ? '✓ Published on website' : 'Draft (hidden)'}
                  </span>
                </div>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : '+ Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
