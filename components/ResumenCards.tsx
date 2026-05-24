'use client'
import { Mail, Clock, XCircle, Ticket, UserCheck, Baby } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
}

export function ResumenCards({ invitados }: Props) {
  const invitaciones     = invitados.length
  const pendientes       = invitados.filter(i => i.estado === 'pendiente').length
  const declinadas       = invitados.filter(i => i.estado === 'declino').length
  const pasesAdultos     = invitados.reduce((s, i) => s + i.pases, 0)
  const pasesMenores     = invitados.reduce((s, i) => s + (i.pases_menores || 0), 0)
  const personasConfirmadas = invitados
    .filter(i => i.estado === 'confirmado')
    .reduce((s, i) => s + (i.pases_confirmados || (i.pases + (i.pases_menores || 0))), 0)

  /* Paleta — dorados con acentos semánticos */
  const cards = [
    { label: 'Invitaciones',         value: invitaciones,        icon: Mail,      color: '#A88A4B', bg: 'rgba(168,138,75,0.10)' },
    { label: 'Pases adultos',        value: pasesAdultos,        icon: Ticket,    color: '#876338', bg: 'rgba(135,99,56,0.10)'  },
    { label: 'Pases menores',        value: pasesMenores,        icon: Baby,      color: '#7A6A4E', bg: 'rgba(122,106,78,0.12)' },
    { label: 'Personas confirmadas', value: personasConfirmadas, icon: UserCheck, color: '#2F5A28', bg: 'rgba(107,155,100,0.12)' },
    { label: 'Pendientes',           value: pendientes,          icon: Clock,     color: '#6E4A18', bg: 'rgba(184,137,58,0.12)'  },
    { label: 'Declinaron',           value: declinadas,          icon: XCircle,   color: '#7A2A1F', bg: 'rgba(184,80,66,0.10)'   },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div
          key={label}
          className="glass-sm rounded-2xl px-4 py-5 flex flex-col items-center gap-1.5 text-center transition-transform duration-200 hover:-translate-y-0.5"
        >
          <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-1" style={{ background: bg }}>
            <Icon size={18} color={color} strokeWidth={1.8} />
          </div>
          <span className="serif text-3xl font-semibold tabular-nums leading-none" style={{ color }}>{value}</span>
          <span className="text-[11px] uppercase tracking-wider mt-0.5" style={{ color: '#8B7E63' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
