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
      url_boda: urlTrimmed,
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
    <form onSubmit={handleSubmit} noValidate className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#9E0059' }}>
        <PlusCircle size={18} strokeWidth={1.8} />
        Nuevo Panel
      </h2>

      <div className="flex flex-col gap-3">
        <div className="flex flex-col sm:flex-row gap-3">
          {/* Nombres de los novios */}
          <div className="flex-1">
            <label htmlFor="nombre-novios" className="block text-xs font-medium mb-1" style={{ color: '#4B5563' }}>
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
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/70 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all duration-200 placeholder:text-gray-300"
            />
          </div>

          {/* URL de la invitación */}
          <div className="flex-1">
            <label htmlFor="url-boda" className="block text-xs font-medium mb-1" style={{ color: '#4B5563' }}>
              Link de la invitación (Vercel)
            </label>
            <input
              id="url-boda"
              type="url"
              value={urlBoda}
              onChange={e => setUrlBoda(e.target.value)}
              required
              placeholder="https://boda-nombre.vercel.app"
              autoComplete="off"
              className="w-full rounded-xl px-4 py-2.5 text-sm bg-white/70 border border-pink-200 focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400 transition-all duration-200 placeholder:text-gray-300"
            />
          </div>
        </div>

        {/* Preview */}
        {nombre.trim() && (
          <div className="rounded-xl px-4 py-3 text-xs space-y-1" style={{ background: 'rgba(158,0,89,.05)', border: '1px solid rgba(158,0,89,.1)' }}>
            <p style={{ color: '#6B7280' }}>
              <span className="font-medium" style={{ color: '#9E0059' }}>Link del panel:</span>{' '}
              {window.location.origin}/{slug}
            </p>
            <p style={{ color: '#6B7280' }}>
              <span className="font-medium" style={{ color: '#7C3AED' }}>Contraseña:</span>{' '}
              {password}
            </p>
          </div>
        )}

        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !nombre.trim() || !urlBoda.trim()}
            className="w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.97]"
            style={{ background: 'linear-gradient(135deg, #C2185B 0%, #9E0059 100%)' }}
          >
            {loading ? 'Creando…' : 'Crear panel'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs mt-2 text-red-600">{error}</p>
      )}
    </form>
  )
}
