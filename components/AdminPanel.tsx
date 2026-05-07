'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Boda } from '@/lib/supabase'
import { BodaCard } from './BodaCard'
import { NewBodaForm } from './NewBodaForm'

export function AdminPanel() {
  const [bodas, setBodas] = useState<Boda[]>([])
  const [loading, setLoading] = useState(true)

  const fetchBodas = useCallback(async () => {
    const { data } = await supabase
      .from('bodas')
      .select('*')
      .order('created_at', { ascending: false })
    setBodas((data as Boda[]) ?? [])
    setLoading(false)
  }, [])

  useEffect(() => { fetchBodas() }, [fetchBodas])

  return (
    <div className="space-y-6">
      {/* Resumen rápido */}
      <div className="glass-sm rounded-2xl px-5 py-4 flex items-center gap-6">
        <div className="text-center">
          <span className="text-2xl font-semibold tabular-nums" style={{ color: '#9E0059' }}>{bodas.length}</span>
          <p className="text-xs" style={{ color: '#6B7280' }}>Bodas activas</p>
        </div>
      </div>

      <NewBodaForm onCreated={fetchBodas} />

      {/* Lista de bodas */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando bodas">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl bg-white/40 animate-pulse" />
          ))}
        </div>
      ) : bodas.length === 0 ? (
        <div className="text-center py-14" role="status">
          <p className="text-3xl mb-3">💒</p>
          <p className="text-sm font-medium" style={{ color: '#9E0059' }}>
            Aún no hay bodas registradas
          </p>
          <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
            Usa el formulario de arriba para crear el primer panel.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {bodas.map(b => (
            <BodaCard key={b.id} boda={b} onDeleted={fetchBodas} />
          ))}
        </div>
      )}
    </div>
  )
}
