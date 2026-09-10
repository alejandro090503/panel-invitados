'use client'
import { Mail, Clock, XCircle, Ticket, UserCheck, Baby } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
}

export function ResumenCards({ invitados }: Props) {
  const invitaciones        = invitados.length
  const pendientes          = invitados.filter(i => i.estado === 'pendiente').length
  const declinadas          = invitados.reduce((s, i) => {
    const asignados = i.nombres_asignados ?? []
    if (asignados.length > 0) {
      // Modo nombres específicos: cuenta declinados individuales (incluso si el grupo está "confirmado")
      if (i.estado === 'pendiente') return s
      if (i.estado === 'declino')   return s + asignados.length
      const conf = (i.nombres_confirmados ?? []).length
      return s + Math.max(0, asignados.length - conf)
    }
    // Modo estándar: solo cuenta cuando todo el grupo declinó
    return i.estado === 'declino' ? s + i.pases + (i.pases_menores || 0) : s
  }, 0)
  const totalPases          = invitados.reduce((s, i) => s + i.pases + (i.pases_menores || 0), 0)
  const personasConfirmadas = invitados
    .filter(i => i.estado === 'confirmado')
    .reduce((s, i) => s + (i.pases_confirmados || i.pases), 0)
  const totalMenores        = invitados.reduce((s, i) => s + (i.pases_menores || 0), 0)

  const cards = [
    { label: 'Invitaciones',         value: invitaciones,        icon: Mail,      color: '#A88A4B', bg: 'rgba(168,138,75,0.10)' },
    { label: 'Pases',                value: totalPases,          icon: Ticket,    color: '#876338', bg: 'rgba(135,99,56,0.10)'  },
    { label: 'Personas confirmadas', value: personasConfirmadas, icon: UserCheck, color: '#2F5A28', bg: 'rgba(107,155,100,0.12)' },
    { label: 'Pendientes',           value: pendientes,          icon: Clock,     color: '#6E4A18', bg: 'rgba(184,137,58,0.12)'  },
    { label: 'Declinaron',           value: declinadas,          icon: XCircle,   color: '#7A2A1F', bg: 'rgba(184,80,66,0.10)'   },
    // La tarjeta de Menores solo aparece en bodas que asignan pases para menores
    ...(totalMenores > 0
      ? [{ label: 'Menores', value: totalMenores, icon: Baby, color: '#6E4A18', bg: 'rgba(201,166,100,0.14)' }]
      : []),
  ]

  return (
    <div className={`grid grid-cols-2 sm:grid-cols-3 ${cards.length >= 6 ? 'lg:grid-cols-6' : 'lg:grid-cols-5'} gap-3`}>
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
