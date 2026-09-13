import { useEffect, useState, useMemo } from 'react'
import { housesApi } from '../../api'
import FnraHousePlaque from '../../components/FnraHousePlaque'

const BLOCKS = ['Block A', 'Block B', 'Block C', 'Block D']

const EMPTY_HOUSE = {
  house_number: '',
  block: 'Block C',
  owner_name: '',
  status: 'Active',
  family_members: [],
}

const EMPTY_MEMBER = {
  name: '',
  relation: 'Spouse',
  age: '',
  phone: '',
  email: '',
  blood_group: '',
}

export default function ManageHouses({ token }) {
  const [houses, setHouses] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [blockFilter, setBlockFilter] = useState('ALL')
  const [statusFilter, setStatusFilter] = useState('ALL')
  const [viewMode, setViewMode] = useState('plaque') // 'plaque' | 'table'

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY_HOUSE)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [error, setError] = useState('')

  // Family Member form sub-modal or inline
  const [newFamilyMember, setNewFamilyMember] = useState(EMPTY_MEMBER)
  const [showAddFamily, setShowAddFamily] = useState(false)

  const loadHouses = async () => {
    setLoading(true)
    try {
      const data = await housesApi.list(token)
      setHouses(data || [])
    } catch (e) {
      console.error('Failed to load houses:', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadHouses()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm(EMPTY_HOUSE)
    setError('')
    setShowModal(true)
  }

  const openEdit = (h) => {
    setEditing(h)
    setForm({
      house_number: h.house_number || '',
      block: h.block || 'Block C',
      owner_name: h.owner_name || '',
      status: h.status || 'Active',
      family_members: Array.isArray(h.family_members) ? [...h.family_members] : [],
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.house_number.trim()) {
      setError('House Number is required.')
      return
    }
    if (!form.owner_name.trim()) {
      setError('Owner / Resident Name is required.')
      return
    }

    setSaving(true)
    setError('')
    try {
      const payload = {
        house_number: form.house_number.trim(),
        block: form.block,
        owner_name: form.owner_name.trim(),
        status: form.status,
        family_members: form.family_members,
      }

      if (editing) {
        await housesApi.update(editing._id || editing.id, payload, token)
      } else {
        await housesApi.create(payload, token)
      }
      setShowModal(false)
      loadHouses()
    } catch (err) {
      setError(err.message || 'Failed to save house.')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this house record?')) return
    setDeletingId(id)
    try {
      await housesApi.delete(id, token)
      setHouses((prev) => prev.filter((h) => (h._id || h.id) !== id))
    } catch (err) {
      alert('Delete failed: ' + (err.message || 'Unknown error'))
      loadHouses()
    } finally {
      setDeletingId(null)
    }
  }

  // Family Members Management inside Form
  const addFamilyMember = () => {
    if (!newFamilyMember.name.trim()) return
    setForm((prev) => ({
      ...prev,
      family_members: [...prev.family_members, { ...newFamilyMember }],
    }))
    setNewFamilyMember(EMPTY_MEMBER)
    setShowAddFamily(false)
  }

  const removeFamilyMember = (index) => {
    setForm((prev) => ({
      ...prev,
      family_members: prev.family_members.filter((_, i) => i !== index),
    }))
  }

  // Dynamic block list from houses data
  const allBlocks = useMemo(() => {
    const std = ['Block A', 'Block B', 'Block C', 'Block D']
    const extra = Array.from(new Set((houses || []).map((h) => h.block).filter((b) => b && !std.includes(b)))).sort()
    return [...std, ...extra]
  }, [houses])

  // Filtered & Sorted Houses
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        (h.house_number && h.house_number.toLowerCase().includes(q)) ||
        (h.owner_name && h.owner_name.toLowerCase().includes(q)) ||
        (h.block && h.block.toLowerCase().includes(q)) ||
        (Array.isArray(h.family_members) && h.family_members.some(fm => (fm.name && fm.name.toLowerCase().includes(q)) || (fm.relation && fm.relation.toLowerCase().includes(q))))

      const matchBlock = blockFilter === 'ALL' || h.block === blockFilter
      const matchStatus =
        statusFilter === 'ALL'
          ? true
          : statusFilter === 'ACTIVE'
          ? h.status === 'Active' || h.status === 'C'
          : h.status === 'NC' || h.status === 'Inactive'

      return matchSearch && matchBlock && matchStatus
    }).sort((a, b) => {
      const numA = parseInt(a.house_number) || 0
      const numB = parseInt(b.house_number) || 0
      if (numA !== numB) return numA - numB
      return (a.house_number || '').localeCompare(b.house_number || '')
    })
  }, [houses, search, blockFilter, statusFilter])

  const totalCount = houses.length
  const activeCount = houses.filter((h) => h.status === 'Active' || h.status === 'C').length
  const ncCount = houses.filter((h) => h.status === 'NC' || h.status === 'Inactive').length

  return (
    <div>
      {/* Top Bar */}
      <div className="admin-topbar">
        <div>
          <span className="admin-topbar-title">🏠 House & Resident Management</span>
        </div>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>
          + Add House
        </button>
      </div>

      <div className="admin-content">
        {/* Stats Row */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 20 }}>
          <div className="stat-card" style={{ flex: 1, minWidth: 160, padding: 14, background: '#111827', borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
            <div style={{ fontSize: 12, color: '#9ca3af', fontWeight: 600 }}>Total Houses</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f9fafb', marginTop: 4 }}>{totalCount}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 160, padding: 14, background: '#111827', borderRadius: 10, border: '1px solid rgba(52,211,153,0.2)' }}>
            <div style={{ fontSize: 12, color: '#34d399', fontWeight: 600 }}>Connected (Active)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#34d399', marginTop: 4 }}>{activeCount}</div>
          </div>
          <div className="stat-card" style={{ flex: 1, minWidth: 160, padding: 14, background: '#111827', borderRadius: 10, border: '1px solid rgba(248,113,113,0.2)' }}>
            <div style={{ fontSize: 12, color: '#f87171', fontWeight: 600 }}>Non-Connected (NC)</div>
            <div style={{ fontSize: 24, fontWeight: 800, color: '#f87171', marginTop: 4 }}>{ncCount}</div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center', background: '#111827', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)' }}>
          <div style={{ flex: 1, minWidth: 220 }}>
            <input
              type="text"
              placeholder="🔍 Search House No, Owner / Resident Name (English / മലയാളം), Block..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="form-control"
              style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Block:</span>
            <select
              value={blockFilter}
              onChange={(e) => setBlockFilter(e.target.value)}
              className="form-control"
              style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', minWidth: 140 }}
            >
              <option value="ALL">All Blocks ({totalCount})</option>
              {allBlocks.map((b) => (
                <option key={b} value={b}>{b}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 13, color: '#9ca3af' }}>Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="form-control"
              style={{ background: '#1f2937', color: '#fff', border: '1px solid #374151', width: 140 }}
            >
              <option value="ALL">All Status</option>
              <option value="ACTIVE">Connected (Active)</option>
              <option value="NC">Non-Connected (NC)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: 4, background: '#1f2937', padding: 3, borderRadius: 8, border: '1px solid #374151', marginLeft: 'auto' }}>
            <button
              onClick={() => setViewMode('plaque')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'plaque' ? '#d49856' : 'transparent',
                color: viewMode === 'plaque' ? '#1a0b04' : '#9ca3af',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              🏷️ Plaque Cards
            </button>
            <button
              onClick={() => setViewMode('table')}
              style={{
                padding: '6px 12px',
                borderRadius: 6,
                border: 'none',
                background: viewMode === 'table' ? '#3b82f6' : 'transparent',
                color: viewMode === 'table' ? '#ffffff' : '#9ca3af',
                fontWeight: 800,
                fontSize: 12,
                cursor: 'pointer',
              }}
            >
              📊 Table List
            </button>
          </div>

          {(search || blockFilter !== 'ALL' || statusFilter !== 'ALL') && (
            <button
              onClick={() => { setSearch(''); setBlockFilter('ALL'); setStatusFilter('ALL') }}
              className="btn btn-secondary btn-sm"
              style={{ height: 38 }}
            >
              Reset Filters
            </button>
          )}
        </div>

        {/* Houses Display: Plaque View or Table View */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#9ca3af' }}>
            <div className="spinner" style={{ margin: '0 auto 10px' }} />
            Loading House Records...
          </div>
        ) : filteredHouses.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', background: '#111827', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <span style={{ fontSize: 40 }}>🏠</span>
            <p style={{ marginTop: 12, color: '#9ca3af' }}>No house records found matching filter.</p>
          </div>
        ) : viewMode === 'plaque' ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
            gap: 20,
          }}>
            {filteredHouses.map((h) => {
              const id = h._id || h.id
              return (
                <FnraHousePlaque
                  key={id}
                  house={h}
                  onClick={() => openEdit(h)}
                  actions={
                    <>
                      <button
                        onClick={(e) => { e.stopPropagation(); openEdit(h) }}
                        style={{
                          background: 'rgba(50, 24, 10, 0.85)',
                          color: '#fef3c7',
                          border: '1px solid #7c4019',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(id) }}
                        disabled={deletingId === id}
                        style={{
                          background: '#991b1b',
                          color: '#ffffff',
                          border: '1px solid #f87171',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        {deletingId === id ? '...' : '🗑️ Delete'}
                      </button>
                    </>
                  }
                />
              )
            })}
          </div>
        ) : (
          <div style={{ overflowX: 'auto', background: '#111827', borderRadius: 12, border: '1px solid rgba(255,255,255,0.08)' }}>
            <table className="admin-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#1f2937', textAlign: 'left', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>HOUSE #</th>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>BLOCK</th>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>RESIDENT / OWNER NAME</th>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>STATUS</th>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700 }}>FAMILY MEMBERS</th>
                  <th style={{ padding: '12px 16px', color: '#9ca3af', fontSize: 12, fontWeight: 700, textAlign: 'right' }}>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredHouses.map((h) => {
                  const isNc = h.status === 'NC' || h.status === 'Inactive'
                  const id = h._id || h.id
                  return (
                    <tr key={id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                      <td style={{ padding: '14px 16px', fontWeight: 800, color: '#f3f4f6', fontSize: 15 }}>
                        <span style={{ padding: '3px 8px', borderRadius: 6, background: 'rgba(56,189,248,0.15)', color: '#38bdf8', border: '1px solid rgba(56,189,248,0.3)' }}>
                          #{h.house_number}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 13 }}>
                        {h.block}
                      </td>
                      <td style={{ padding: '14px 16px', fontWeight: 600, color: '#ffffff', fontSize: 14 }}>
                        {h.owner_name}
                      </td>
                      <td style={{ padding: '14px 16px' }}>
                        <span
                          style={{
                            padding: '3px 10px',
                            borderRadius: 12,
                            fontSize: 12,
                            fontWeight: 700,
                            background: isNc ? 'rgba(239,68,68,0.15)' : 'rgba(52,211,153,0.15)',
                            color: isNc ? '#f87171' : '#34d399',
                            border: `1px solid ${isNc ? 'rgba(239,68,68,0.3)' : 'rgba(52,211,153,0.3)'}`,
                          }}
                        >
                          {isNc ? 'Non-Connected (NC)' : 'Connected (Active)'}
                        </span>
                      </td>
                      <td style={{ padding: '14px 16px', color: '#9ca3af', fontSize: 13 }}>
                        {Array.isArray(h.family_members) && h.family_members.length > 0 ? (
                          <span style={{ color: '#a78bfa', fontWeight: 600 }}>
                            👥 {h.family_members.length} member(s)
                          </span>
                        ) : (
                          <span style={{ color: '#6b7280' }}>—</span>
                        )}
                      </td>
                      <td style={{ padding: '14px 16px', textAlign: 'right' }}>
                        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
                          <button
                            onClick={() => openEdit(h)}
                            className="btn btn-secondary btn-sm"
                            title="Edit House"
                          >
                            ✏️ Edit
                          </button>
                          <button
                            onClick={() => handleDelete(id)}
                            disabled={deletingId === id}
                            className="btn btn-danger btn-sm"
                            title="Delete House"
                          >
                            {deletingId === id ? '...' : '🗑️ Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add / Edit Modal */}
      {showModal && (
        <div className="modal-backdrop" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 580 }}>
            <div className="modal-header">
              <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>
                {editing ? `✏️ Edit House #${editing.house_number}` : '🏠 Add New House'}
              </h3>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {error && (
                  <div style={{ padding: 10, borderRadius: 8, background: 'rgba(239,68,68,0.15)', color: '#f87171', border: '1px solid rgba(239,68,68,0.3)', fontSize: 13 }}>
                    ⚠️ {error}
                  </div>
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                  <div>
                    <label className="form-label" style={{ color: '#9ca3af', fontSize: 13 }}>House Number *</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. 102 or 201"
                      value={form.house_number}
                      onChange={(e) => setForm({ ...form, house_number: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ color: '#9ca3af', fontSize: 13 }}>Block / Location *</label>
                    <select
                      className="form-control"
                      value={form.block}
                      onChange={(e) => setForm({ ...form, block: e.target.value })}
                    >
                      {allBlocks.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ color: '#9ca3af', fontSize: 13 }}>Owner / Resident Name *</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Jyothi (ജ്യോതി)"
                    value={form.owner_name}
                    onChange={(e) => setForm({ ...form, owner_name: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <label className="form-label" style={{ color: '#9ca3af', fontSize: 13 }}>Connection Status</label>
                  <select
                    className="form-control"
                    value={form.status}
                    onChange={(e) => setForm({ ...form, status: e.target.value })}
                  >
                    <option value="Active">Connected (Active)</option>
                    <option value="NC">Non-Connected (NC)</option>
                  </select>
                </div>

                {/* Family Members Sub-section */}
                <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <label className="form-label" style={{ color: '#a78bfa', fontSize: 14, margin: 0, fontWeight: 700 }}>
                      👥 Family Members ({form.family_members.length})
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddFamily(!showAddFamily)}
                      className="btn btn-secondary btn-sm"
                      style={{ fontSize: 12 }}
                    >
                      {showAddFamily ? 'Cancel' : '+ Add Family Member'}
                    </button>
                  </div>

                  {/* List Existing Family Members */}
                  {form.family_members.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
                      {form.family_members.map((m, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '8px 12px',
                            background: '#1f2937',
                            borderRadius: 8,
                            fontSize: 13,
                            border: '1px solid rgba(255,255,255,0.05)',
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 600, color: '#fff' }}>{m.name}</span>
                            <span style={{ color: '#9ca3af', marginLeft: 8 }}>({m.relation})</span>
                            {m.phone && <span style={{ color: '#38bdf8', marginLeft: 8 }}>📞 {m.phone}</span>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFamilyMember(idx)}
                            style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 14 }}
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Add Family Member Form */}
                  {showAddFamily && (
                    <div style={{ background: '#1f2937', padding: 12, borderRadius: 8, border: '1px solid #374151', display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input
                          type="text"
                          placeholder="Member Name *"
                          className="form-control"
                          value={newFamilyMember.name}
                          onChange={(e) => setNewFamilyMember({ ...newFamilyMember, name: e.target.value })}
                        />
                        <select
                          className="form-control"
                          value={newFamilyMember.relation}
                          onChange={(e) => setNewFamilyMember({ ...newFamilyMember, relation: e.target.value })}
                        >
                          <option value="Spouse">Spouse</option>
                          <option value="Child">Child</option>
                          <option value="Parent">Parent</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                        <input
                          type="text"
                          placeholder="Phone (Optional)"
                          className="form-control"
                          value={newFamilyMember.phone}
                          onChange={(e) => setNewFamilyMember({ ...newFamilyMember, phone: e.target.value })}
                        />
                        <input
                          type="text"
                          placeholder="Blood Group (Optional)"
                          className="form-control"
                          value={newFamilyMember.blood_group}
                          onChange={(e) => setNewFamilyMember({ ...newFamilyMember, blood_group: e.target.value })}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={addFamilyMember}
                        className="btn btn-primary btn-sm"
                        style={{ alignSelf: 'flex-end', marginTop: 4 }}
                      >
                        Add to List
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="btn btn-primary"
                >
                  {saving ? 'Saving...' : editing ? 'Save Changes' : 'Create House'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
