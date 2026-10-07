'use client'
import { Mail, Clock, XCircle, Ticket, UserCheck, Baby, CircleDashed } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'
import { lugares, confirmadosDe, declinadosDe, sinUsarDe } from '@/lib/conteo'
import { usePrefs } from '@/lib/prefs'

interface Props {
  invitados: Invitado[]
}

// Todas las tarjetas (menos "Invitaciones") cuentan PERSONAS:
// confirmadas + pendientes + declinaron + lugares sin usar = pases.
export function ResumenCards({ invitados }: Props) {
  const { tr } = usePrefs()
  const suma = (f: (i: Invitado) => number) => invitados.reduce((s, i) => s + f(i), 0)
  const invitaciones        = invitados.length
  const totalPases          = suma(lugares)
  const personasConfirmadas = suma(confirmadosDe)
  const pendientes          = suma(i => (i.estado === 'pendiente' ? lugares(i) : 0))
  const declinadas          = suma(declinadosDe)
  const sinUsar             = suma(sinUsarDe)
  const totalMenores        = invitados.reduce((s, i) => s + (i.pases_menores || 0), 0)

  const cards = [
    { label: tr('Invitaciones', 'Invitations'),       value: invitaciones,        icon: Mail,      color: 'var(--gold-t)', bg: 'rgba(168,138,75,0.10)' },
    { label: tr('Pases', 'Seats'), value: totalPases,          icon: Ticket,    color: 'var(--bronze-t)', bg: 'rgba(135,99,56,0.10)'  },
    { label: tr('Personas confirmadas', 'Confirmed guests'), value: personasConfirmadas, icon: UserCheck, color: 'var(--ok-t)', bg: 'rgba(107,155,100,0.12)' },
    { label: tr('Personas pendientes', 'Pending guests'), value: pendientes,          icon: Clock,     color: 'var(--warn-t)', bg: 'rgba(184,137,58,0.12)'  },
    { label: tr('Personas que declinaron', 'Guests who declined'), value: declinadas,          icon: XCircle,   color: 'var(--err-t)', bg: 'rgba(184,80,66,0.10)'   },
    // Solo aparece si alguna familia confirmó menos lugares de los que tenía
    ...(sinUsar > 0
      ? [{ label: tr('Lugares sin usar', 'Unused seats'), value: sinUsar, icon: CircleDashed, color: 'var(--muted)', bg: 'rgba(139,126,99,0.12)' }]
      : []),
    // La tarjeta de Menores solo aparece en bodas que asignan pases para menores
    ...(totalMenores > 0
      ? [{ label: tr('Menores', 'Children'), value: totalMenores, icon: Baby, color: 'var(--warn-t)', bg: 'rgba(201,166,100,0.14)' }]
      : []),
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${cards.length >= 7 ? 'lg:grid-cols-7' : cards.length >= 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="glass-sm rounded-2xl px-4 py-5 flex flex-col items-center gap-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: bg }}>
            <Icon size={18} color={color} strokeWidth={1.8} />
          </div>
          <span className="serif text-3xl font-semibold tabular-nums leading-none" style={{ color }}>{value}</span>
          <span className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted)' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
