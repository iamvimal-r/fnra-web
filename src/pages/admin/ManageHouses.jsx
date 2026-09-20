import { useEffect, useState, useMemo } from 'react'
import { housesApi } from '../../api'
import FnraHousePlaque from '../../components/FnraHousePlaque'

const BLOCKS = ['Block A', 'Block B']

const EMPTY_HOUSE = {
  house_number: '',
  house_name: '',
  block: 'Block A',
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

  // Payment Modal State
  const [showPaymentModal, setShowPaymentModal] = useState(false)
  const [paymentHouse, setPaymentHouse] = useState(null)
  const [paymentHistory, setPaymentHistory] = useState([])
  const [paymentYear, setPaymentYear] = useState(new Date().getFullYear())
  const [loadingPayment, setLoadingPayment] = useState(false)
  const [selectedMonths, setSelectedMonths] = useState([])
  const [savingPayment, setSavingPayment] = useState(false)

  const loadHouses = async () => {
    setLoading(true)
    try {
      let data
      if (token) {
        try {
          data = await housesApi.list(token)
        } catch (e) {
          data = await housesApi.listPublic()
        }
      } else {
        data = await housesApi.listPublic()
      }
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
      house_name: h.house_name || '',
      block: h.block || 'Block A',
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
        house_name: form.house_name.trim(),
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
      const msg = err.message || 'Failed to save house.'
      setError(msg.includes('Not authenticated') ? 'Session expired or not authenticated. Please log in again.' : msg)
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

  // Payment Module Handlers
  const openPaymentModal = async (house) => {
    setPaymentHouse(house)
    setShowPaymentModal(true)
    setSelectedMonths([])
    await fetchHousePayments(house._id || house.id)
  }

  const fetchHousePayments = async (houseId) => {
    setLoadingPayment(true)
    try {
      const history = await housesApi.getRentHistory(houseId, token)
      setPaymentHistory(history || [])
    } catch (err) {
      console.error('Failed to fetch payment history:', err)
      setPaymentHistory([])
    } finally {
      setLoadingPayment(false)
    }
  }

  const handleToggleMonthPaid = async (month, currentStatus) => {
    if (!paymentHouse) return
    const houseId = paymentHouse._id || paymentHouse.id
    setSavingPayment(true)
    try {
      const newStatus = currentStatus === 'Paid' ? 'Pending' : 'Paid'
      await housesApi.addRent(houseId, {
        month,
        year: paymentYear,
        amount: 50.0,
        status: newStatus
      }, token)
      await fetchHousePayments(houseId)
      loadHouses()
    } catch (err) {
      alert('Failed to update payment: ' + err.message)
    } finally {
      setSavingPayment(false)
    }
  }

  const handleBulkCollectPayment = async () => {
    if (!paymentHouse || selectedMonths.length === 0) return
    const houseId = paymentHouse._id || paymentHouse.id
    setSavingPayment(true)
    try {
      for (const month of selectedMonths) {
        await housesApi.addRent(houseId, {
          month,
          year: paymentYear,
          amount: 50.0,
          status: 'Paid'
        }, token)
      }
      setSelectedMonths([])
      await fetchHousePayments(houseId)
      loadHouses()
    } catch (err) {
      alert('Bulk payment error: ' + err.message)
    } finally {
      setSavingPayment(false)
    }
  }

  const handleDeletePaymentRecord = async (rentId) => {
    if (!window.confirm('Delete this payment transaction entry?')) return
    try {
      await housesApi.deleteRent(rentId, token)
      if (paymentHouse) {
        await fetchHousePayments(paymentHouse._id || paymentHouse.id)
        loadHouses()
      }
    } catch (err) {
      alert('Failed to delete payment record: ' + err.message)
    }
  }

  const toggleSelectMonth = (month) => {
    setSelectedMonths(prev => 
      prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]
    )
  }

  const selectAllUnpaid = () => {
    const MONTHS_LIST = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
    const yearRecords = paymentHistory.filter(r => r.year === paymentYear)
    const unpaid = MONTHS_LIST.filter(m => {
      const rec = yearRecords.find(r => r.month === m)
      return !rec || rec.status !== 'Paid'
    })
    setSelectedMonths(unpaid)
  }

  // Dynamic block list from houses data
  const allBlocks = useMemo(() => {
    const std = ['Block A', 'Block B']
    const extra = Array.from(new Set((houses || []).map((h) => h.block).filter((b) => b && !std.includes(b)))).sort()
    return [...std, ...extra]
  }, [houses])

  // Available block options inside modal (ensures form.block is always included)
  const modalBlockOptions = useMemo(() => {
    const std = ['Block A', 'Block B']
    const dbBlocks = (houses || []).map((h) => h.block).filter(Boolean)
    const currentBlock = form.block ? [form.block] : []
    return Array.from(new Set([...std, ...dbBlocks, ...currentBlock])).sort()
  }, [houses, form.block])

  // Filtered & Sorted Houses
  const filteredHouses = useMemo(() => {
    return houses.filter((h) => {
      const q = search.toLowerCase().trim()
      const matchSearch =
        !q ||
        (h.house_number && h.house_number.toLowerCase().includes(q)) ||
        (h.house_name && h.house_name.toLowerCase().includes(q)) ||
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
                        onClick={(e) => { e.stopPropagation(); openPaymentModal(h) }}
                        style={{
                          background: 'rgba(16, 185, 129, 0.2)',
                          color: '#34d399',
                          border: '1px solid #059669',
                          borderRadius: 6,
                          padding: '4px 10px',
                          fontSize: 11,
                          fontWeight: 800,
                          cursor: 'pointer',
                        }}
                      >
                        💳 Payments
                      </button>
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
                            onClick={() => openPaymentModal(h)}
                            className="btn btn-sm"
                            style={{ background: 'rgba(16, 185, 129, 0.2)', color: '#34d399', border: '1px solid #059669', fontSize: 12, fontWeight: 700 }}
                            title="Manage Monthly Payments"
                          >
                            💳 Payments
                          </button>
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
                      value={form.block || 'Block A'}
                      onChange={(e) => setForm((prev) => ({ ...prev, block: e.target.value }))}
                    >
                      {modalBlockOptions.map((b) => (
                        <option key={b} value={b}>{b}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="form-label" style={{ color: '#9ca3af', fontSize: 13 }}>House Name (വീട്ടുപേര് / Residence Name)</label>
                  <input
                    type="text"
                    className="form-control"
                    placeholder="e.g. Devi Nandhanam (ദേവി നന്ദനം), Aadhi, Thiruvanam"
                    value={form.house_name}
                    onChange={(e) => setForm({ ...form, house_name: e.target.value })}
                  />
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
      {/* House Payment Module & List Popup Modal */}
      {showPaymentModal && paymentHouse && (
        <div className="modal-backdrop" onClick={() => setShowPaymentModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 760, maxHeight: '92vh', overflowY: 'auto' }}>
            {/* Modal Header */}
            <div className="modal-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: 12 }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontSize: 16, fontWeight: 900, color: '#38bdf8', background: 'rgba(56,189,248,0.15)', padding: '2px 10px', borderRadius: 8, border: '1px solid rgba(56,189,248,0.3)' }}>
                    #{paymentHouse.house_number}
                  </span>
                  <h3 style={{ margin: 0, fontSize: 18, color: '#fff' }}>
                    {paymentHouse.owner_name} {paymentHouse.house_name ? `(${paymentHouse.house_name})` : ''}
                  </h3>
                </div>
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  📍 {paymentHouse.block} • Monthly Maintenance Fee: ₹50 / month
                </div>
              </div>

              {/* Year Switcher */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, background: '#1f2937', padding: '4px 12px', borderRadius: 20, border: '1px solid #374151' }}>
                <button
                  type="button"
                  onClick={() => setPaymentYear(y => y - 1)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}
                >
                  ◀
                </button>
                <span style={{ color: '#fbbf24', fontWeight: 900, fontSize: 15 }}>{paymentYear}</span>
                <button
                  type="button"
                  onClick={() => setPaymentYear(y => y + 1)}
                  style={{ background: 'none', border: 'none', color: '#38bdf8', fontSize: 14, cursor: 'pointer', fontWeight: 800 }}
                >
                  ▶
                </button>
              </div>

              <button className="modal-close" onClick={() => setShowPaymentModal(false)}>✕</button>
            </div>

            <div className="modal-body" style={{ padding: '16px 0', display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Financial Summary */}
              {(() => {
                const MONTHS_LIST = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
                const yearRecords = paymentHistory.filter(r => r.year === paymentYear)
                const paidMonths = yearRecords.filter(r => r.status === 'Paid').map(r => r.month)
                const paidCount = paidMonths.length
                const paidAmount = paidCount * 50
                const pendingCount = 12 - paidCount
                const pendingAmount = pendingCount * 50

                return (
                  <div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                      <div style={{ background: '#1f2937', padding: 12, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#9ca3af', fontWeight: 600 }}>Total Annual Fee</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#f3f4f6', marginTop: 2 }}>₹600</div>
                        <div style={{ fontSize: 11, color: '#6b7280' }}>12 months × ₹50</div>
                      </div>
                      <div style={{ background: 'rgba(52,211,153,0.1)', padding: 12, borderRadius: 10, border: '1px solid rgba(52,211,153,0.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#34d399', fontWeight: 600 }}>Collected Paid</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#34d399', marginTop: 2 }}>₹{paidAmount}</div>
                        <div style={{ fontSize: 11, color: '#a7f3d0' }}>{paidCount} / 12 Months</div>
                      </div>
                      <div style={{ background: 'rgba(248,113,113,0.1)', padding: 12, borderRadius: 10, border: '1px solid rgba(248,113,113,0.3)', textAlign: 'center' }}>
                        <div style={{ fontSize: 11, color: '#f87171', fontWeight: 600 }}>Pending Dues</div>
                        <div style={{ fontSize: 20, fontWeight: 900, color: '#f87171', marginTop: 2 }}>₹{pendingAmount}</div>
                        <div style={{ fontSize: 11, color: '#fca5a5' }}>{pendingCount} Months Due</div>
                      </div>
                    </div>

                    {/* Bulk Actions Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1f2937', padding: '10px 14px', borderRadius: 10, border: '1px solid #374151', marginTop: 14 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <button
                          type="button"
                          onClick={selectAllUnpaid}
                          style={{ background: '#374151', color: '#e5e7eb', border: '1px solid #4b5563', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                        >
                          Select All Unpaid ({pendingCount})
                        </button>
                        {selectedMonths.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setSelectedMonths([])}
                            style={{ background: 'none', border: 'none', color: '#9ca3af', fontSize: 12, cursor: 'pointer', textDecoration: 'underline' }}
                          >
                            Clear ({selectedMonths.length})
                          </button>
                        )}
                      </div>

                      {selectedMonths.length > 0 && (
                        <button
                          type="button"
                          onClick={handleBulkCollectPayment}
                          disabled={savingPayment}
                          style={{
                            background: 'linear-gradient(135deg, #10b981, #059669)',
                            color: '#ffffff',
                            border: 'none',
                            padding: '6px 14px',
                            borderRadius: 8,
                            fontSize: 13,
                            fontWeight: 800,
                            cursor: 'pointer',
                            boxShadow: '0 4px 12px rgba(16,185,129,0.3)',
                          }}
                        >
                          {savingPayment ? 'Processing...' : `✓ Collect Selected (${selectedMonths.length} Months • ₹${selectedMonths.length * 50})`}
                        </button>
                      )}
                    </div>

                    {/* 12 Months Grid */}
                    <div style={{ marginTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#e5e7eb', marginBottom: 10 }}>
                        🗓️ {paymentYear} Monthly Fee Checklist (₹50/Month)
                      </div>

                      {loadingPayment ? (
                        <div style={{ textAlign: 'center', padding: '30px 0', color: '#9ca3af' }}>
                          Loading monthly payment records...
                        </div>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 10 }}>
                          {MONTHS_LIST.map((m) => {
                            const rec = yearRecords.find(r => r.month === m)
                            const isPaid = rec && rec.status === 'Paid'
                            const isSelected = selectedMonths.includes(m)

                            return (
                              <div
                                key={m}
                                style={{
                                  background: isPaid ? 'rgba(52,211,153,0.08)' : isSelected ? 'rgba(56,189,248,0.12)' : '#1f2937',
                                  border: `1px solid ${isPaid ? 'rgba(52,211,153,0.3)' : isSelected ? '#38bdf8' : 'rgba(255,255,255,0.08)'}`,
                                  borderRadius: 10,
                                  padding: 10,
                                  display: 'flex',
                                  flexDirection: 'column',
                                  justifyContent: 'space-between',
                                  gap: 8,
                                  transition: 'all 0.2s ease',
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                                    {!isPaid && (
                                      <input
                                        type="checkbox"
                                        checked={isSelected}
                                        onChange={() => toggleSelectMonth(m)}
                                        style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#38bdf8' }}
                                      />
                                    )}
                                    <span style={{ fontWeight: 800, color: '#fff', fontSize: 13 }}>{m}</span>
                                  </div>
                                  <span style={{ fontSize: 12, fontWeight: 800, color: isPaid ? '#34d399' : '#f87171' }}>
                                    ₹50
                                  </span>
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: 6 }}>
                                  <span
                                    style={{
                                      padding: '2px 8px',
                                      borderRadius: 10,
                                      fontSize: 10,
                                      fontWeight: 800,
                                      background: isPaid ? 'rgba(52,211,153,0.2)' : 'rgba(239,68,68,0.2)',
                                      color: isPaid ? '#34d399' : '#f87171',
                                    }}
                                  >
                                    {isPaid ? 'PAID' : 'PENDING'}
                                  </span>

                                  <button
                                    type="button"
                                    onClick={() => handleToggleMonthPaid(m, isPaid ? 'Paid' : 'Pending')}
                                    disabled={savingPayment}
                                    style={{
                                      background: isPaid ? 'rgba(239,68,68,0.15)' : 'rgba(16,185,129,0.2)',
                                      color: isPaid ? '#f87171' : '#34d399',
                                      border: `1px solid ${isPaid ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.4)'}`,
                                      borderRadius: 6,
                                      padding: '3px 8px',
                                      fontSize: 11,
                                      fontWeight: 800,
                                      cursor: 'pointer',
                                    }}
                                  >
                                    {isPaid ? 'Mark Unpaid' : 'Mark Paid'}
                                  </button>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>

                    {/* Payment History Log */}
                    <div style={{ marginTop: 20, borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 14 }}>
                      <div style={{ fontSize: 13, fontWeight: 800, color: '#e5e7eb', marginBottom: 10 }}>
                        📜 Payment Transactions History ({paymentHistory.length})
                      </div>

                      {paymentHistory.length === 0 ? (
                        <div style={{ color: '#6b7280', fontSize: 12, fontStyle: 'italic' }}>
                          No payment records found for this house yet.
                        </div>
                      ) : (
                        <div style={{ overflowX: 'auto', maxHeight: 180, overflowY: 'auto' }}>
                          <table style={{ width: '100%', fontSize: 12, borderCollapse: 'collapse' }}>
                            <thead>
                              <tr style={{ background: '#1f2937', color: '#9ca3af', textAlign: 'left' }}>
                                <th style={{ padding: '6px 10px' }}>Month / Year</th>
                                <th style={{ padding: '6px 10px' }}>Amount</th>
                                <th style={{ padding: '6px 10px' }}>Status</th>
                                <th style={{ padding: '6px 10px' }}>Date</th>
                                <th style={{ padding: '6px 10px', textAlign: 'right' }}>Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {paymentHistory.map((item) => (
                                <tr key={item._id || item.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                                  <td style={{ padding: '6px 10px', fontWeight: 700, color: '#fff' }}>
                                    {item.month} {item.year}
                                  </td>
                                  <td style={{ padding: '6px 10px', color: '#34d399', fontWeight: 700 }}>
                                    ₹{item.amount}
                                  </td>
                                  <td style={{ padding: '6px 10px' }}>
                                    <span style={{ color: item.status === 'Paid' ? '#34d399' : '#f87171', fontWeight: 700 }}>
                                      {item.status}
                                    </span>
                                  </td>
                                  <td style={{ padding: '6px 10px', color: '#9ca3af' }}>
                                    {item.payment_date ? new Date(item.payment_date).toLocaleDateString() : '—'}
                                  </td>
                                  <td style={{ padding: '6px 10px', textAlign: 'right' }}>
                                    <button
                                      type="button"
                                      onClick={() => handleDeletePaymentRecord(item._id || item.id)}
                                      style={{ background: 'none', border: 'none', color: '#f87171', cursor: 'pointer', fontSize: 12 }}
                                      title="Delete payment entry"
                                    >
                                      🗑️
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })()}
            </div>

            <div className="modal-footer" style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: 12 }}>
              <button type="button" className="btn btn-secondary" onClick={() => setShowPaymentModal(false)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
