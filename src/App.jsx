import { HashRouter, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import PublicSite from './pages/PublicSite'
import AdminLogin from './pages/AdminLogin'
import AdminLayout from './pages/AdminLayout'

export default function App() {
  const [token, setToken] = useState(() => localStorage.getItem('fnra_token'))
  const [admin, setAdmin] = useState(() => {
    try { return JSON.parse(localStorage.getItem('fnra_user') || 'null') } catch { return null }
  })

  // Auto-migrate pathname like /admin/gallery to /#/admin/gallery if accessed directly without hash
  useEffect(() => {
    if (window.location.pathname.startsWith('/admin') && !window.location.hash) {
      window.location.replace('/#' + window.location.pathname)
    }
  }, [])

  const handleLogin = (tok, user) => {
    localStorage.setItem('fnra_token', tok)
    localStorage.setItem('fnra_user', JSON.stringify(user))
    setToken(tok)
    setAdmin(user)
  }
  const handleLogout = () => {
    localStorage.removeItem('fnra_token')
    localStorage.removeItem('fnra_user')
    setToken(null)
    setAdmin(null)
  }

  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<PublicSite />} />
        <Route path="/admin/login" element={token ? <Navigate to="/admin" /> : <AdminLogin onLogin={handleLogin} />} />
        <Route
          path="/admin/*"
          element={token ? <AdminLayout token={token} admin={admin} onLogout={handleLogout} /> : <Navigate to="/admin/login" />}
        />
      </Routes>
    </HashRouter>
  )
}
