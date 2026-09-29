'use client'
import { Mail, Clock, XCircle, Ticket, UserCheck, Baby } from 'lucide-react'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
}

// Todas las tarjetas (menos "Invitaciones") cuentan PERSONAS, para que
// confirmadas + pendientes + declinaron = pases. Antes "Pendientes" contaba
// invitaciones y las demás personas: los números nunca cuadraban.
function lugares(i: Invitado) {
  return i.pases + (i.pases_menores || 0)
}
function confirmadosDe(i: Invitado) {
  return i.estado === 'confirmado' ? (i.pases_confirmados || lugares(i)) : 0
}

export function ResumenCards({ invitados }: Props) {
  const invitaciones        = invitados.length
  const totalPases          = invitados.reduce((s, i) => s + lugares(i), 0)
  const personasConfirmadas = invitados.reduce((s, i) => s + confirmadosDe(i), 0)
  const pendientes          = invitados
    .filter(i => i.estado === 'pendiente')
    .reduce((s, i) => s + lugares(i), 0)
  // Declinó toda la invitación, o confirmó menos lugares de los que tenía.
  const declinadas          = invitados.reduce((s, i) => {
    if (i.estado === 'declino')    return s + lugares(i)
    if (i.estado === 'confirmado') return s + Math.max(0, lugares(i) - confirmadosDe(i))
    return s
  }, 0)
  const totalMenores        = invitados.reduce((s, i) => s + (i.pases_menores || 0), 0)

  const cards = [
    { label: 'Invitaciones',         value: invitaciones,        icon: Mail,      color: '#A88A4B', bg: 'rgba(168,138,75,0.10)' },
    { label: 'Pases',                value: totalPases,          icon: Ticket,    color: '#876338', bg: 'rgba(135,99,56,0.10)'  },
    { label: 'Personas confirmadas', value: personasConfirmadas, icon: UserCheck, color: '#2F5A28', bg: 'rgba(107,155,100,0.12)' },
    { label: 'Personas pendientes',  value: pendientes,          icon: Clock,     color: '#6E4A18', bg: 'rgba(184,137,58,0.12)'  },
    { label: 'Personas que declinaron', value: declinadas,          icon: XCircle,   color: '#7A2A1F', bg: 'rgba(184,80,66,0.10)'   },
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
