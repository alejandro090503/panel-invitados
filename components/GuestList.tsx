'use client'
import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { Invitado } from '@/lib/supabase'
import { GuestCard } from './GuestCard'
import { ResumenCards } from './ResumenCards'
import { AddGuestForm } from './AddGuestForm'
import { ListaConfirmados } from './ListaConfirmados'

interface Props {
  urlBoda: string
  nombreBoda: string
}

export function GuestList({ urlBoda, nombreBoda }: Props) {
  const [invitados, setInvitados] = useState<Invitado[]>([])
  const [loading, setLoading]     = useState(true)
  const [filter, setFilter]       = useState<'todos' | 'pendiente' | 'confirmado' | 'declino'>('todos')

  const fetchInvitados = useCallback(async () => {
    const normalizedUrl = urlBoda.trim().replace(/\/+$/, '')
    const { data, error } = await supabase
      .from('invitados')
      .select('*')
      .eq('url_boda', normalizedUrl)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch invitados error:', error)
    }
    setInvitados((data as Invitado[]) ?? [])
    setLoading(false)
  }, [urlBoda])

  useEffect(() => {
    fetchInvitados()

    // Tiempo real — escucha cambios en la tabla
    const normalizedUrl = urlBoda.trim().replace(/\/+$/, '')
    const channel = supabase
      .channel(`invitados-${normalizedUrl}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'invitados',
        filter: `url_boda=eq.${normalizedUrl}`,
      }, () => {
        fetchInvitados()
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [fetchInvitados, urlBoda])

  const filtered = filter === 'todos' ? invitados : invitados.filter(i => i.estado === filter)

  const filters: Array<{ key: typeof filter; label: string }> = [
    { key: 'todos',     label: 'Todos'      },
    { key: 'pendiente', label: 'Pendientes' },
    { key: 'confirmado',  label: 'Confirmados'},
    { key: 'declino',   label: 'Declinaron' },
  ]

  return (
    <div className="space-y-6">
      <ResumenCards invitados={invitados} />

      <AddGuestForm urlBoda={urlBoda.trim().replace(/\/+$/, '')} onAdded={fetchInvitados} />

      <ListaConfirmados invitados={invitados} nombreBoda={nombreBoda} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar invitaciones">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className="px-4 py-1.5 rounded-full text-xs font-medium transition-all duration-200 active:scale-95"
            style={filter === f.key
              ? { background: 'linear-gradient(135deg,#C2185B,#9E0059)', color: '#fff', boxShadow: '0 2px 8px rgba(158,0,89,.28)' }
              : { background: 'rgba(255,255,255,.55)', color: '#9E0059', border: '1px solid rgba(158,0,89,.2)' }
            }
          >
            {f.label}
            {f.key !== 'todos' && (
              <span className="ml-1 opacity-70">
                ({invitados.filter(i => i.estado === f.key).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando invitaciones">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-2xl bg-white/40 animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14" role="status">
          <p className="text-3xl mb-3">💌</p>
          <p className="text-sm font-medium" style={{ color: '#9E0059' }}>
            {filter === 'todos' ? 'Aún no hay invitaciones' : 'Sin invitaciones en este filtro'}
          </p>
          {filter === 'todos' && (
            <p className="text-xs mt-1" style={{ color: '#9CA3AF' }}>
              Usa el formulario de arriba para agregar la primera.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5" aria-label="Lista de invitaciones">
          {filtered.map(inv => (
            <GuestCard key={inv.id} invitado={inv} onDeleted={fetchInvitados} />
          ))}
        </div>
      )}
    </div>
  )
}
