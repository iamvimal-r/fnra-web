import React from 'react'

/**
 * High-detail circular SVG emblem logo of Falcon Nagar Residence Association
 * matching the wooden plaque template seal.
 */
export function FnraSealLogo({ size = 80, className = '' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 200 200" className={className} style={{ flexShrink: 0 }}>
      <defs>
        <radialGradient id="sealWoodBg" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fde0b2" />
          <stop offset="70%" stopColor="#eab374" />
          <stop offset="100%" stopColor="#c98a43" />
        </radialGradient>
        <linearGradient id="roofGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#dc2626" />
          <stop offset="100%" stopColor="#991b1b" />
        </linearGradient>
        <linearGradient id="treeGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16a34a" />
          <stop offset="100%" stopColor="#065f46" />
        </linearGradient>
        <linearGradient id="ribbonGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#1e3a8a" />
          <stop offset="50%" stopColor="#2563eb" />
          <stop offset="100%" stopColor="#1e3a8a" />
        </linearGradient>
      </defs>

      {/* Outer Ring */}
      <circle cx="100" cy="100" r="96" fill="url(#sealWoodBg)" stroke="#0f2b5c" strokeWidth="5" />
      <circle cx="100" cy="100" r="90" fill="none" stroke="#0f2b5c" strokeWidth="1.5" />
      
      {/* Outer Circular Navy Blue Ring */}
      <circle cx="100" cy="100" r="76" fill="none" stroke="#0f2b5c" strokeWidth="22" />
      
      {/* Circular Text: FALCON NAGAR */}
      <path id="textPathTop" d="M 30,100 A 70,70 0 1,1 170,100" fill="none" />
      <text fill="#ffffff" fontSize="16" fontWeight="900" letterSpacing="3">
        <textPath href="#textPathTop" startOffset="50%" textAnchor="middle">
          FALCON NAGAR
        </textPath>
      </text>

      {/* Stars on sides */}
      <text x="24" y="105" fill="#f59e0b" fontSize="14" textAnchor="middle">★</text>
      <text x="176" y="105" fill="#f59e0b" fontSize="14" textAnchor="middle">★</text>

      {/* Inner Circle Background */}
      <circle cx="100" cy="100" r="64" fill="#fef3c7" stroke="#0f2b5c" strokeWidth="3" />

      {/* Pine Trees */}
      <polygon points="46,118 60,88 74,118" fill="url(#treeGrad)" />
      <polygon points="126,118 140,88 154,118" fill="url(#treeGrad)" />

      {/* Red Roof Houses */}
      <polygon points="62,118 78,102 94,118" fill="url(#roofGrad)" stroke="#7f1d1d" strokeWidth="1.5" />
      <polygon points="86,118 104,96 122,118" fill="url(#roofGrad)" stroke="#7f1d1d" strokeWidth="1.5" />
      <polygon points="114,118 128,105 142,118" fill="url(#roofGrad)" stroke="#7f1d1d" strokeWidth="1.5" />

      {/* Falcon Bird in Flight */}
      <g transform="translate(100, 68) scale(0.95)">
        <path
          d="M -34,-16 C -22,-32 -6,-34 0,-18 C 6,-34 22,-32 34,-16 C 24,-13 13,-6 5,0 C 13,9 22,13 30,16 C 19,13 9,9 0,5 C -9,9 -19,13 -30,16 C -22,13 -13,9 -5,0 C -13,-6 -24,-13 -34,-16 Z"
          fill="#1e3a8a"
          stroke="#0f172a"
          strokeWidth="1.5"
        />
        <polygon points="-3,-1 3,-1 0,8" fill="#f59e0b" />
      </g>

      {/* Ribbon Banner at Bottom */}
      <path
        d="M 22,146 L 38,136 L 162,136 L 178,146 L 162,158 L 38,158 Z"
        fill="url(#ribbonGrad)"
        stroke="#f59e0b"
        strokeWidth="1.5"
      />
      <text x="100" y="151" fill="#ffffff" fontSize="10.5" fontWeight="900" textAnchor="middle" letterSpacing="1">
        RESIDENCE ASSOCIATION
      </text>

      {/* Reg No Badge at Bottom */}
      <rect x="50" y="162" width="100" height="18" rx="9" fill="#047857" stroke="#ffffff" strokeWidth="1" />
      <text x="100" y="174" fill="#ffffff" fontSize="8.5" fontWeight="800" textAnchor="middle">
        TVM/TC/1496/2015
      </text>
    </svg>
  )
}

/**
 * Wooden Nameplate Plaque component matching the exact image template
 * requested by the user for house directory entries.
 */
export default function FnraHousePlaque({ house, onClick, actions }) {
  if (!house) return null

  const isNc = house.status === 'NC' || house.status === 'Inactive'
  const rawNum = house.house_number || '---'
  // Clean up prefix like "Fnra-104" -> "104" or "FNRA A-101" -> "A-101" since FNRA is already printed above
  const houseNum = rawNum.replace(/^fnra[-_\s]*/i, '').replace(/^house[-_\s]*/i, '') || rawNum
  const houseName = house.house_name || ''
  const ownerName = house.owner_name || 'Resident'
  const blockName = house.block || 'Block A'
  const familyCount = Array.isArray(house.family_members) ? house.family_members.length : 0

  return (
    <div
      onClick={onClick}
      style={{
        background: 'linear-gradient(135deg, #e7b57e 0%, #d49856 45%, #c0823e 80%, #aa6e2c 100%)',
        borderRadius: 14,
        padding: '12px 14px',
        border: '6px solid #2e160a',
        boxShadow: '0 10px 25px rgba(0,0,0,0.6), inset 0 0 15px rgba(35,17,7,0.4)',
        position: 'relative',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'transform 0.2s ease, boxShadow 0.2s ease',
        color: '#1a0b04',
        userSelect: 'none',
      }}
      onMouseEnter={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(-4px) scale(1.01)'
          e.currentTarget.style.boxShadow = '0 16px 35px rgba(0,0,0,0.8), inset 0 0 15px rgba(35,17,7,0.3)'
        }
      }}
      onMouseLeave={(e) => {
        if (onClick) {
          e.currentTarget.style.transform = 'translateY(0) scale(1)'
          e.currentTarget.style.boxShadow = '0 10px 25px rgba(0,0,0,0.6), inset 0 0 15px rgba(35,17,7,0.4)'
        }
      }}
    >
      {/* Inner Thin Wood Carved Inset Line */}
      <div
        style={{
          border: '1.5 solid #563016',
          borderRadius: 8,
          padding: '10px 12px',
          background: 'rgba(255, 255, 255, 0.08)',
          boxShadow: 'inset 0 0 8px rgba(50, 24, 10, 0.25)',
        }}
      >
        {/* Top Section: Seal Logo on Left, FNRA + Huge House # on Right */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
          {/* Left Emblem Logo Image */}
          <div style={{ width: 85, height: 85, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <img
              src="/fnra_seal.png"
              alt="FNRA Emblem Seal"
              style={{ width: '100%', height: '100%', objectFit: 'contain', filter: 'drop-shadow(0 2px 4px rgba(40,20,8,0.4))' }}
              onError={(e) => {
                e.target.style.display = 'none'
                if (e.target.nextSibling) e.target.nextSibling.style.display = 'block'
              }}
            />
            <div style={{ display: 'none' }}>
              <FnraSealLogo size={85} />
            </div>
          </div>

          {/* Right Text Block */}
          <div style={{ textAlign: 'right', flex: 1, overflow: 'hidden' }}>
            <div
              style={{
                fontSize: 26,
                fontWeight: 900,
                letterSpacing: 2,
                color: '#341a0b',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                textShadow: '1px 1px 0px rgba(255,255,255,0.4), -1px -1px 0px rgba(40,20,8,0.3)',
                lineHeight: 1,
              }}
            >
              FNRA
            </div>
            <div
              style={{
                fontSize: houseNum.length > 5 ? 32 : houseNum.length > 3 ? 40 : 52,
                fontWeight: 900,
                color: '#050505',
                fontFamily: "'Outfit', 'Plus Jakarta Sans', sans-serif",
                lineHeight: 0.95,
                marginTop: 2,
                textShadow: '1px 1px 0px rgba(255,255,255,0.3)',
                letterSpacing: houseNum.length > 3 ? 0 : 1,
                whiteSpace: 'nowrap',
              }}
            >
              {houseNum}
            </div>
          </div>
        </div>

        {/* Divider Line */}
        <div
          style={{
            height: 2,
            background: 'linear-gradient(90deg, rgba(50,24,10,0.1), rgba(50,24,10,0.6) 50%, rgba(50,24,10,0.1))',
            margin: '10px 0 8px 0',
          }}
        />

        {/* Bottom Section: Owner Name + House Name + Block + Family Members */}
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
              color: '#1a0902',
              lineHeight: 1.25,
              textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.4)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {ownerName}
          </div>

          {houseName && (
            <div
              style={{
                fontSize: 13,
                fontWeight: 900,
                color: '#3d1a08',
                marginTop: 3,
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <span>🏡</span>
              <span style={{ fontStyle: 'italic', textShadow: '0.5px 0.5px 0px rgba(255,255,255,0.4)' }}>
                {houseName}
              </span>
            </div>
          )}

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 8,
              flexWrap: 'wrap',
              gap: 6,
            }}
          >
            <div style={{ fontSize: 12, fontWeight: 700, color: '#3d200f', display: 'flex', alignItems: 'center', gap: 4 }}>
              📍 {blockName}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              {familyCount > 0 && (
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    color: '#341a0b',
                    background: 'rgba(255, 255, 255, 0.4)',
                    padding: '2px 7px',
                    borderRadius: 10,
                    border: '1px solid rgba(60, 30, 10, 0.25)',
                  }}
                >
                  👥 {familyCount}
                </span>
              )}

              <span
                style={{
                  fontSize: 10,
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: 10,
                  letterSpacing: 0.5,
                  background: isNc
                    ? 'linear-gradient(135deg, #b91c1c, #991b1b)'
                    : 'linear-gradient(135deg, #047857, #065f46)',
                  color: '#ffffff',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.4)',
                }}
              >
                {isNc ? 'NC' : 'ACTIVE'}
              </span>
            </div>
          </div>
        </div>

        {/* Optional Custom Action Buttons (for admin edit/delete) */}
        {actions && (
          <div
            style={{
              marginTop: 10,
              paddingTop: 8,
              borderTop: '1px dashed rgba(50,24,10,0.3)',
              display: 'flex',
              gap: 8,
              justifyContent: 'flex-end',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {actions}
          </div>
        )}
      </div>
    </div>
  )
}
