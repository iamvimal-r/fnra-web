import { useEffect, useState } from 'react'
import { slidesApi, resolveUrl } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const EMPTY = {
  title: '',
  subtitle: '',
  tag: '',
  image_url: '',
  link: '',
  order: 0,
  active: true,
}

export default function ManageSlides({ token }) {
  const [slides, setSlides]         = useState([])
  const [showModal, setShowModal]   = useState(false)
  const [editing, setEditing]       = useState(null)
  const [form, setForm]             = useState(EMPTY)
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState('')
  const [deleting, setDeleting]     = useState(null)
  const [previewSlide, setPreviewSlide] = useState(null)

  const load = () => {
    slidesApi.list().then(data => {
      const sorted = [...data].sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
      setSlides(sorted)
    }).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY, order: slides.length })
    setError('')
    setShowModal(true)
  }

  const openEdit = s => {
    setEditing(s)
    setForm({
      title: s.title || '',
      subtitle: s.subtitle || '',
      tag: s.tag || '',
      image_url: s.image_url || '',
      link: s.link || '',
      order: s.order ?? 0,
      active: s.active ?? true,
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async e => {
    e.preventDefault()
    if (!form.title || !form.image_url) {
      setError('Title and Image are required.')
      return
    }
    setSaving(true)
    try {
      if (editing) await slidesApi.update(editing.id, form, token)
      else         await slidesApi.create(form, token)
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.message || 'Failed to save slide')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (slide) => {
    const updated = { ...slide, active: !slide.active }
    try {
      await slidesApi.update(slide.id, updated, token)
      setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, active: !s.active } : s))
    } catch (err) {
      alert('Failed to toggle status: ' + err.message)
    }
  }

  const handleDelete = async id => {
    if (!window.confirm('Are you sure you want to delete this hero slide?')) return
    setDeleting(id)
    try {
      await slidesApi.delete(id, token)
      setSlides(prev => prev.filter(s => s.id !== id))
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'))
      load()
    } finally {
      setDeleting(null)
    }
  }

  const handleMoveSlide = async (idx, direction) => {
    const targetIdx = direction === 'up' ? idx - 1 : idx + 1
    if (targetIdx < 0 || targetIdx >= slides.length) return

    const newSlides = [...slides]
    const temp = newSlides[idx]
    newSlides[idx] = newSlides[targetIdx]
    newSlides[targetIdx] = temp

    newSlides.forEach((s, i) => s.order = i)
    setSlides([...newSlides])

    try {
      await Promise.all(newSlides.map(s => slidesApi.update(s.id, {
        title: s.title,
        subtitle: s.subtitle,
        tag: s.tag,
        image_url: s.image_url,
        link: s.link,
        order: s.order,
        active: s.active,
      }, token)))
    } catch (err) {
      console.error('Failed to update order', err)
      load()
    }
  }

  const handleSetFirstSlide = async (idx) => {
    if (idx === 0) return
    const newSlides = [...slides]
    const target = newSlides.splice(idx, 1)[0]
    newSlides.unshift(target)

    newSlides.forEach((s, i) => s.order = i)
    setSlides([...newSlides])

    try {
      await Promise.all(newSlides.map(s => slidesApi.update(s.id, {
        title: s.title,
        subtitle: s.subtitle,
        tag: s.tag,
        image_url: s.image_url,
        link: s.link,
        order: s.order,
        active: s.active,
      }, token)))
    } catch (err) {
      console.error('Failed to set first slide', err)
      load()
    }
  }

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">🖼️ Hero Image Slider Manager</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add New Slide</button>
      </div>

      <div className="admin-content">
        {slides.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
            <p>No hero slides configured yet. Add your first slide!</p>
            <button className="btn btn-primary" style={{ marginTop: 16 }} onClick={openAdd}>+ Add Hero Slide</button>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {slides.map((s, idx) => (
              <div key={s.id} className="card" style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.1)' }}>
                {/* Image Banner Container */}
                <div style={{ position: 'relative', height: 160, background: '#0d1b3e' }}>
                  <img
                    src={resolveUrl(s.image_url)}
                    alt={s.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={e => e.target.style.display = 'none'}
                  />
                  {/* Badges Overlay */}
                  <div style={{ position: 'absolute', top: 10, left: 10, display: 'flex', gap: 6 }}>
                    <span style={{ background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 11, fontWeight: 700, padding: '2px 8px', borderRadius: 12, backdropFilter: 'blur(4px)' }}>
                      #{s.order}
                    </span>
                    {s.tag && (
                      <span style={{ background: 'linear-gradient(135deg, #d4a017, #f0c040)', color: '#0d1b3e', fontSize: 10, fontWeight: 800, padding: '2px 8px', borderRadius: 12, textTransform: 'uppercase' }}>
                        {s.tag}
                      </span>
                    )}
                  </div>

                  {/* Active Toggle Button */}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(s)}
                    style={{
                      position: 'absolute', top: 10, right: 10,
                      background: s.active ? '#10b981' : '#ef4444',
                      color: '#fff', border: 'none', borderRadius: 20,
                      padding: '3px 10px', fontSize: 11, fontWeight: 700,
                      cursor: 'pointer', boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
                    }}
                  >
                    {s.active ? '✓ Active' : 'Hidden'}
                  </button>
                </div>

                {/* Card Content Body */}
                <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column' }}>
                  <h4 style={{ margin: '0 0 6px 0', fontSize: 16, fontWeight: 700, color: '#fff' }}>{s.title}</h4>
                  {s.subtitle && (
                    <p style={{ margin: '0 0 12px 0', fontSize: 13, color: '#9ca3af', lineHeight: 1.4, flex: 1 }}>
                      {s.subtitle}
                    </p>
                  )}
                  {s.link && (
                    <div style={{ fontSize: 11, color: '#38bdf8', marginBottom: 12, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      🔗 {s.link}
                    </div>
                  )}

                  {/* Action bar */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)', gap: 8, marginTop: 'auto' }}>
                    <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleMoveSlide(idx, 'up')}
                        disabled={idx === 0}
                        title="Move Up"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        ▲
                      </button>
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => handleMoveSlide(idx, 'down')}
                        disabled={idx === slides.length - 1}
                        title="Move Down"
                        style={{ padding: '4px 8px', fontSize: 12 }}
                      >
                        ▼
                      </button>
                      {idx === 0 ? (
                        <span style={{ fontSize: 10, fontWeight: 800, color: '#10b981', background: 'rgba(16,185,129,0.15)', padding: '3px 8px', borderRadius: 8, border: '1px solid rgba(16,185,129,0.3)' }}>
                          ⭐ 1st Slide
                        </span>
                      ) : (
                        <button
                          className="btn btn-outline btn-sm"
                          onClick={() => handleSetFirstSlide(idx)}
                          style={{ fontSize: 10, fontWeight: 800, color: '#f59e0b', borderColor: 'rgba(245,158,11,0.4)', padding: '3px 8px' }}
                          title="Set as first slide on hero banner"
                        >
                          Set 1st
                        </button>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 6 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => setPreviewSlide(s)} title="Preview Banner">
                        👁
                      </button>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(s)} disabled={deleting === s.id}>
                        ✏ Edit
                      </button>
                      <button className="btn btn-danger btn-sm" onClick={() => handleDelete(s.id)} disabled={deleting === s.id}>
                        {deleting === s.id ? '…' : '🗑'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 560 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Hero Slide' : 'Add New Hero Slide'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Slide Title *</label>
                <input
                  className="form-input"
                  value={form.title}
                  onChange={e => setForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Welcome to Falcon Nagar"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Subtitle</label>
                <textarea
                  className="form-input form-textarea"
                  value={form.subtitle}
                  onChange={e => setForm(f => ({ ...f, subtitle: e.target.value }))}
                  placeholder="Short description rendered on top of the hero image"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tag / Badge</label>
                  <input
                    className="form-input"
                    value={form.tag}
                    onChange={e => setForm(f => ({ ...f, tag: e.target.value }))}
                    placeholder="e.g. Est. 2015, Notice, Event"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Sort Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.order}
                    onChange={e => setForm(f => ({ ...f, order: Number(e.target.value) }))}
                  />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Action Link URL (optional)</label>
                <input
                  className="form-input"
                  value={form.link}
                  onChange={e => setForm(f => ({ ...f, link: e.target.value }))}
                  placeholder="e.g. https://... or #news"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Hero Image *</label>
                <ImageUploader token={token} value={form.image_url} onChange={url => setForm(f => ({ ...f, image_url: url }))} />
              </div>
              <div className="form-group" style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <label className="toggle">
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                  />
                  <span className="toggle-slider" />
                </label>
                <span style={{ fontSize: 14, color: 'var(--gray)' }}>Active (Visible on public homepage)</span>
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Slide'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Slide Preview Modal */}
      {previewSlide && (
        <div className="modal-backdrop" onClick={() => setPreviewSlide(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 720, padding: 0, overflow: 'hidden', background: '#0d1b3e', borderRadius: 20 }}>
            <div style={{ position: 'relative', height: 320, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={resolveUrl(previewSlide.image_url)}
                alt={previewSlide.title}
                style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(13,27,62,0.85) 0%, rgba(13,27,62,0.4) 60%, rgba(13,27,62,0.9) 100%)' }} />
              <button
                onClick={() => setPreviewSlide(null)}
                style={{ position: 'absolute', top: 16, right: 16, background: 'rgba(0,0,0,0.5)', color: '#fff', border: 'none', width: 36, height: 36, borderRadius: '50%', cursor: 'pointer', fontSize: 18, zIndex: 10 }}
              >
                ✕
              </button>
              <div style={{ position: 'relative', zIndex: 5, padding: 32, textAlign: 'center', maxWidth: 540 }}>
                <div style={{ display: 'inline-block', background: 'rgba(212,160,23,0.2)', border: '1px solid #d4a017', color: '#f0c040', fontSize: 11, fontWeight: 800, padding: '4px 14px', borderRadius: 20, textTransform: 'uppercase', letterSpacing: 2, marginBottom: 14 }}>
                  🦅 {previewSlide.tag || 'Falcon Nagar Residence Association'}
                </div>
                <h2 style={{ fontSize: 28, fontWeight: 900, color: '#fff', marginBottom: 12, lineHeight: 1.2 }}>
                  {previewSlide.title}
                </h2>
                <p style={{ fontSize: 14, color: '#d1d5db', lineHeight: 1.6, marginBottom: 20 }}>
                  {previewSlide.subtitle}
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <span className="btn btn-primary btn-sm">📰 Latest News</span>
                  <span className="btn btn-outline btn-sm">About Us</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
