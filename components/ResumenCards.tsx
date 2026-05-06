'use client'
import { Users, CheckCircle2, Clock, XCircle, Ticket } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
}

export function ResumenCards({ invitados }: Props) {
  const total        = invitados.length
  const confirmados  = invitados.filter(i => i.estado === 'confirmó').length
  const pendientes   = invitados.filter(i => i.estado === 'pendiente').length
  const declinados   = invitados.filter(i => i.estado === 'declinó').length
  const totalPases   = invitados.filter(i => i.estado !== 'declinó').reduce((s, i) => s + i.pases, 0)

  const cards = [
    { label: 'Invitados',     value: total,       icon: Users,        color: '#9E0059',  bg: 'rgba(158,0,89,.08)'   },
    { label: 'Confirmados',   value: confirmados,  icon: CheckCircle2, color: '#059669',  bg: 'rgba(5,150,105,.08)'  },
    { label: 'Pendientes',    value: pendientes,   icon: Clock,        color: '#D97706',  bg: 'rgba(217,119,6,.08)'  },
    { label: 'Declinaron',    value: declinados,   icon: XCircle,      color: '#DC2626',  bg: 'rgba(220,38,38,.08)'  },
    { label: 'Pases totales', value: totalPases,   icon: Ticket,       color: '#7C3AED',  bg: 'rgba(124,58,237,.08)' },
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
