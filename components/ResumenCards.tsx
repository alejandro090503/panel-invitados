'use client'
import { Mail, CheckCircle2, Clock, XCircle, Ticket, UserCheck } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
}

export function ResumenCards({ invitados }: Props) {
  const invitaciones     = invitados.length
  const confirmadas      = invitados.filter(i => i.estado === 'confirmó').length
  const pendientes       = invitados.filter(i => i.estado === 'pendiente').length
  const declinadas       = invitados.filter(i => i.estado === 'declinó').length
  const pasesEnviados    = invitados.reduce((s, i) => s + i.pases, 0)
  const personasConfirmadas = invitados
    .filter(i => i.estado === 'confirmó')
    .reduce((s, i) => s + (i.pases_confirmados || i.pases), 0)

  const cards = [
    { label: 'Invitaciones',         value: invitaciones,        icon: Mail,        color: '#9E0059',  bg: 'rgba(158,0,89,.08)'   },
    { label: 'Pases enviados',       value: pasesEnviados,       icon: Ticket,      color: '#7C3AED',  bg: 'rgba(124,58,237,.08)' },
    { label: 'Personas confirmadas', value: personasConfirmadas, icon: UserCheck,   color: '#059669',  bg: 'rgba(5,150,105,.08)'  },
    { label: 'Pendientes',           value: pendientes,          icon: Clock,       color: '#D97706',  bg: 'rgba(217,119,6,.08)'  },
    { label: 'Declinaron',           value: declinadas,          icon: XCircle,     color: '#DC2626',  bg: 'rgba(220,38,38,.08)'  },
  ]

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      {cards.map(({ label, value, icon: Icon, color, bg }) => (
        <div key={label} className="glass-sm rounded-2xl px-4 py-4 flex flex-col items-center gap-1 text-center">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-1" style={{ background: bg }}>
            <Icon size={18} color={color} strokeWidth={1.8} />
          </div>
          <span className="text-2xl font-semibold tabular-nums" style={{ color }}>{value}</span>
          <span className="text-xs" style={{ color: '#6B7280' }}>{label}</span>
        </div>
      ))}
    </div>
  )
}
