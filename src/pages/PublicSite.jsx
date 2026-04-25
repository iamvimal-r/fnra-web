import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { slidesApi, newsApi, galleryApi, publicContactsApi, committeeApi, resolveUrl } from '../api'

// ── Navbar ────────────────────────────────────────────────────────────────────
function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  return (
    <nav className="navbar" style={{ background: scrolled ? 'rgba(13,27,62,0.98)' : 'rgba(13,27,62,0.7)' }}>
      <div className="navbar-brand">
        {/* Logo with gold ring */}
        <div style={{
          width: 52, height: 52, borderRadius: '50%',
          border: '2px solid #d4a017',
          boxShadow: '0 0 12px rgba(212,160,23,0.4)',
          overflow: 'hidden', flexShrink: 0,
          background: '#0d1b3e',
        }}>
          <img
            src="/icon.png"
            alt="FNRA"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            onError={e => {
              e.target.style.display = 'none'
              e.target.parentElement.innerHTML = '<span style="display:flex;align-items:center;justify-content:center;width:100%;height:100%;font-size:22px;font-weight:900;color:#d4a017;">🦅</span>'
            }}
          />
        </div>
        <div style={{ marginLeft: 12 }}>
          <div style={{
            fontSize: 22, fontWeight: 900, letterSpacing: 3,
            background: 'linear-gradient(135deg, #f0c040, #d4a017)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
            lineHeight: 1.1,
          }}>
            FNRA
          </div>
          <div style={{ fontSize: 9, color: '#d4a017', fontWeight: 600, letterSpacing: 2, marginTop: 1 }}>
            FALCON NAGAR · TVM/TC/1496/2015
          </div>
        </div>
      </div>
      <div className="navbar-links">
        <a href="#home"      className="nav-link">Home</a>
        <a href="#news"      className="nav-link">News</a>
        <a href="#gallery"   className="nav-link">Gallery</a>
        <a href="#committee" className="nav-link">Committee</a>
        <a href="#emergency" className="nav-link" style={{ color: '#fca5a5' }}>🚨 Emergency</a>
        <a href="#about"     className="nav-link">About</a>
        <Link to="/admin"    className="nav-link admin-link">⚙ Admin</Link>
      </div>
    </nav>
  )
}

// ── Hero Slider ───────────────────────────────────────────────────────────────
const DEFAULT_SLIDES = [
  {
    id: 'default-1',
    title: 'Welcome to Falcon Nagar',
    subtitle: 'Your trusted residence association since 2015. Building community, one home at a time.',
    image_url: '',
    active: true,
  },
  {
    id: 'default-2',
    title: 'Community First',
    subtitle: 'We manage facilities, resolve complaints, and keep Falcon Nagar safe and thriving.',
    image_url: '',
    active: true,
  },
]

const SLIDE_COLORS = [
  'linear-gradient(135deg, #0d1b3e 0%, #1a2d5a 50%, #0d1b3e 100%)',
  'linear-gradient(135deg, #1a0d3e 0%, #2d1a5a 50%, #1a0d3e 100%)',
  'linear-gradient(135deg, #0d2f3e 0%, #1a4a5a 50%, #0d2f3e 100%)',
]

function HeroSlider({ slides }) {
  const [current, setCurrent] = useState(0)
  const list = slides.length ? slides : DEFAULT_SLIDES

  useEffect(() => {
    const t = setInterval(() => setCurrent(c => (c + 1) % list.length), 5000)
    return () => clearInterval(t)
  }, [list.length])

  return (
    <section id="home" className="hero">
      {list.map((slide, i) => (
        <div key={slide.id} className={`hero-slide ${i === current ? 'active' : ''}`}>
          {slide.image_url ? (
            <img src={resolveUrl(slide.image_url)} alt={slide.title} className="hero-bg" />
          ) : (
            <div className="hero-bg" style={{ background: SLIDE_COLORS[i % SLIDE_COLORS.length] }} />
          )}
          <div className="hero-overlay" />
          <div className="container">
            <div className="hero-content">
              <div className="hero-tag">🦅 Falcon Nagar Residence Association</div>
              <h1 className="hero-title">
                {slide.title.split(' ').map((w, wi) =>
                  wi === 0 ? <span key={wi}>{w} </span> : w + ' '
                )}
              </h1>
              <p className="hero-sub">{slide.subtitle}</p>
              <div className="hero-actions">
                <a href="#news" className="btn btn-primary">📰 Latest News</a>
                <a href="#about" className="btn btn-outline">About Us</a>
              </div>
            </div>
          </div>
        </div>
      ))}
      <div className="hero-dots">
        {list.map((_, i) => (
          <button key={i} className={`hero-dot ${i === current ? 'active' : ''}`} onClick={() => setCurrent(i)} />
        ))}
      </div>
      <div className="hero-arrows">
        <button className="hero-arrow" onClick={() => setCurrent(c => (c - 1 + list.length) % list.length)}>‹</button>
        <button className="hero-arrow" onClick={() => setCurrent(c => (c + 1) % list.length)}>›</button>
      </div>
    </section>
  )
}

// ── News Section ──────────────────────────────────────────────────────────────
const NEWS_ICONS = { general: '📢', event: '🎉', notice: '📋', urgent: '🚨' }

function NewsSection({ news }) {
  return (
    <section id="news" className="section">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Latest Updates</div>
          <h2 className="section-title">News & Notices</h2>
          <p className="section-sub">Stay informed about the latest happenings in Falcon Nagar.</p>
        </div>
        {news.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📰</div>
            <p>No news published yet. Check back soon!</p>
          </div>
        ) : (
          <div className="news-grid">
            {news.filter(n => n.published).map(item => (
              <div key={item.id} className="news-card">
                {item.image_url ? (
                  <img src={resolveUrl(item.image_url)} alt={item.title} className="news-card-img" />
                ) : (
                  <div className="news-card-img-placeholder">{NEWS_ICONS[item.category] || '📢'}</div>
                )}
                <div className="news-card-body">
                  <span className={`badge badge-${item.category}`}>{item.category}</span>
                  <div className="news-card-title">{item.title}</div>
                  <div className="news-card-excerpt">{item.content.slice(0, 120)}{item.content.length > 120 ? '…' : ''}</div>
                  <div className="news-card-date">{item.date ? new Date(item.date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' }) : new Date(item.created_at).toLocaleDateString('en-IN')}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  )
}

// ── Gallery Section ───────────────────────────────────────────────────────────
function GallerySection({ gallery }) {
  const [lightbox, setLightbox] = useState(null)
  return (
    <section id="gallery" className="section section-alt">
      <div className="container">
        <div className="section-header">
          <div className="section-label">Our Community</div>
          <h2 className="section-title">Photo Gallery</h2>
          <p className="section-sub">Moments from Falcon Nagar — events, facilities, and community life.</p>
        </div>
        {gallery.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--gray)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>🖼️</div>
            <p>Gallery is empty. Add photos from the admin panel!</p>
          </div>
        ) : (
          <div className="gallery-grid">
            {gallery.map(item => (
              <div key={item.id} className="gallery-item" onClick={() => setLightbox(item)}>
                <img src={resolveUrl(item.image_url)} alt={item.title} loading="lazy" onError={e => { e.target.style.display='none'; e.target.parentElement.style.background='#1a2d5a' }} />
                <div className="gallery-overlay">
                  <span className="gallery-overlay-text">🔍 {item.title}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      {lightbox && (
        <div className="lightbox" onClick={() => setLightbox(null)}>
          <img src={resolveUrl(lightbox.image_url)} alt={lightbox.title} onClick={e => e.stopPropagation()} />
          <button className="lightbox-close" onClick={() => setLightbox(null)}>✕</button>
        </div>
      )}
    </section>
  )
}

// ── Executive Committee Section ──────────────────────────────────────────────────
const ROLE_COLOR = {
  'President':        '#d4a017',
  'Vice President':   '#a78bfa',
  'Secretary':        '#38bdf8',
  'Joint Secretary':  '#34d399',
  'Treasurer':        '#fb923c',
  'Executive Member': '#94a3b8',
}

const ROLE_ICON = {
  'President':        '🌟',
  'Vice President':   '👑',
  'Secretary':        '📝',
  'Joint Secretary':  '📎',
  'Treasurer':        '💰',
  'Executive Member': '👤',
}

function MemberCard({ member, featured }) {
  const color = ROLE_COLOR[member.role] || '#94a3b8'
  const icon  = ROLE_ICON[member.role]  || '👤'
  return (
    <div style={{
      background: featured ? `linear-gradient(135deg, ${color}18 0%, rgba(13,27,62,0.95) 60%)` : 'rgba(255,255,255,0.04)',
      border: `1px solid ${color}${featured ? '55' : '22'}`,
      borderTop: `3px solid ${color}`,
      borderRadius: featured ? 20 : 16,
      padding: featured ? '32px 28px' : '24px 20px',
      display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
      transition: 'transform 0.25s, box-shadow 0.25s',
      position: 'relative', overflow: 'hidden',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-6px)'; e.currentTarget.style.boxShadow=`0 16px 48px ${color}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      {/* Glow blob */}
      {featured && <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: color + '18', filter: 'blur(40px)', pointerEvents: 'none' }} />}

      {/* Photo */}
      <div style={{
        width: featured ? 110 : 88, height: featured ? 110 : 88,
        borderRadius: '50%', marginBottom: featured ? 18 : 14, flexShrink: 0,
        border: `3px solid ${color}`, boxShadow: `0 0 24px ${color}44`,
        background: `linear-gradient(135deg, ${color}33, #1a2d5a)`,
        overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {member.photo_url ? (
          <img src={resolveUrl(member.photo_url)} alt={member.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} onError={e => { e.target.style.display='none' }} />
        ) : (
          <span style={{ fontSize: featured ? 40 : 32, color }}>{member.name.charAt(0)}</span>
        )}
      </div>

      {/* Role pill */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, background: color + '22', border: `1px solid ${color}44`, color, padding: '3px 10px', borderRadius: 20, fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 }}>
        {icon} {member.role}
      </div>

      <div style={{ fontWeight: 800, fontSize: featured ? 20 : 16, color: '#fff', marginBottom: 6 }}>{member.name}</div>

      {member.bio && <p style={{ fontSize: 13, color: '#9ca3af', lineHeight: 1.6, marginBottom: 10, maxWidth: 220 }}>{member.bio.slice(0, 100)}{member.bio.length > 100 ? '…' : ''}</p>}

      {/* Contact links */}
      {(member.phone || member.email) && (
        <div style={{ display: 'flex', gap: 8, marginTop: 4, flexWrap: 'wrap', justifyContent: 'center' }}>
          {member.phone && (
            <a href={`tel:${member.phone.replace(/\s+/g,'')}`}
              style={{ fontSize: 12, color, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, background: color + '15', padding: '4px 10px', borderRadius: 20, border: `1px solid ${color}33` }}
            >📞 {member.phone}</a>
          )}
          {member.email && (
            <a href={`mailto:${member.email}`}
              style={{ fontSize: 12, color: '#9ca3af', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4, background: 'rgba(255,255,255,0.05)', padding: '4px 10px', borderRadius: 20, border: '1px solid rgba(255,255,255,0.1)' }}
            >✉ {member.email}</a>
          )}
        </div>
      )}
    </div>
  )
}

function CommitteeSection({ members }) {
  const priority = ['President', 'Vice President', 'Secretary', 'Joint Secretary', 'Treasurer', 'Executive Member']
  const sorted = [...members].sort((a, b) => {
    const ai = priority.indexOf(a.role), bi = priority.indexOf(b.role)
    if (ai !== bi) return ai - bi
    return a.order - b.order
  })

  const featured  = sorted.filter(m => ['President', 'Vice President', 'Secretary'].includes(m.role))
  const executive = sorted.filter(m => !['President', 'Vice President', 'Secretary'].includes(m.role))

  if (members.length === 0) return null

  return (
    <section id="committee" style={{ padding: '80px 0' }}>
      <div className="container">
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(212,160,23,0.1)', border: '1px solid rgba(212,160,23,0.3)', color: '#d4a017', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            🌟 FNRA Leadership
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, marginBottom: 12 }}>Executive Committee</h2>
          <p style={{ color: '#9ca3af', fontSize: 16, maxWidth: 480, margin: '0 auto' }}>The elected representatives serving the residents of Falcon Nagar.</p>
        </div>

        {/* Featured row — President / VP / Secretary */}
        {featured.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(featured.length, 3)}, 1fr)`, gap: 24, marginBottom: 32, maxWidth: 900, margin: '0 auto 32px' }}>
            {featured.map(m => <MemberCard key={m.id} member={m} featured />)}
          </div>
        )}

        {/* Divider */}
        {executive.length > 0 && (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
              <span style={{ color: '#6b7280', fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>Executive Members</span>
              <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.08)' }} />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {executive.map(m => <MemberCard key={m.id} member={m} featured={false} />)}
            </div>
          </>
        )}
      </div>
    </section>
  )
}

const CAT_META = {
  emergency:   { emoji: '🚨', color: '#ef4444', label: 'Emergency'   },
  electrician: { emoji: '⚡', color: '#f59e0b', label: 'Electrician'  },
  plumber:     { emoji: '🪠', color: '#0891b2', label: 'Plumber'      },
  security:    { emoji: '🛡️', color: '#10b981', label: 'Security'     },
  maintenance: { emoji: '🔧', color: '#8b5cf6', label: 'Maintenance'  },
  authority:   { emoji: '🏛️', color: '#6366f1', label: 'Authority'    },
}

function ContactCard({ contact }) {
  const meta = CAT_META[contact.category] || CAT_META.maintenance
  const phone = contact.phone.replace(/\s+/g, '')
  const wa    = phone.replace(/[^0-9]/g, '')
  const waNum = wa.startsWith('91') ? wa : `91${wa}`

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)', border: `1px solid ${meta.color}33`,
      borderLeft: `4px solid ${meta.color}`, borderRadius: 14,
      padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12,
      transition: 'transform 0.2s, box-shadow 0.2s',
    }}
      onMouseEnter={e => { e.currentTarget.style.transform='translateY(-3px)'; e.currentTarget.style.boxShadow=`0 8px 30px ${meta.color}22` }}
      onMouseLeave={e => { e.currentTarget.style.transform=''; e.currentTarget.style.boxShadow='' }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div style={{ width: 48, height: 48, borderRadius: 12, background: meta.color + '22', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
          {meta.emoji}
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 2 }}>{contact.name}</div>
          <div style={{ fontSize: 13, color: '#9ca3af', fontWeight: 600 }}>{contact.phone}</div>
          {contact.notes && <div style={{ fontSize: 12, color: '#6b7280', marginTop: 4 }}>{contact.notes}</div>}
          {contact.availability && <div style={{ fontSize: 11, color: '#6b7280', marginTop: 2 }}>🕐 {contact.availability}</div>}
        </div>
        <span style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, color: meta.color, background: meta.color + '22', padding: '3px 8px', borderRadius: 20, flexShrink: 0 }}>
          {meta.label}
        </span>
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <a
          href={`tel:${phone}`}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 10, background: meta.color + '22', border: `1px solid ${meta.color}55`, color: meta.color, fontWeight: 700, fontSize: 13, textDecoration: 'none', transition: 'all 0.2s' }}
          onMouseEnter={e => { e.currentTarget.style.background = meta.color; e.currentTarget.style.color = '#fff' }}
          onMouseLeave={e => { e.currentTarget.style.background = meta.color + '22'; e.currentTarget.style.color = meta.color }}
        >
          📞 Call
        </a>
        {contact.whatsapp !== false && (
          <a
            href={`https://wa.me/${waNum}`}
            target="_blank" rel="noreferrer"
            style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 10, background: '#25d36622', border: '1px solid #25d36655', color: '#25d366', fontWeight: 700, fontSize: 13, textDecoration: 'none', transition: 'all 0.2s' }}
            onMouseEnter={e => { e.currentTarget.style.background = '#25d366'; e.currentTarget.style.color = '#fff' }}
            onMouseLeave={e => { e.currentTarget.style.background = '#25d36622'; e.currentTarget.style.color = '#25d366' }}
          >
            💬 WhatsApp
          </a>
        )}
      </div>
    </div>
  )
}

function EmergencySection({ contacts }) {
  const [activeTab, setActiveTab] = useState('all')
  const tabs = ['all', ...Object.keys(CAT_META)].filter(
    t => t === 'all' || contacts.some(c => c.category === t)
  )
  const visible = activeTab === 'all' ? contacts : contacts.filter(c => c.category === activeTab)

  // Separate emergency from others for layout
  const emergency = visible.filter(c => c.category === 'emergency')
  const others    = visible.filter(c => c.category !== 'emergency')

  return (
    <section id="emergency" style={{ padding: '80px 0', background: 'linear-gradient(180deg, rgba(239,68,68,0.04) 0%, transparent 100%)' }}>
      <div className="container">
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#fca5a5', padding: '6px 16px', borderRadius: 20, fontSize: 12, fontWeight: 700, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 16 }}>
            🚨 Important Numbers
          </div>
          <h2 style={{ fontSize: 'clamp(28px,4vw,40px)', fontWeight: 800, marginBottom: 12 }}>Emergency &amp; Service Contacts</h2>
          <p style={{ color: '#9ca3af', fontSize: 16, maxWidth: 520, margin: '0 auto' }}>One-tap calling and WhatsApp for all important contacts in Falcon Nagar.</p>
        </div>

        {contacts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 0', color: '#6b7280' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>📞</div>
            <p>No contacts added yet. Add them from the admin panel.</p>
          </div>
        ) : (
          <>
            {/* Category filter tabs */}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'center', marginBottom: 36 }}>
              {tabs.map(t => {
                const meta = t === 'all' ? { emoji: '📋', color: '#a78bfa', label: 'All' } : CAT_META[t]
                const active = activeTab === t
                return (
                  <button key={t} onClick={() => setActiveTab(t)}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderRadius: 20, border: `1px solid ${active ? meta.color : 'rgba(255,255,255,0.12)'}`, background: active ? meta.color + '22' : 'rgba(255,255,255,0.04)', color: active ? meta.color : '#9ca3af', fontWeight: 600, fontSize: 13, cursor: 'pointer', transition: 'all 0.2s' }}
                  >
                    {meta.emoji} {meta.label}
                  </button>
                )
              })}
            </div>

            {/* Emergency highlight row */}
            {emergency.length > 0 && (
              <div style={{ marginBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                  <span style={{ fontSize: 18 }}>🚨</span>
                  <span style={{ fontWeight: 800, color: '#ef4444', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Emergency</span>
                  <div style={{ flex: 1, height: 1, background: 'rgba(239,68,68,0.25)' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {emergency.map(c => <ContactCard key={c.id} contact={c} />)}
                </div>
              </div>
            )}

            {/* All other categories */}
            {others.length > 0 && (
              <div>
                {activeTab === 'all' && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                    <span style={{ fontSize: 18 }}>📞</span>
                    <span style={{ fontWeight: 800, color: '#9ca3af', fontSize: 14, textTransform: 'uppercase', letterSpacing: 1 }}>Service Contacts</span>
                    <div style={{ flex: 1, height: 1, background: 'rgba(255,255,255,0.1)' }} />
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
                  {others.map(c => <ContactCard key={c.id} contact={c} />)}
                </div>
              </div>
            )}
          </>
        )}

        {/* Helpline strip */}
        <div style={{ marginTop: 48, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '24px 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div>
            <div style={{ fontWeight: 800, fontSize: 16, marginBottom: 4 }}>🚑 National Emergency Numbers</div>
            <div style={{ color: '#9ca3af', fontSize: 13 }}>Available 24/7 across India</div>
          </div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            {[['🚑 Ambulance', '102'], ['🚒 Fire', '101'], ['👮 Police', '100'], ['🆘 Emergency', '112']].map(([label, num]) => (
              <a key={num} href={`tel:${num}`}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: '10px 16px', color: '#fff', textDecoration: 'none', minWidth: 80, transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.35)'}
                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
              >
                <span style={{ fontSize: 13 }}>{label}</span>
                <span style={{ fontSize: 22, fontWeight: 900, color: '#fca5a5', marginTop: 4 }}>{num}</span>
              </a>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="container">
        <div className="about-strip">
          <div>
            <div className="section-label">Est. 2015</div>
            <h2 className="section-title">About FNRA</h2>
            <p style={{ color: 'var(--gray)', lineHeight: 1.8, marginBottom: 16 }}>
              Falcon Nagar Residence Association (FNRA) is the official registered body managing the Falcon Nagar residential community in Thiruvananthapuram.
              Registered under TVM/TC/1496/2015, we work to ensure clean, safe, and harmonious living for all residents.
            </p>
            <p style={{ color: 'var(--gray)', lineHeight: 1.8 }}>
              Our elected committee manages maintenance, security, community events, and dispute resolution with full transparency.
            </p>
            <div className="stat-row">
              <div className="stat-item"><div className="stat-val">100+</div><div className="stat-lab">Houses</div></div>
              <div className="stat-item"><div className="stat-val">10+</div><div className="stat-lab">Years</div></div>
              <div className="stat-item"><div className="stat-val">500+</div><div className="stat-lab">Residents</div></div>
            </div>
          </div>
          <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ textAlign: 'center' }}>
              <img src="/icon.png" alt="FNRA Logo" className="about-logo" onError={e => e.target.style.display='none'} />
              <p style={{ color: 'var(--gold)', fontWeight: 700, marginTop: 16, letterSpacing: 2 }}>FALCON NAGAR</p>
              <p style={{ color: 'var(--gray)', fontSize: 12, marginTop: 4 }}>TVM/TC/1496/2015</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ── Footer ────────────────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="footer">
      <div className="footer-logo-row">
        <img src="/icon.png" alt="FNRA" style={{ width: 36, height: 36, borderRadius: 8 }} onError={e => e.target.style.display='none'} />
        <div>
          <div className="footer-name">FNRA</div>
        </div>
      </div>
      <p className="footer-sub">Falcon Nagar Residence Association · TVM/TC/1496/2015</p>
      <div className="footer-links">
        <a href="#home" className="footer-link">Home</a>
        <a href="#news" className="footer-link">News</a>
        <a href="#gallery" className="footer-link">Gallery</a>
        <a href="#about" className="footer-link">About</a>
      </div>
      <p className="footer-copy">© {new Date().getFullYear()} Falcon Nagar Residence Association. All rights reserved.</p>
    </footer>
  )
}

// ── Public Site ───────────────────────────────────────────────────────────────
export default function PublicSite() {
  const [slides,    setSlides]    = useState([])
  const [news,      setNews]      = useState([])
  const [gallery,   setGallery]   = useState([])
  const [contacts,  setContacts]  = useState([])
  const [committee, setCommittee] = useState([])

  useEffect(() => {
    slidesApi.list().then(setSlides).catch(() => {})
    newsApi.list().then(setNews).catch(() => {})
    galleryApi.list().then(setGallery).catch(() => {})
    publicContactsApi.list().then(setContacts).catch(() => {})
    committeeApi.listPublic().then(setCommittee).catch(() => {})
  }, [])

  return (
    <>
      <Navbar />
      <HeroSlider slides={slides} />
      <NewsSection news={news} />
      <GallerySection gallery={gallery} />
      <CommitteeSection members={committee} />
      <EmergencySection contacts={contacts} />
      <AboutSection />
      <Footer />
    </>
  )
}
