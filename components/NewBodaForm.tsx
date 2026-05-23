'use client'
import { useState } from 'react'
import { PlusCircle } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  onCreated: () => void
}

function toSlug(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/&/g, 'y')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function generatePassword(nombre: string): string {
  const base = nombre
    .toLowerCase()
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z]/g, '')
    .slice(0, 8)
  const year = new Date().getFullYear()
  return `${base}${year}`
}

const INPUT_CLASS = 'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-[#C2B59A]'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,252,246,0.85)',
  border: '1px solid #D9CDB6',
  color: '#3F2E1F',
}

export function NewBodaForm({ onCreated }: Props) {
  const [nombre, setNombre] = useState('')
  const [urlBoda, setUrlBoda] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const slug = toSlug(nombre)
  const password = nombre.trim() ? generatePassword(nombre) : ''

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrimmed = nombre.trim()
    const urlTrimmed = urlBoda.trim()

    if (!nombreTrimmed || !urlTrimmed) return

    setLoading(true)
    setError('')

    const { error: sbError } = await supabase.from('bodas').insert({
      slug,
      nombre: nombreTrimmed,
      url_boda: urlTrimmed.replace(/\/+$/, ''),
      password,
    })

    if (sbError) {
      if (sbError.message.includes('duplicate') || sbError.message.includes('unique')) {
        setError('Ya existe un panel con ese nombre.')
      } else {
        setError('Error al crear. Intenta de nuevo.')
      }
      setLoading(false)
      return
    }

    setNombre('')
    setUrlBoda('')
    setLoading(false)
    onCreated()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="glass rounded-2xl p-6">
      <h2 className="serif text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#3F2E1F' }}>
        <PlusCircle size={18} strokeWidth={1.8} style={{ color: '#A88A4B' }} />
        Nuevo panel
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            <label htmlFor="nombre-novios" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
              Nombres de los novios
            </label>
            <input
              id="nombre-novios"
              type="text"
              value={nombre}
              onChange={e => setNombre(e.target.value)}
              required
              placeholder="Ej. Paulina & Leonardo"
              autoComplete="off"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>

          <div className="flex-1">
            <label htmlFor="url-boda" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
              Link de la invitación
            </label>
            <input
              id="url-boda"
              type="url"
              value={urlBoda}
              onChange={e => setUrlBoda(e.target.value)}
              required
              placeholder="https://boda-nombre.vercel.app"
              autoComplete="off"
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        </div>

        {/* Preview */}
        {nombre.trim() && (
          <div
            className="rounded-xl px-4 py-3 text-xs space-y-1.5"
            style={{ background: 'rgba(168,138,75,0.07)', border: '1px solid rgba(168,138,75,0.18)' }}
          >
            <p style={{ color: '#5D4A33' }}>
              <span className="font-semibold uppercase tracking-wider text-[10px] mr-1" style={{ color: '#A88A4B' }}>Link del panel</span>
              <span className="font-mono">{typeof window !== 'undefined' ? window.location.origin : ''}/{slug}</span>
            </p>
            <p style={{ color: '#5D4A33' }}>
              <span className="font-semibold uppercase tracking-wider text-[10px] mr-1" style={{ color: '#A88A4B' }}>Contraseña</span>
              <span className="font-mono">{password}</span>
            </p>
          </div>
        )}

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !nombre.trim() || !urlBoda.trim()}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.97]"
            style={{
              background: 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)',
              color: '#FFFCF6',
              boxShadow: '0 4px 14px rgba(168,138,75,0.28)',
            }}
          >
            {loading ? 'Creando…' : 'Crear panel'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs mt-3" style={{ color: '#B85042' }}>{error}</p>
      )}
    </form>
  )
}
