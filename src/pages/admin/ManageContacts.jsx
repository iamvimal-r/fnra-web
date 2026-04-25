import { useEffect, useState } from 'react'
import { adminContactsApi } from '../../api'

const CATEGORIES = [
  { key: 'emergency',   label: 'Emergency',   emoji: '🚨', color: '#ef4444' },
  { key: 'electrician', label: 'Electrician', emoji: '⚡', color: '#f59e0b' },
  { key: 'plumber',     label: 'Plumber',     emoji: '🪠', color: '#0891b2' },
  { key: 'security',    label: 'Security',    emoji: '🛡️', color: '#10b981' },
  { key: 'maintenance', label: 'Maintenance', emoji: '🔧', color: '#8b5cf6' },
  { key: 'authority',   label: 'Authority',   emoji: '🏛️', color: '#6366f1' },
]

const EMPTY = {
  name: '', phone: '', category: 'emergency',
  notes: '', address: '', availability: '', whatsapp: true,
}

function catMeta(key) {
  return CATEGORIES.find(c => c.key === key) || CATEGORIES[0]
}

export default function ManageContacts({ token }) {
  const [contacts,  setContacts]  = useState([])
  const [activeTab, setActiveTab] = useState('all')
  const [showModal, setShowModal] = useState(false)
  const [editing,   setEditing]   = useState(null)
  const [form,      setForm]      = useState(EMPTY)
  const [saving,    setSaving]    = useState(false)
  const [deleting,  setDeleting]  = useState(null)
  const [error,     setError]     = useState('')

  const load = () => adminContactsApi.list(token).then(setContacts).catch(() => {})
  useEffect(() => { load() }, [])

  const openAdd  = (cat = 'emergency') => {
    setEditing(null)
    setForm({ ...EMPTY, category: cat })
    setError('')
    setShowModal(true)
  }
  const openEdit = c => {
    setEditing(c)
    setForm({
      name: c.name, phone: c.phone, category: c.category,
      notes: c.notes||'', address: c.address||'',
      availability: c.availability||'', whatsapp: c.whatsapp !== false,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Name is required.'); return }
    if (!form.phone.trim()) { setError('Phone number is required.'); return }
    setSaving(true)
    try {
      if (editing) await adminContactsApi.update(editing.id, form, token)
      else         await adminContactsApi.create(form, token)
      setShowModal(false)
      load()
    } catch (e) { setError(e.message || 'Save failed') }
    finally { setSaving(false) }
  }

  const handleDelete = async id => {
    if (!window.confirm('Delete this contact?')) return
    setDeleting(id)
    try {
      await adminContactsApi.delete(id, token)
      setContacts(prev => prev.filter(c => c.id !== id))
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'))
      load()
    } finally { setDeleting(null) }
  }

  const visible = activeTab === 'all'
    ? contacts
    : contacts.filter(c => c.category === activeTab)

  const countFor = key => contacts.filter(c => c.category === key).length

  return (
    <div>
      {/* Topbar */}
      <div className="admin-topbar">
        <span className="admin-topbar-title">📞 Emergency &amp; Service Contacts</span>
        <button className="btn btn-primary btn-sm" onClick={() => openAdd(activeTab === 'all' ? 'emergency' : activeTab)}>
          + Add Contact
        </button>
      </div>

      <div className="admin-content">

        {/* Category tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 24 }}>
          <button
            onClick={() => setActiveTab('all')}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 20, border: `1px solid ${activeTab === 'all' ? '#a78bfa' : 'rgba(255,255,255,0.12)'}`,
              background: activeTab === 'all' ? 'rgba(167,139,250,0.15)' : 'rgba(255,255,255,0.04)',
              color: activeTab === 'all' ? '#a78bfa' : '#9ca3af',
              fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
            }}
          >
            📋 All ({contacts.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '8px 16px', borderRadius: 20,
                border: `1px solid ${activeTab === cat.key ? cat.color : 'rgba(255,255,255,0.12)'}`,
                background: activeTab === cat.key ? cat.color + '22' : 'rgba(255,255,255,0.04)',
                color: activeTab === cat.key ? cat.color : '#9ca3af',
                fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              {cat.emoji} {cat.label} {countFor(cat.key) > 0 && `(${countFor(cat.key)})`}
            </button>
          ))}
        </div>

        {/* Contacts grid */}
        {visible.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 52, marginBottom: 12 }}>📞</div>
            <p style={{ marginBottom: 16 }}>
              No {activeTab === 'all' ? '' : activeTab} contacts yet.
            </p>
            <button
              className="btn btn-primary"
              onClick={() => openAdd(activeTab === 'all' ? 'emergency' : activeTab)}
            >
              + Add Contact
            </button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {visible.map(c => {
              const meta = catMeta(c.category)
              const phone = c.phone.replace(/\s+/g, '')
              const waNum = phone.replace(/[^0-9]/g, '')
              const wa    = waNum.startsWith('91') ? waNum : `91${waNum}`

              return (
                <div key={c.id} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: `1px solid ${meta.color}33`,
                  borderLeft: `4px solid ${meta.color}`,
                  borderRadius: 14, padding: '18px 18px 14px',
                  display: 'flex', flexDirection: 'column', gap: 12,
                }}>
                  {/* Header */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 11, background: meta.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                      {meta.emoji}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>{c.name}</div>
                      <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600, marginTop: 1 }}>{c.phone}</div>
                      {c.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 3 }}>{c.notes}</div>}
                      {c.availability && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>🕐 {c.availability}</div>}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, color: meta.color, background: meta.color + '18', padding: '3px 8px', borderRadius: 12, flexShrink: 0 }}>
                      {meta.label}
                    </span>
                  </div>

                  {/* Quick call preview */}
                  <div style={{ display: 'flex', gap: 6 }}>
                    <a href={`tel:${phone}`} style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 9, background: meta.color + '18', border: `1px solid ${meta.color}44`, color: meta.color, fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                      📞 Call
                    </a>
                    {c.whatsapp !== false && (
                      <a href={`https://wa.me/${wa}`} target="_blank" rel="noreferrer" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, padding: '7px', borderRadius: 9, background: '#25d36618', border: '1px solid #25d36644', color: '#25d366', fontSize: 12, fontWeight: 700, textDecoration: 'none' }}>
                        💬 WhatsApp
                      </a>
                    )}
                  </div>

                  {/* Admin actions */}
                  <div style={{ display: 'flex', gap: 8, borderTop: '1px solid rgba(255,255,255,0.07)', paddingTop: 10 }}>
                    <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEdit(c)}>
                      ✏ Edit
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      style={{ minWidth: 44, opacity: deleting === c.id ? 0.5 : 1 }}
                      disabled={deleting === c.id}
                      onClick={() => handleDelete(c.id)}
                    >
                      {deleting === c.id ? '…' : '🗑'}
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* ── Add / Edit Modal ─────────────────────────────── */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" style={{ maxWidth: 540 }} onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editing ? '✏ Edit Contact' : '+ Add Contact'}
              </h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            {/* Category color strip */}
            <div style={{
              height: 4, borderRadius: 4, marginBottom: 20,
              background: catMeta(form.category).color,
              transition: 'background 0.3s',
            }} />

            {error && (
              <div className="login-error" style={{ marginBottom: 16 }}>⚠ {error}</div>
            )}

            <form onSubmit={handleSave} className="admin-form">
              {/* Category */}
              <div className="form-group">
                <label className="form-label">Category *</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key} type="button"
                      onClick={() => setForm(f => ({ ...f, category: cat.key }))}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 5,
                        padding: '7px 14px', borderRadius: 20, cursor: 'pointer',
                        border: `1px solid ${form.category === cat.key ? cat.color : 'rgba(255,255,255,0.12)'}`,
                        background: form.category === cat.key ? cat.color + '22' : 'rgba(255,255,255,0.04)',
                        color: form.category === cat.key ? cat.color : '#9ca3af',
                        fontSize: 13, fontWeight: 600, transition: 'all 0.2s',
                      }}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name + Phone */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Name *</label>
                  <input
                    className="form-input"
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. City Hospital"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Phone *</label>
                  <input
                    className="form-input"
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="+91 99999 99999"
                  />
                </div>
              </div>

              {/* Notes + Availability */}
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Notes</label>
                  <input
                    className="form-input"
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. 24×7 Emergency"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Availability</label>
                  <input
                    className="form-input"
                    value={form.availability}
                    onChange={e => setForm(f => ({ ...f, availability: e.target.value }))}
                    placeholder="e.g. Mon–Sat 9am–6pm"
                  />
                </div>
              </div>

              {/* Address */}
              <div className="form-group">
                <label className="form-label">Address (optional)</label>
                <input
                  className="form-input"
                  value={form.address}
                  onChange={e => setForm(f => ({ ...f, address: e.target.value }))}
                  placeholder="Street / Area"
                />
              </div>

              {/* WhatsApp toggle */}
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={form.whatsapp}
                    onChange={e => setForm(f => ({ ...f, whatsapp: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>
                  Show WhatsApp button on website
                </span>
              </div>

              {/* Preview */}
              {form.phone && (
                <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: 12, padding: '12px 16px', fontSize: 13, color: '#9ca3af' }}>
                  <span style={{ color: catMeta(form.category).color, fontWeight: 700 }}>Preview: </span>
                  {form.name || '—'} · {form.phone}
                  {form.notes && ` · ${form.notes}`}
                </div>
              )}

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : '+ Add Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
