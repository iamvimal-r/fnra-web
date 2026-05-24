import { useEffect, useState } from 'react'
import { housesApi, API } from '../../api'

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
]

export default function ManageReports({ token }) {
  const [year, setYear] = useState(new Date().getFullYear())
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [exporting, setExporting] = useState(false)
  const [filter, setFilter] = useState('all') // 'all' | 'paid' | 'unpaid'
  const [search, setSearch] = useState('')
  const [blockFilter, setBlockFilter] = useState('All')

  // Financial statistics state
  const [stats, setStats] = useState({
    totalPaid: 0,
    totalPending: 0,
    totalHouses: 0,
    collectionRate: 0
  })

  const loadReportData = async (targetYear) => {
    try {
      setLoading(true)
      const res = await housesApi.getMonthlyReport(targetYear, token)
      setData(res)
      calculateStats(res)
    } catch (err) {
      console.error('Failed to fetch reports:', err)
    } finally {
      setLoading(false)
    }
  }

  const calculateStats = (reportItems) => {
    let paidSum = 0
    let pendingSum = 0

    reportItems.forEach(item => {
      MONTHS.forEach(m => {
        const monthData = item.months[m]
        if (monthData) {
          if (monthData.status === 'Paid') {
            paidSum += monthData.amount
          } else {
            pendingSum += monthData.amount
          }
        } else {
          // Default pending fee is 50
          pendingSum += 50
        }
      })
    })

    const total = paidSum + pendingSum
    const rate = total > 0 ? Math.round((paidSum / total) * 100) : 0

    setStats({
      totalPaid: paidSum,
      totalPending: pendingSum,
      totalHouses: reportItems.length,
      collectionRate: rate
    })
  }

  useEffect(() => {
    loadReportData(year)
  }, [year])

  const getHousePendingAmount = (item) => {
    let pending = 0
    MONTHS.forEach(m => {
      const monthData = item.months[m]
      if (!monthData || monthData.status !== 'Paid') {
        pending += monthData ? monthData.amount : 50
      }
    })
    return pending
  }

  const handleExportPDF = async () => {
    try {
      setExporting(true)
      const res = await fetch(`${API}/houses/list/pdf?year=${year}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      if (!res.ok) throw new Error('Failed to generate PDF')
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `fnra_houses_list_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert(err.message || 'An error occurred during PDF generation.')
    } finally {
      setExporting(false)
    }
  }

  const handleYearChange = (dir) => {
    setYear(y => y + (dir === 'prev' ? -1 : 1))
  }

  // Get unique blocks for filter dropdown
  const blocks = ['All', ...new Set(data.map(item => item.block).filter(Boolean))]

  const filteredData = data.filter(item => {
    const pendingAmount = getHousePendingAmount(item)
    
    // Status Filter
    if (filter === 'paid' && pendingAmount > 0) return false
    if (filter === 'unpaid' && pendingAmount === 0) return false

    // Block Filter
    if (blockFilter !== 'All' && item.block !== blockFilter) return false

    // Search filter
    const matchesSearch = item.house_number.toLowerCase().includes(search.toLowerCase()) ||
                          (item.owner_name && item.owner_name.toLowerCase().includes(search.toLowerCase()))
    
    return matchesSearch
  })

  return (
    <div>
      <div className="admin-topbar">
        <span className="admin-topbar-title">📁 House Directory & Reports</span>
        <button 
          className="btn btn-primary btn-sm" 
          onClick={handleExportPDF}
          disabled={exporting || loading}
        >
          📥 {exporting ? 'Generating PDF...' : 'Download House List'}
        </button>
      </div>

      <div className="admin-content">
        {/* Year Selector */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 24, marginBottom: 28 }}>
          <button 
            className="btn btn-outline" 
            style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, justifyContent: 'center' }} 
            onClick={() => handleYearChange('prev')}
          >
            ◀
          </button>
          <span style={{ fontSize: 24, fontWeight: 900, color: 'var(--gold2)', minWidth: 80, textAlign: 'center' }}>
            {year}
          </span>
          <button 
            className="btn btn-outline" 
            style={{ borderRadius: '50%', width: 40, height: 40, padding: 0, justifyContent: 'center' }} 
            onClick={() => handleYearChange('next')}
          >
            ▶
          </button>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          <div className="stat-card" style={{ borderColor: 'var(--green)33' }}>
            <span className="stat-card-icon">💸</span>
            <span className="stat-card-value" style={{ color: 'var(--green)' }}>
              ₹{stats.totalPaid.toLocaleString('en-IN')}
            </span>
            <span className="stat-card-label">Collected</span>
          </div>

          <div className="stat-card" style={{ borderColor: 'var(--red)33' }}>
            <span className="stat-card-icon">⏳</span>
            <span className="stat-card-value" style={{ color: 'var(--red)' }}>
              ₹{stats.totalPending.toLocaleString('en-IN')}
            </span>
            <span className="stat-card-label">Pending Dues</span>
          </div>

          <div className="stat-card" style={{ borderColor: 'var(--purple)33' }}>
            <span className="stat-card-icon">📈</span>
            <span className="stat-card-value" style={{ color: 'var(--purple)' }}>
              {stats.collectionRate}%
            </span>
            <span className="stat-card-label">Collection Rate</span>
          </div>
        </div>

        {/* Tab Filters and Search */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 24, alignItems: 'center', flexWrap: 'wrap' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', background: 'rgba(255,255,255,0.03)', padding: 4, borderRadius: 10, border: '1px solid var(--border)' }}>
            {['all', 'paid', 'unpaid'].map(tab => (
              <button
                key={tab}
                className="btn btn-sm"
                style={{
                  background: filter === tab ? 'var(--gold)' : 'transparent',
                  color: filter === tab ? '#fff' : 'var(--gray)',
                  borderRadius: 8,
                  boxShadow: 'none'
                }}
                onClick={() => setFilter(tab)}
              >
                {tab.toUpperCase()}
              </button>
            ))}
          </div>

          {/* Block filter */}
          <div>
            <select 
              className="form-input form-select"
              style={{ minWidth: 140 }}
              value={blockFilter}
              onChange={e => setBlockFilter(e.target.value)}
            >
              {blocks.map(b => <option key={b} value={b}>Block {b}</option>)}
            </select>
          </div>

          {/* Search bar */}
          <div style={{ flex: 1, minWidth: 200 }}>
            <input 
              type="text" 
              className="form-input" 
              style={{ width: '100%' }}
              placeholder="Search house number or owner..." 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
            />
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <p>Loading reports data...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📁</div>
            <p>No matching house records found.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>House Number</th>
                <th>Block</th>
                <th>Owner Name</th>
                <th>Status</th>
                <th>Payment Status</th>
                <th>Dues Rate</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map(item => {
                const pending = getHousePendingAmount(item)
                const isPaid = pending === 0
                const houseActive = (item.status || 'Active').toLowerCase() === 'active'
                
                return (
                  <tr key={item.house_id}>
                    <td style={{ fontWeight: 800 }}>{item.house_number}</td>
                    <td>
                      <span className="badge badge-notice">Block {item.block}</span>
                    </td>
                    <td style={{ fontWeight: 600 }}>{item.owner_name || '—'}</td>
                    <td>
                      <span className={`badge ${houseActive ? 'badge-facility' : 'badge-general'}`}>
                        {item.status || 'Active'}
                      </span>
                    </td>
                    <td>
                      <span 
                        className="badge" 
                        style={{
                          backgroundColor: isPaid ? 'rgba(16,185,129,0.12)' : 'rgba(239,68,68,0.12)',
                          color: isPaid ? 'var(--green)' : 'var(--red)',
                          border: `1px solid ${isPaid ? 'rgba(16,185,129,0.3)' : 'rgba(239,68,68,0.3)'}`
                        }}
                      >
                        {isPaid ? 'Paid' : `₹${pending.toLocaleString()} Due`}
                      </span>
                    </td>
                    <td style={{ color: 'var(--gray)', fontSize: 13 }}>
                      ₹{item.association_fee || 50}/month
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
