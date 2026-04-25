import { useState, useRef } from 'react'
import { uploadImage, resolveUrl } from '../api'

/**
 * Reusable image uploader with drag-and-drop + file picker + URL paste.
 *
 * Props:
 *   token      – JWT token for upload auth
 *   value      – current image URL (controlled)
 *   onChange   – called with new URL string when upload completes or URL is pasted
 *   label      – optional label override
 */
export default function ImageUploader({ token, value, onChange, label = 'Image' }) {
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('upload') // 'upload' | 'url'
  const inputRef = useRef()

  const handleFile = async file => {
    if (!file) return
    if (!file.type.startsWith('image/')) { setError('Please select an image file.'); return }
    if (file.size > 10 * 1024 * 1024) { setError('File too large (max 10 MB).'); return }
    setError('')
    setUploading(true)
    setProgress(10)
    try {
      // Fake progress ticks while uploading
      const ticker = setInterval(() => setProgress(p => Math.min(p + 15, 85)), 300)
      const url = await uploadImage(file, token)
      clearInterval(ticker)
      setProgress(100)
      onChange(url)
      setTimeout(() => setProgress(0), 800)
    } catch (e) {
      setError(e.message || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const onDrop = e => {
    e.preventDefault(); setDragging(false)
    handleFile(e.dataTransfer.files[0])
  }
  const onInputChange = e => handleFile(e.target.files[0])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Tab switcher */}
      <div style={{ display: 'flex', gap: 0, borderRadius: 10, overflow: 'hidden', border: '1px solid rgba(255,255,255,0.12)', width: 'fit-content' }}>
        {['upload', 'url'].map(t => (
          <button
            key={t} type="button"
            onClick={() => setTab(t)}
            style={{
              padding: '7px 18px', fontSize: 13, fontWeight: 600, border: 'none', cursor: 'pointer',
              background: tab === t ? '#d4a017' : 'rgba(255,255,255,0.05)',
              color: tab === t ? '#0d1b3e' : '#9ca3af',
              transition: 'all 0.2s',
            }}
          >
            {t === 'upload' ? '📁 Upload File' : '🔗 Paste URL'}
          </button>
        ))}
      </div>

      {tab === 'upload' ? (
        <>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => inputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? '#d4a017' : uploading ? '#10b981' : 'rgba(255,255,255,0.15)'}`,
              borderRadius: 12,
              padding: '32px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(212,160,23,0.07)' : uploading ? 'rgba(16,185,129,0.06)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s',
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 10 }}>
              {uploading ? '⏳' : dragging ? '📂' : '🖼️'}
            </div>
            <p style={{ color: '#e5e7eb', fontWeight: 600, marginBottom: 4 }}>
              {uploading ? 'Uploading…' : 'Drop image here or click to browse'}
            </p>
            <p style={{ color: '#6b7280', fontSize: 12 }}>JPEG, PNG, WebP, GIF · Max 10 MB</p>
            <input
              ref={inputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={onInputChange}
            />
          </div>

          {/* Progress bar */}
          {progress > 0 && (
            <div style={{ height: 4, background: 'rgba(255,255,255,0.1)', borderRadius: 4, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: '#10b981', borderRadius: 4, transition: 'width 0.3s ease' }} />
            </div>
          )}
        </>
      ) : (
        /* URL input */
        <input
          className="form-input"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://example.com/photo.jpg"
        />
      )}

      {/* Error */}
      {error && (
        <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', color: '#f87171', padding: '8px 12px', borderRadius: 8, fontSize: 13 }}>
          ⚠ {error}
        </div>
      )}

      {/* Preview */}
      {value && !uploading && (
        <div style={{ position: 'relative' }}>
          <img
            src={resolveUrl(value)}
            alt="Preview"
            style={{ width: '100%', height: 180, objectFit: 'cover', borderRadius: 10, background: '#1a2d5a', display: 'block' }}
            onError={e => e.target.style.opacity = 0.2}
          />
          <button
            type="button"
            onClick={() => onChange('')}
            style={{
              position: 'absolute', top: 8, right: 8,
              background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff',
              width: 28, height: 28, borderRadius: '50%', cursor: 'pointer', fontSize: 14,
            }}
          >✕</button>
          <div style={{ position: 'absolute', bottom: 8, left: 8, background: 'rgba(0,0,0,0.6)', borderRadius: 6, padding: '2px 8px', fontSize: 11, color: '#fff' }}>
            ✓ Image ready
          </div>
        </div>
      )}
    </div>
  )
}
