import { useEffect, useState } from 'react'
import { incomesApi } from '../../api'

const CATEGORIES = ['Rentals', 'Donations', 'Advertising', 'Interest', 'Other']
const EMPTY = { title: '', amount: '', category: CATEGORIES[0], income_date: '', description: '' }

export default function ManageIncomes({ token }) {
  const [incomes, setIncomes] = useState([])
  const [totalIncomes, setTotalIncomes] = useState(0)
  const [categoryBreakdown, setCategoryBreakdown] = useState({})
  const [loading, setLoading] = useState(true)

  // Modal states
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState(EMPTY)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState(null)

  // Search/Filter state
  const [search, setSearch] = useState('')
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState('All')

  const getTodayString = () => {
    const today = new Date()
    const yyyy = today.getFullYear()
    const mm = String(today.getMonth() + 1).padStart(2, '0')
    const dd = String(today.getDate()).padStart(2, '0')
    return `${yyyy}-${mm}-${dd}`
  }

  const load = async () => {
    try {
      setLoading(true)
      const [listData, summaryData] = await Promise.all([
        incomesApi.list(token),
        incomesApi.getSummary(token)
      ])
      setIncomes(listData)
      setTotalIncomes(summaryData.total_amount)

      const breakdown = {}
      summaryData.by_category.forEach((item) => {
        breakdown[item.category] = item.amount
      })
      setCategoryBreakdown(breakdown)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load()
  }, [])

  const openAdd = () => {
    setEditing(null)
    setForm({ ...EMPTY, income_date: getTodayString() })
    setError('')
    setShowModal(true)
  }

  const openEdit = (inc) => {
    setEditing(inc)
    setForm({
      title: inc.title,
      amount: String(inc.amount),
      category: inc.category,
      income_date: inc.income_date,
      description: inc.description || ''
    })
    setError('')
    setShowModal(true)
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!form.title.trim()) { setError('Title is required.'); return }
    const parsedAmount = parseFloat(form.amount)
    if (isNaN(parsedAmount) || parsedAmount <= 0) { setError('Please enter a valid positive amount.'); return }
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/
    if (!dateRegex.test(form.income_date)) { setError('Please enter date in YYYY-MM-DD format.'); return }

    setSaving(true)
    try {
      const payload = {
        title: form.title.trim(),
        amount: parsedAmount,
        category: form.category,
        income_date: form.income_date,
        description: form.description.trim() || undefined
      }

      if (editing) {
        await incomesApi.update(editing._id, payload, token)
      } else {
        await incomesApi.create(payload, token)
      }
      setShowModal(false)
      load()
    } catch (e) {
      setError(e.message || 'Failed to save record')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (inc) => {
    if (!window.confirm(`Are you sure you want to delete "${inc.title}"?`)) return
    setDeleting(inc._id)
    try {
      await incomesApi.delete(inc._id, token)
      load()
    } catch (e) {
      alert('Delete failed: ' + (e.message || 'Unknown error'))
    } finally {
      setDeleting(null)
    }
  }

  const filteredIncomes = incomes.filter(inc => {
    const matchesSearch = inc.title.toLowerCase().includes(search.toLowerCase()) || 
                          (inc.description && inc.description.toLowerCase().includes(search.toLowerCase()))
    const matchesCat = selectedCategoryFilter === 'All' || inc.category === selectedCategoryFilter
    return matchesSearch && matchesCat
  })

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">💰 Other Incomes</span>
        <button className="btn btn-primary btn-sm" onClick={openAdd}>+ Add Income</button>
      </div>

      <div className="admin-content">
        {/* Stats Summary Panel */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderColor: 'var(--green)33' }}>
            <span className="stat-card-icon">💰</span>
            <span className="stat-card-value" style={{ color: 'var(--green)' }}>
              ₹{totalIncomes.toLocaleString('en-IN')}
            </span>
            <span className="stat-card-label">Total Other Income</span>
          </div>

          {CATEGORIES.map(cat => {
            const amt = categoryBreakdown[cat] || 0
            return (
              <div key={cat} className="stat-card" style={{ borderColor: 'var(--border)' }}>
                <span className="stat-card-icon">💼</span>
                <span className="stat-card-value" style={{ fontSize: 20 }}>
                  ₹{amt.toLocaleString('en-IN')}
                </span>
                <span className="stat-card-label">{cat}</span>
              </div>
            )
          })}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 20, alignItems: 'center', flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 200 }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ width: '100%' }}
              placeholder="Search other incomes..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
          <div>
            <select 
              className="form-input form-select" 
              style={{ minWidth: 160 }}
              value={selectedCategoryFilter} 
              onChange={e => setSelectedCategoryFilter(e.target.value)}
            >
              <option value="All">All Categories</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <p>Loading incomes...</p>
          </div>
        ) : filteredIncomes.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <p>No other incomes found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Title</th>
                <th>Category</th>
                <th>Amount</th>
                <th>Date</th>
                <th>Description</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredIncomes.map(inc => (
                <tr key={inc._id}>
                  <td style={{ fontWeight: 600 }}>{inc.title}</td>
                  <td>
                    <span className="badge badge-facility">{inc.category}</span>
                  </td>
                  <td style={{ color: 'var(--green)', fontWeight: 700 }}>
                    ₹{inc.amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ color: 'var(--gray)' }}>
                    {new Date(inc.income_date).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </td>
                  <td style={{ color: 'var(--gray)', fontSize: 13, maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {inc.description || '—'}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button className="btn btn-outline btn-sm" onClick={() => openEdit(inc)} disabled={deleting === inc._id}>✏ Edit</button>
                      <button
                        className="btn btn-danger btn-sm"
                        onClick={() => handleDelete(inc)}
                        disabled={deleting === inc._id}
                        style={{ minWidth: 52, opacity: deleting === inc._id ? 0.6 : 1 }}
                      >
                        {deleting === inc._id ? '…' : '🗑 Del'}
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
              <h2 className="modal-title">{editing ? 'Edit Income' : 'Add Income'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>✕</button>
            </div>
            {error && <div className="login-error">⚠ {error}</div>}
            <form onSubmit={handleSave} className="admin-form">
              <div className="form-group">
                <label className="form-label">Title *</label>
                <input 
                  className="form-input" 
                  value={form.title} 
                  onChange={e => setForm(f => ({...f, title: e.target.value}))} 
                  placeholder="e.g. Community Hall Rental" 
                  required 
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Amount (₹) *</label>
                  <input 
                    className="form-input" 
                    type="number" 
                    step="0.01" 
                    value={form.amount} 
                    onChange={e => setForm(f => ({...f, amount: e.target.value}))} 
                    placeholder="0.00" 
                    required 
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">Category *</label>
                  <select 
                    className="form-input form-select" 
                    value={form.category} 
                    onChange={e => setForm(f => ({...f, category: e.target.value}))}
                  >
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">Date (YYYY-MM-DD) *</label>
                <input 
                  className="form-input" 
                  value={form.income_date} 
                  onChange={e => setForm(f => ({...f, income_date: e.target.value}))} 
                  placeholder="YYYY-MM-DD" 
                  required 
                />
              </div>
              <div className="form-group">
                <label className="form-label">Description (optional)</label>
                <textarea 
                  className="form-input form-textarea" 
                  value={form.description} 
                  onChange={e => setForm(f => ({...f, description: e.target.value}))} 
                  placeholder="Enter additional details..." 
                />
              </div>
              <div className="form-actions">
                <button type="button" className="btn btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Saving…' : editing ? 'Save Changes' : 'Add Income'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
