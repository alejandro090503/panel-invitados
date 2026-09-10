'use client'
import { useState } from 'react'
import { UserPlus } from 'lucide-react'
import { supabase } from '@/lib/supabase'

interface Props {
  urlBoda: string
  onAdded: () => void
  showMenores?: boolean
  nombresMode?: boolean
}

const INPUT_CLASS = 'w-full rounded-xl px-4 py-2.5 text-sm transition-all duration-200 focus:outline-none focus:ring-2 placeholder:text-[#C2B59A]'
const INPUT_STYLE: React.CSSProperties = {
  background: 'rgba(255,252,246,0.85)',
  border: '1px solid #D9CDB6',
  color: '#3F2E1F',
}

export function AddGuestForm({ urlBoda, onAdded, showMenores = false, nombresMode = false }: Props) {
  const [nombre, setNombre] = useState('')
  const [pases, setPases]   = useState(1)
  const [menores, setMenores] = useState(0)
  const [telefono, setTelefono] = useState('')
  const [nombresAsignadosText, setNombresAsignadosText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nombreTrimmed = nombre.trim()
    if (!nombreTrimmed) return

    let nombresAsignados: string[] = []
    let safePases: number
    if (nombresMode) {
      nombresAsignados = nombresAsignadosText
        .split('\n')
        .map(s => s.trim())
        .filter(s => s.length > 0)
      if (nombresAsignados.length === 0) {
        setError('Agrega al menos un nombre específico (uno por línea).')
        return
      }
      safePases = nombresAsignados.length
    } else {
      safePases = Math.max(1, Math.floor(pases) || 1)
    }
    const safeMenores = showMenores ? Math.max(0, Math.floor(menores) || 0) : 0

    setLoading(true)
    setError('')

    try {
      const insertPayload: Record<string, unknown> = {
        nombre: nombreTrimmed,
        pases: safePases,
        pases_menores: safeMenores,
        pases_confirmados: 0,
        estado: 'pendiente',
        url_boda: urlBoda.trim().replace(/\/+$/, ''),
        telefono: telefono.trim() || null,
      }
      if (nombresMode) {
        insertPayload.nombres_asignados = nombresAsignados
      }

      const { error: sbError } = await supabase.from('invitados').insert(insertPayload)

      if (sbError) {
        console.error('Supabase insert error:', sbError)
        setError(`Error al guardar: ${sbError.message}`)
        setLoading(false)
        return
      }

      // Si este nombre se había borrado antes, quitamos su lápida: volver a
      // darlo de alta reactiva su invitación y debe poder confirmar de nuevo.
      await supabase
        .from('invitados_borrados')
        .delete()
        .ilike('nombre', nombreTrimmed)
        .eq('url_boda', urlBoda.trim().replace(/\/+$/, ''))

      setNombre('')
      setPases(1)
      setMenores(0)
      setNombresAsignadosText('')
      setTelefono('')
      setLoading(false)
      onAdded()
    } catch (err) {
      console.error('Insert exception:', err)
      setError('Error de conexión. Verifica tu internet e intenta de nuevo.')
      setLoading(false)
    }
  }

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

        {/* Pases — oculto en modo nombres específicos */}
        {!nombresMode && (
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
        )}

        {/* Pases menores (solo en bodas que usan menores) */}
        {showMenores && !nombresMode && (
          <div className="w-full sm:w-24">
            <label htmlFor="menores" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
              Menores
            </label>
            <input
              id="menores"
              type="number"
              min={0}
              max={20}
              value={menores}
              onChange={e => setMenores(Number(e.target.value))}
              className={INPUT_CLASS}
              style={INPUT_STYLE}
            />
          </div>
        )}

        {/* WhatsApp del contacto (opcional) */}
        <div className="w-full sm:w-44">
          <label htmlFor="telefono" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
            WhatsApp
          </label>
          <input
            id="telefono"
            type="tel"
            inputMode="tel"
            value={telefono}
            onChange={e => setTelefono(e.target.value)}
            placeholder="52 55 1234 5678"
            autoComplete="off"
            className={INPUT_CLASS}
            style={INPUT_STYLE}
          />
        </div>

        {/* Botón */}
        <div className="flex items-end">
          <button
            type="submit"
            disabled={loading || !nombre.trim()}
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

      {nombresMode && (
        <div className="mt-3">
          <label htmlFor="nombres_asignados" className="block text-[11px] font-medium mb-1.5 uppercase tracking-wider" style={{ color: '#5D4A33' }}>
            Nombres específicos a confirmar (uno por línea)
          </label>
          <textarea
            id="nombres_asignados"
            value={nombresAsignadosText}
            onChange={e => setNombresAsignadosText(e.target.value)}
            rows={Math.max(2, nombresAsignadosText.split('\n').length)}
            placeholder={'Ej:\nJuan Pérez\nMaría García\nLuis Pérez'}
            className={INPUT_CLASS}
            style={{ ...INPUT_STYLE, resize: 'vertical', minHeight: 80, fontFamily: 'inherit' }}
          />
          <p className="text-[11px] mt-1.5" style={{ color: '#8B7E63' }}>
            El invitado verá cada nombre con su propio botón Asistiré / No asistiré. Los pases se cuentan automáticamente.
          </p>
        </div>
      )}

      {error && (
        <p role="alert" className="text-xs mt-2" style={{ color: '#B85042' }}>{error}</p>
      )}
    </form>
  )
}
