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
    { key: 'todos',     label: 'Todas'       },
    { key: 'pendiente', label: 'Pendientes'  },
    { key: 'confirmado',label: 'Confirmadas' },
    { key: 'declino',   label: 'Declinaron'  },
  ]

  const usaMenores = urlBoda.includes('mariana-y-pedro') || urlBoda.includes('alejandro-y-mayreli') || urlBoda.includes('xv-melissa') || urlBoda.includes('hector-y-cecilia') || urlBoda.includes('xv-ailin') || urlBoda.includes('laura-y-jorge') || urlBoda.includes('dulce-y-david') || urlBoda.includes('zeltzin-y-gabriel') || urlBoda.includes('xv-mia-psi') || urlBoda.includes('neidy-y-cesar')
  const usaNombres = urlBoda.includes('roxana-y-omar') || urlBoda.includes('carolina-y-alfonso') || urlBoda.includes('francisco-y-fernanda') || urlBoda.includes('rosa-y-jorge') || urlBoda.includes('abigail-y-judith') || urlBoda.includes('salvador-y-jacqueline') || urlBoda.includes('veronica-y-pedro') || urlBoda.includes('jessica-y-jesus') || urlBoda.includes('ariadna-y-carlos') || urlBoda.includes('isamar-y-erik') || urlBoda.includes('xv-valerie') || urlBoda.includes('emilio-y-monica') || urlBoda.includes('hitver-y-oriana') || urlBoda.includes('georgina-y-andres') || urlBoda.includes('eduardo-y-karen') || urlBoda.includes('xv-maria-libertad') || urlBoda.includes('maria-y-ivan') || urlBoda.includes('stephany-y-alberto') || urlBoda.includes('angel-y-jaquelinne') || urlBoda.includes('ana-karen-y-oswaldo') || urlBoda.includes('cristopher-y-tania') || urlBoda.includes('abraham-y-america') || urlBoda.includes('paola-e-ivan') || urlBoda.includes('maria-y-alvaro') || urlBoda.includes('carlos-y-yesenia') || urlBoda.includes('cinthia-y-sergio') || urlBoda.includes('sarahi-y-miguel') || urlBoda.includes('deny-y-arturo') || urlBoda.includes('xv-celeste-melgar') || urlBoda.includes('jessica-y-jessica') || urlBoda.includes('raiza-hernandez-y-orlando-acevedo') || urlBoda.includes('lorena-y-orlando')

  return (
    <div className="space-y-6">
      <ResumenCards invitados={invitados} />

      <AddGuestForm urlBoda={urlBoda.trim().replace(/\/+$/, '')} onAdded={fetchInvitados} showMenores={usaMenores} nombresMode={usaNombres} />

      <ListaConfirmados invitados={invitados} nombreBoda={nombreBoda} />

      {/* Filtros */}
      <div className="flex flex-wrap gap-2" role="group" aria-label="Filtrar invitaciones">
        {filters.map(f => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            aria-pressed={filter === f.key}
            className="px-4 py-1.5 rounded-full text-xs font-medium uppercase tracking-wider transition-all duration-200 active:scale-95"
            style={filter === f.key
              ? {
                  background: 'linear-gradient(135deg, #C9A961, #A88A4B)',
                  color: '#FFFCF6',
                  boxShadow: '0 3px 12px rgba(168,138,75,0.32)',
                }
              : {
                  background: 'rgba(255,252,246,0.55)',
                  color: '#876338',
                  border: '1px solid rgba(168,138,75,0.25)',
                }
            }
          >
            {f.label}
            {f.key !== 'todos' && (
              <span className="ml-1.5 opacity-70 tabular-nums">
                {invitados.filter(i => i.estado === f.key).length}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Lista */}
      {loading ? (
        <div className="space-y-3" aria-busy="true" aria-label="Cargando invitaciones">
          {[1,2,3].map(i => (
            <div key={i} className="h-16 rounded-2xl animate-pulse" style={{ background: 'rgba(255,252,246,0.5)' }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-14" role="status">
          <p className="text-3xl mb-3" style={{ color: '#A88A4B', opacity: 0.55 }}>✦</p>
          <p className="serif text-base font-medium" style={{ color: '#3F2E1F' }}>
            {filter === 'todos' ? 'Aún no hay invitaciones' : 'Sin invitaciones en este filtro'}
          </p>
          {filter === 'todos' && (
            <p className="text-xs mt-1.5" style={{ color: '#8B7E63' }}>
              Usa el formulario de arriba para agregar la primera.
            </p>
          )}
        </div>
      ) : (
        <div className="space-y-2.5" aria-label="Lista de invitaciones">
          {filtered.map(inv => (
            <GuestCard key={inv.id} invitado={inv} nombreBoda={nombreBoda} showMenores={usaMenores} onDeleted={fetchInvitados} />
          ))}
        </div>
      )}
    </div>
  )
}
