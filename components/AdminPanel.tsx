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
      <div className="glass-sm rounded-2xl px-6 py-5 flex items-center gap-8">
        <div className="text-center">
          <span className="serif text-3xl font-semibold tabular-nums" style={{ color: '#A88A4B' }}>{bodas.length}</span>
          <p className="text-[11px] mt-0.5 uppercase tracking-wider" style={{ color: '#8B7E63' }}>Bodas activas</p>
        </div>
      </div>

      <NewBodaForm onCreated={fetchBodas} />

      {/* Lista de bodas */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando bodas">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ background: 'rgba(255,252,246,0.5)' }} />
          ))}
        </div>
      ) : bodas.length === 0 ? (
        <div className="text-center py-14" role="status">
          <p className="text-3xl mb-3" style={{ color: '#A88A4B', opacity: 0.6 }}>✦</p>
          <p className="serif text-base font-medium" style={{ color: '#3F2E1F' }}>
            Aún no hay bodas registradas
          </p>
          <p className="text-xs mt-1.5" style={{ color: '#8B7E63' }}>
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
