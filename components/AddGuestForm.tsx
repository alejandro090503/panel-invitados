'use client'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  urlBoda: string
  onAdded: () => void
}

export function AddGuestForm({ urlBoda, onAdded }: Props) {
  const [nombre, setNombre] = useState('')
  const [pases, setPases]   = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrimmed = nombre.trim()
    if (!nombreTrimmed) return

    setLoading(true)
    setError('')

    const { error: sbError } = await supabase.from('invitados').insert({
      nombre: nombreTrimmed,
      pases,
      estado: 'pendiente',
      url_boda: urlBoda,
    })

    if (sbError) {
      setError('Error al guardar. Intenta de nuevo.')
      setLoading(false)
      return
    }

    setNombre('')
    setPases(1)
    setLoading(false)
    onAdded()
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="glass rounded-2xl p-5">
      <h2 className="text-base font-semibold mb-4 flex items-center gap-2" style={{ color: '#9E0059' }}>
        <UserPlus size={18} strokeWidth={1.8} />
        Agregar invitado
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Nombre */}
        <div className="flex-1">
          <label htmlFor="nombre" className="block text-xs font-medium mb-1" style={{ color: '#4B5563' }}>
            Nombre completo
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            placeholder="Ej. Ana García"
            autoComplete="off"
            className="
              w-full rounded-xl px-4 py-2.5 text-sm
              bg-white/70 border border-pink-200
              focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400
              transition-all duration-200 placeholder:text-gray-300
            "
          />
        </div>

        {/* Pases */}
        <div className="w-full sm:w-28">
          <label htmlFor="pases" className="block text-xs font-medium mb-1" style={{ color: '#4B5563' }}>
            Pases
          </label>
          <input
            id="pases"
            type="number"
            min={1}
            max={20}
            value={pases}
            onChange={e => setPases(Number(e.target.value))}
            className="
              w-full rounded-xl px-4 py-2.5 text-sm
              bg-white/70 border border-pink-200
              focus:outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-400
              transition-all duration-200
            "
          />
        </div>

        {/* Botón */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !nombre.trim()}
            className="
              w-full sm:w-auto px-6 py-2.5 rounded-xl text-white text-sm font-medium
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[.97] whitespace-nowrap
            "
            style={{ background: 'linear-gradient(135deg, #C2185B 0%, #9E0059 100%)' }}
          >
            {loading ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-xs mt-2 text-red-600">{error}</p>
      )}
    </form>
  )
}
