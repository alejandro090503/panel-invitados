'use client'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  urlBoda: string
  onAdded: () => void
}

const INPUT_CLASS = 'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-[#C2B59A]'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,252,246,0.85)',
  border: '1px solid #D9CDB6',
  color: '#3F2E1F',
}

export function AddGuestForm({ urlBoda, onAdded }: Props) {
  const [nombre, setNombre] = useState('')
  const [pases, setPases]   = useState(1)
  const [pasesMenores, setPasesMenores] = useState(0)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrimmed = nombre.trim()
    if (!nombreTrimmed) return

    const safePases   = Math.max(1, Math.floor(pases) || 1)
    const safeMenores = Math.max(0, Math.min(Math.floor(pasesMenores) || 0, safePases))

    setLoading(true)
    setError('')

    try {
      const { error: sbError } = await supabase.from('invitados').insert({
        nombre: nombreTrimmed,
        pases: safePases,
        pases_menores: safeMenores,
        pases_confirmados: 0,
        estado: 'pendiente',
        url_boda: urlBoda.trim().replace(/\/+$/, ''),
      })

      if (sbError) {
        console.error('Supabase insert error:', sbError)
        setError(`Error al guardar: ${sbError.message}`)
        setLoading(false)
        return
      }

      setNombre('')
      setPases(1)
      setPasesMenores(0)
      setLoading(false)
      onAdded()
    } catch (err) {
      console.error('Insert exception:', err)
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setLoading(false)
    }
  }

  /* Validación visual: menores no puede exceder pases */
  const menoresInvalid = pasesMenores > pases

  return (
    <form onSubmit={handleSubmit} noValidate className="glass rounded-2xl p-6">
      <h2 className="serif text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: '#3F2E1F' }}>
        <UserPlus size={18} strokeWidth={1.8} style={{ color: '#A88A4B' }} />
        Nueva invitación
      </h2>

      <div className="flex flex-col sm:flex-row gap-3">
        {/* Nombre */}
        <div className="flex-1">
          <label htmlFor="nombre" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
            Nombre o familia
          </label>
          <input
            id="nombre"
            type="text"
            value={nombre}
            onChange={e => setNombre(e.target.value)}
            required
            placeholder="Ej. Familia Pérez"
            autoComplete="off"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Pases */}
        <div className="w-full sm:w-24">
          <label htmlFor="pases" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
            Pases
          </label>
          <input
            id="pases"
            type="number"
            min={1}
            max={20}
            value={pases}
            onChange={e => setPases(Number(e.target.value))}
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Pases menores */}
        <div className="w-full sm:w-28">
          <label htmlFor="pasesMenores" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
            Menores
          </label>
          <input
            id="pasesMenores"
            type="number"
            min={0}
            max={pases}
            value={pasesMenores}
            onChange={e => setPasesMenores(Number(e.target.value))}
            className={INPUT_CLASS}
            style={{
              ...INPUT_STYLE,
              border: `1px solid ${menoresInvalid ? '#B85042' : '#D9CDB6'}`,
            }}
            aria-invalid={menoresInvalid}
          />
        </div>

        {/* Botón */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !nombre.trim() || menoresInvalid}
            className="w-full sm:w-auto px-7 py-2.5 rounded-xl text-sm font-medium tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.97] whitespace-nowrap"
            style={{
              background: 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)',
              color: '#FFFCF6',
              boxShadow: '0 4px 14px rgba(168,138,75,0.25)',
            }}
          >
            {loading ? 'Guardando…' : 'Agregar'}
          </button>
        </div>
      </div>

      {/* Helper text */}
      <p className="text-[11px] mt-2" style={{ color: menoresInvalid ? '#B85042' : '#8B7E63' }}>
        {menoresInvalid
          ? `Los menores (${pasesMenores}) no pueden ser más que los pases totales (${pases}).`
          : 'Los pases menores forman parte del total. Ej: 4 pases con 2 menores = 2 adultos + 2 menores.'}
      </p>

      {error && (
        <p role="alert" className="text-xs mt-2" style={{ color: '#B85042' }}>{error}</p>
      )}
    </form>
  )
}
