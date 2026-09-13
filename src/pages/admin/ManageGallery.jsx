import { useEffect, useState, useRef } from 'react'
import { galleryApi, resolveUrl, uploadImage } from '../../api'
import ImageUploader from '../../components/ImageUploader'

const DEFAULT_CATS = [
  { id: 'general', name: 'General', slug: 'general', description: 'General community photos' },
  { id: 'event', name: 'Events', slug: 'event', description: 'Events & celebrations' },
  { id: 'facility', name: 'Facilities', slug: 'facility', description: 'Amenities & association assets' },
  { id: 'maintenance', name: 'Maintenance', slug: 'maintenance', description: 'Maintenance & development works' },
]

const EMPTY_PHOTO_FORM = {
  title: '',
  image_url: '',
  category: 'general',
  description: '',
  alt_text: '',
  order: 0,
  active: true,
  batchFiles: [],
}

/* ─────────────────────────────────────────────
   Mini Image Slider for Grouped Photos
───────────────────────────────────────────── */
function ImageSlider({ images, title }) {
  const [current, setCurrent] = useState(0)
  if (!images || images.length === 0) return null

  const prev = e => {
    e.stopPropagation()
    setCurrent(c => (c === 0 ? images.length - 1 : c - 1))
  }
  const next = e => {
    e.stopPropagation()
    setCurrent(c => (c === images.length - 1 ? 0 : c + 1))
  }

  return (
    <div style={{ position: 'relative', width: '100%', height: 160, background: '#0d1b3e', overflow: 'hidden', userSelect: 'none' }}>
      {images.map((img, idx) => (
        <img
          key={idx}
          src={resolveUrl(img)}
          alt={`${title || 'Photo'} ${idx + 1}`}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover',
            opacity: idx === current ? 1 : 0, transition: 'opacity 0.3s ease',
          }}
          onError={e => { e.target.style.display = 'none' }}
        />
      ))}

      {images.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            style={{ position: 'absolute', left: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 12 }}
          >
            ‹
          </button>
          <button
            type="button"
            onClick={next}
            style={{ position: 'absolute', right: 6, top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10, fontSize: 12 }}
          >
            ›
          </button>

          {/* Dots */}
          <div style={{ position: 'absolute', bottom: 8, left: 0, right: 0, display: 'flex', justifyContent: 'center', gap: 4, zIndex: 10 }}>
            {images.map((_, i) => (
              <span
                key={i}
                onClick={e => { e.stopPropagation(); setCurrent(i) }}
                style={{
                  width: 6, height: 6, borderRadius: '50%', cursor: 'pointer',
                  background: i === current ? '#fff' : 'rgba(255,255,255,0.4)',
                  transition: 'background 0.2s',
                }}
              />
            ))}
          </div>

          <div style={{ position: 'absolute', top: 8, right: 8, background: 'rgba(0,0,0,0.7)', color: '#fff', fontSize: 10, fontWeight: 700, padding: '2px 8px', borderRadius: 10, zIndex: 10 }}>
            {current + 1}/{images.length} photos
          </div>
        </>
      )}
    </div>
  )
}

/* ─────────────────────────────────────────────
   Group flat image list into slider sets by (title + category)
───────────────────────────────────────────── */
function groupGalleryItems(items) {
  const groups = []
  const groupMap = {}

  items.forEach(item => {
    const cat = item.category || 'general'
    const title = (item.title || '').trim()

    if (title) {
      const key = `${cat}__${title.toLowerCase()}`
      if (groupMap[key] !== undefined) {
        groups[groupMap[key]].items.push(item)
      } else {
        groupMap[key] = groups.length
        groups.push({ key, items: [item], representative: item })
      }
    } else {
      groups.push({ key: `solo_${item.id}`, items: [item], representative: item })
    }
  })

  return groups
}

export default function ManageGallery({ token }) {
  const [subTab, setSubTab]                 = useState('photos') // photos | categories
  const [items, setItems]                   = useState([])
  const [categories, setCategories]         = useState(DEFAULT_CATS)
  const [showModal, setShowModal]           = useState(false)
  const [editing, setEditing]               = useState(null)
  const [photoForm, setPhotoForm]           = useState(EMPTY_PHOTO_FORM)
  const [saving, setSaving]                 = useState(false)
  const [error, setError]                   = useState('')
  const [search, setSearch]                 = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [selectedIds, setSelectedIds]       = useState([])
  const [uploadingBatch, setUploadingBatch] = useState(false)
  const fileInputRef = useRef(null)

  // Category Modal State
  const [showCatModal, setShowCatModal]   = useState(false)
  const [editingCat, setEditingCat]       = useState(null)
  const [catForm, setCatForm]             = useState({ name: '', description: '' })

  const load = () => {
    galleryApi.list().then(data => setItems(data)).catch(() => {})
  }

  useEffect(() => { load() }, [])

  const openAddPhoto = () => {
    setEditing(null)
    setPhotoForm(EMPTY_PHOTO_FORM)
    setError('')
    setShowModal(true)
  }

  const openEditPhoto = g => {
    setEditing(g)
    setPhotoForm({
      title: g.title || '',
      image_url: g.image_url || '',
      category: g.category || 'general',
      description: g.description || '',
      alt_text: g.alt_text || '',
      order: g.order ?? 0,
      active: g.active ?? true,
      batchFiles: [],
    })
    setError('')
    setShowModal(true)
  }

  const handleSavePhoto = async e => {
    e.preventDefault()

    // Handle batch multi-file upload
    if (!editing && photoForm.batchFiles && photoForm.batchFiles.length > 1) {
      setSaving(true)
      setError('')
      try {
        for (let i = 0; i < photoForm.batchFiles.length; i++) {
          const file = photoForm.batchFiles[i]
          const url = await uploadImage(file, token)
          await galleryApi.create({
            title: photoForm.title || file.name.replace(/\.[^/.]+$/, ''),
            image_url: url,
            category: photoForm.category,
            description: photoForm.description,
            alt_text: photoForm.alt_text,
            order: (photoForm.order || 0) + i,
            active: photoForm.active,
          }, token)
        }
        setShowModal(false)
        load()
      } catch (err) {
        setError('Batch upload failed: ' + err.message)
      } finally {
        setSaving(false)
      }
      return
    }

    if (!photoForm.title || !photoForm.image_url) {
      setError('Title and Image URL are required.')
      return
    }
    setSaving(true)
    try {
      if (editing) await galleryApi.update(editing.id, photoForm, token)
      else         await galleryApi.create(photoForm, token)
      setShowModal(false)
      load()
    } catch (err) {
      setError(err.message || 'Failed to save photo')
    } finally {
      setSaving(false)
    }
  }

  const handleToggleActive = async (g) => {
    const updated = { ...g, active: !(g.active ?? true) }
    try {
      await galleryApi.update(g.id, updated, token)
      setItems(prev => prev.map(item => item.id === g.id ? { ...item, active: !(item.active ?? true) } : item))
    } catch (err) {
      alert('Failed to update photo status')
    }
  }

  const handleDeletePhoto = async id => {
    if (!window.confirm('Delete this photo?')) return
    await galleryApi.delete(id, token).catch(() => {})
    load()
  }

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return
    if (!window.confirm(`Delete ${selectedIds.length} selected photos?`)) return
    try {
      await galleryApi.bulkDelete(selectedIds, token)
      setSelectedIds([])
      load()
    } catch (err) {
      alert('Bulk delete failed: ' + err.message)
    }
  }

  // Category handlers
  const handleSaveCat = e => {
    e.preventDefault()
    if (!catForm.name) return
    const slug = catForm.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
    if (editingCat) {
      setCategories(prev => prev.map(c => c.id === editingCat.id ? { ...c, name: catForm.name, slug, description: catForm.description } : c))
    } else {
      setCategories(prev => [...prev, { id: slug, name: catForm.name, slug, description: catForm.description }])
    }
    setShowCatModal(false)
  }

  const handleDeleteCat = catId => {
    if (!window.confirm('Remove this category? Photos in this category will remain available under General.')) return
    setCategories(prev => prev.filter(c => c.id !== catId))
  }

  // Filter & Search logic
  const filteredItems = items.filter(g => {
    const matchCat = categoryFilter === 'all' || g.category === categoryFilter
    const matchSearch = !search || g.title.toLowerCase().includes(search.toLowerCase())
    return matchCat && matchSearch
  })

  const grouped = groupGalleryItems(filteredItems)

  return (
    <div>
      {/* Top Header */}
      <div className="admin-topbar">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span className="admin-topbar-title">🎨 Photo Gallery &amp; Albums</span>
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.06)', padding: 3, borderRadius: 12, border: '1px solid rgba(255,255,255,0.1)' }}>
            <button
              onClick={() => setSubTab('photos')}
              style={{
                background: subTab === 'photos' ? '#d4a017' : 'transparent',
                color: subTab === 'photos' ? '#0d1b3e' : '#9ca3af',
                border: 'none', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              📷 Photos &amp; Uploads ({items.length})
            </button>
            <button
              onClick={() => setSubTab('categories')}
              style={{
                background: subTab === 'categories' ? '#d4a017' : 'transparent',
                color: subTab === 'categories' ? '#0d1b3e' : '#9ca3af',
                border: 'none', padding: '5px 14px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer',
              }}
            >
              📁 Album Categories ({categories.length})
            </button>
          </div>
        </div>

        {subTab === 'photos' ? (
          <div style={{ display: 'flex', gap: 8 }}>
            {selectedIds.length > 0 && (
              <button className="btn btn-danger btn-sm" onClick={handleBulkDelete}>
                🗑 Delete Selected ({selectedIds.length})
              </button>
            )}
            <button className="btn btn-primary btn-sm" onClick={openAddPhoto}>+ Upload Photos</button>
          </div>
        ) : (
          <button className="btn btn-primary btn-sm" onClick={() => { setEditingCat(null); setCatForm({ name: '', description: '' }); setShowCatModal(true) }}>
            + Add Category
          </button>
        )}
      </div>

      <div className="admin-content">
        {subTab === 'photos' && (
          <div>
            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', background: 'rgba(255,255,255,0.03)', padding: '12px 16px', borderRadius: 14, border: '1px solid rgba(255,255,255,0.08)' }}>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--gray)', fontWeight: 600 }}>Filter Album:</span>
                <button
                  onClick={() => setCategoryFilter('all')}
                  className={`btn btn-sm ${categoryFilter === 'all' ? 'btn-primary' : 'btn-outline'}`}
                >
                  All ({items.length})
                </button>
                {categories.map(c => {
                  const count = items.filter(g => g.category === c.id).length
                  return (
                    <button
                      key={c.id}
                      onClick={() => setCategoryFilter(c.id)}
                      className={`btn btn-sm ${categoryFilter === c.id ? 'btn-primary' : 'btn-outline'}`}
                    >
                      {c.name} ({count})
                    </button>
                  )
                })}
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  className="form-input"
                  style={{ width: 200, padding: '6px 12px', fontSize: 13 }}
                  placeholder="🔍 Search title..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Photos Grid with Mini-Sliders for Grouped Sets */}
            {grouped.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
                <div style={{ fontSize: 48, marginBottom: 12 }}>🎨</div>
                <p>No photos found. Upload your first photo or album set!</p>
                <button className="btn btn-primary btn-sm" onClick={openAddPhoto} style={{ marginTop: 12 }}>+ Upload Photos</button>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                {grouped.map(group => {
                  const rep = group.representative
                  const imgUrls = group.items.map(item => item.image_url)
                  const groupIds = group.items.map(item => item.id)
                  const allSelected = groupIds.length > 0 && groupIds.every(id => selectedIds.includes(id))
                  const isActive = rep.active ?? true

                  return (
                    <div key={group.key} className="card" style={{ padding: 0, overflow: 'hidden', cursor: 'default', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.08)' }}>
                      {/* Top Checkbox & Status Overlay */}
                      <div style={{ position: 'relative' }}>
                        <ImageSlider images={imgUrls} title={rep.title} />

                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={allSelected}
                          onChange={e => {
                            if (e.target.checked) {
                              setSelectedIds(prev => [...new Set([...prev, ...groupIds])])
                            } else {
                              setSelectedIds(prev => prev.filter(id => !groupIds.includes(id)))
                            }
                          }}
                          style={{ position: 'absolute', top: 10, left: 10, width: 18, height: 18, cursor: 'pointer', zIndex: 12 }}
                        />

                        {/* Active toggle badge */}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(rep)}
                          style={{
                            position: 'absolute', top: 10, right: group.items.length > 1 ? 74 : 10,
                            background: isActive ? '#10b981' : '#ef4444',
                            color: '#fff', border: 'none', borderRadius: 12,
                            padding: '2px 8px', fontSize: 10, fontWeight: 700,
                            cursor: 'pointer', zIndex: 12,
                          }}
                        >
                          {isActive ? '✓ Active' : 'Hidden'}
                        </button>
                      </div>

                      {/* Info & Action area */}
                      <div style={{ padding: '12px 14px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                        <div>
                          <div style={{ fontWeight: 700, fontSize: 14, color: '#fff', marginBottom: 4 }}>
                            {rep.title}
                            {group.items.length > 1 && (
                              <span style={{ fontSize: 11, color: '#9ca3af', marginLeft: 6 }}>
                                ({group.items.length} set)
                              </span>
                            )}
                          </div>
                          <span className={`badge badge-${rep.category}`} style={{ textTransform: 'capitalize' }}>
                            {rep.category}
                          </span>
                        </div>

                        <div style={{ display: 'flex', gap: 6, marginTop: 12, paddingTop: 10, borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                          <button className="btn btn-outline btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={() => openEditPhoto(rep)}>
                            ✏ Edit
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              if (group.items.length > 1) {
                                if (window.confirm(`Delete all ${group.items.length} photos in this album set?`)) {
                                  Promise.all(groupIds.map(id => galleryApi.delete(id, token))).then(load)
                                }
                              } else {
                                handleDeletePhoto(rep.id)
                              }
                            }}
                          >
                            🗑
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Categories Manager Sub-tab */}
        {subTab === 'categories' && (
          <div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
              {categories.map(c => {
                const count = items.filter(g => g.category === c.id).length
                return (
                  <div key={c.id} className="card" style={{ padding: 20, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                        <h3 style={{ margin: 0, fontSize: 18, color: '#fff', fontWeight: 800 }}>📁 {c.name}</h3>
                        <span className="badge badge-event">{count} photos</span>
                      </div>
                      <p style={{ fontSize: 13, color: 'var(--gray)', margin: 0, lineHeight: 1.5 }}>
                        {c.description || 'No description provided.'}
                      </p>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 16, paddingTop: 12, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        className="btn btn-outline btn-sm" style={{ flex: 1 }}
                        onClick={() => { setEditingCat(c); setCatForm({ name: c.name, description: c.description || '' }); setShowCatModal(true) }}
                      >
                        ✏ Edit Album
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDeleteCat(c.id)}
                        disabled={['general', 'event', 'facility', 'maintenance'].includes(c.id)}
                      >
                        🗑
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* Add / Edit Photo Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 540 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editing ? 'Edit Photo' : 'Upload Gallery Photo(s)'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSavePhoto} className="admin-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input
                  className="form-input"
                  value={photoForm.title}
                  onChange={e => setPhotoForm(f => ({ ...f, title: e.target.value }))}
                  placeholder="e.g. Annual Sports Day 2024"
                />
              </div>

              {!editing && (
                <div className="form-group">
                  <label className="form-label">Batch Upload Multiple Images (Optional)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={e => {
                      const files = Array.from(e.target.files || [])
                      setPhotoForm(f => ({ ...f, batchFiles: files }))
                    }}
                    style={{ background: 'rgba(255,255,255,0.05)', padding: 8, borderRadius: 8, color: '#fff', fontSize: 12 }}
                  />
                  {photoForm.batchFiles.length > 1 && (
                    <div style={{ fontSize: 12, color: '#34d399', marginTop: 4 }}>
                      ✓ {photoForm.batchFiles.length} files selected for multi-photo album upload
                    </div>
                  )}
                </div>
              )}

              <div className="form-group">
                <label className="form-label">Single Image Upload / URL *</label>
                <ImageUploader token={token} value={photoForm.image_url} onChange={url => setPhotoForm(f => ({ ...f, image_url: url }))} />
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Category Album</label>
                  <select
                    className="form-input form-select"
                    value={photoForm.category}
                    onChange={e => setPhotoForm(f => ({ ...f, category: e.target.value }))}
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Order</label>
                  <input
                    className="form-input"
                    type="number"
                    value={photoForm.order}
                    onChange={e => setPhotoForm(f => ({ ...f, order: Number(e.target.value) }))}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Description (Optional)</label>
                <input
                  className="form-input"
                  value={photoForm.description}
                  onChange={e => setPhotoForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Caption or additional details"
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Uploading…' : editing ? 'Save Changes' : photoForm.batchFiles.length > 1 ? `Upload ${photoForm.batchFiles.length} Photos` : 'Add Photo'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Modal */}
      {showCatModal && (
        <div className="modal-backdrop" onClick={() => setShowCatModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 460 }}>
            <div className="modal-header">
              <h2 className="modal-title">{editingCat ? 'Edit Album Category' : 'Add New Category'}</h2>
              <button className="modal-close" onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSaveCat} className="admin-form">
              <div className="form-group">
                <label className="form-label">Category Name *</label>
                <input
                  className="form-input"
                  value={catForm.name}
                  onChange={e => setCatForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Celebrations"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea
                  className="form-input form-textarea"
                  value={catForm.description}
                  onChange={e => setCatForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Brief summary of photos in this category"
                  rows={3}
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowCatModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Save Category</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
