import { useState } from 'react'
import { authApi } from '../api'

export default function AdminLogin({ onLogin }) {
  const [email, setEmail]     = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')

  const handleSubmit = async e => {
    e.preventDefault()
    setError('')
    if (!email || !password) { setError('Email and password are required.'); return }
    setLoading(true)
    try {
      const data = await authApi.login(email, password)
      if (!data.access_token) throw new Error('Invalid response from server')
      // Decode user info from token payload (base64)
      const payload = JSON.parse(atob(data.access_token.split('.')[1]))
      onLogin(data.access_token, { name: payload.name || email, email: payload.sub, role: payload.role || 'admin' })
    } catch (e) {
      setError(e.message || 'Login failed. Check your credentials.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-page">
      <div className="login-card">
        {/* Logo */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
          <div style={{
            width: 100, height: 100, borderRadius: '50%',
            border: '3px solid #d4a017',
            boxShadow: '0 0 24px rgba(212,160,23,0.4), 0 0 60px rgba(212,160,23,0.1)',
            overflow: 'hidden', background: '#0d1b3e',
          }}>
            <img
              src="/icon.png"
              alt="FNRA"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              onError={e => { e.target.style.display='none'; e.target.parentElement.innerHTML='<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:42px;">🦅</span>' }}
            />
          </div>
        </div>
        <h1 className="login-title">Admin Portal</h1>
        <p className="login-sub">Falcon Nagar Residence Association</p>

        {error && <div className="login-error">⚠ {error}</div>}

        <form onSubmit={handleSubmit} className="admin-form">
          <div className="form-group">
            <label className="form-label">Email Address or Username</label>
            <input
              className="form-input"
              type="text"
              placeholder="admin@fnra.org or admin"
              value={email}
              onChange={e => setEmail(e.target.value)}
              autoComplete="username"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              className="form-input"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoComplete="current-password"
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: '100%', justifyContent: 'center', marginTop: 8, padding: '13px' }}
            disabled={loading}
          >
            {loading ? 'Signing in…' : '🔐 Sign In'}
          </button>
        </form>

        <p style={{ marginTop: 20, textAlign: 'center', fontSize: 12, color: 'var(--gray)' }}>
          <a href="/" style={{ color: 'var(--gold)' }}>← Back to Website</a>
        </p>
      </div>
    </div>
  )
}
