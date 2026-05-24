'use client'
import { useState } from 'react'
import { Copy, Check, Trash2, Users, UserCheck } from 'lucide-react'
import type { Invitado, EstadoInvitado } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'

interface Props {
  invitado: Invitado
  onDeleted: () => void
}

const BADGE: Record<EstadoInvitado, string> = {
  pendiente:  'badge-pendiente',
  confirmado: 'badge-confirmado',
  declino:    'badge-declino',
}

const LABEL: Record<EstadoInvitado, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  declino:    'Declinó',
}

export function GuestCard({ invitado, onDeleted }: Props) {
  const [copied, setCopied]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  const menores = invitado.pases_menores || 0
  const link = `${invitado.url_boda}?para=${encodeURIComponent(invitado.nombre)}&pases=${invitado.pases}${menores > 0 ? `&menores=${menores}` : ''}`

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function deleteGuest() {
    if (!confirm(`¿Eliminar la invitación de ${invitado.nombre}?`)) return
    setDeleting(true)
    await supabase.from('invitados').delete().eq('id', invitado.id)
    onDeleted()
  }

  const confirmados = invitado.pases_confirmados || 0

  return (
    <div className="glass-sm rounded-2xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in">
      {/* Avatar dorado */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 serif text-base font-semibold"
        style={{
          background: 'linear-gradient(135deg, #D4BC85 0%, #A88A4B 100%)',
          color: '#FFFCF6',
          boxShadow: '0 4px 12px rgba(168,138,75,0.22)',
        }}
        aria-hidden="true"
      >
        {invitado.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="serif font-semibold text-base leading-tight truncate" style={{ color: '#3F2E1F' }}>
          {invitado.nombre}
        </p>
        <div className="flex items-center gap-2 mt-1 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: '#8B7E63' }}>
            <Users size={11} strokeWidth={2} />
            {invitado.pases} {invitado.pases === 1 ? 'pase' : 'pases'}
            {menores > 0 && (
              <span style={{ color: '#876338' }}>
                {' '}+ {menores} {menores === 1 ? 'menor' : 'menores'}
              </span>
            )}
          </span>
          {invitado.estado === 'confirmado' && (
            <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2F5A28' }}>
              <UserCheck size={11} strokeWidth={2} />
              {confirmados} de {invitado.pases + menores} asisten
            </span>
          )}
          <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${BADGE[invitado.estado]}`}>
            {LABEL[invitado.estado]}
          </span>
        </div>
      </div>

      {/* Link preview */}
      <div className="hidden lg:block flex-1 min-w-0">
        <p className="text-xs truncate font-mono" style={{ color: '#A89876' }} title={link}>
          {link.length > 55 ? link.slice(0, 55) + '…' : link}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyLink}
          aria-label="Copiar link de invitación"
          title="Copiar link"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
          style={
            copied
              ? { background: 'rgba(107,155,100,0.14)', color: '#2F5A28', border: '1px solid rgba(107,155,100,0.30)' }
              : { background: 'rgba(168,138,75,0.10)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }
          }
        >
          {copied
            ? <><Check size={13} /><span>Copiado</span></>
            : <><Copy size={13} /><span>Copiar</span></>
          }
        </button>

        <button
          onClick={deleteGuest}
          disabled={deleting}
          aria-label={`Eliminar invitación de ${invitado.nombre}`}
          title="Eliminar invitación"
          className="p-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
          style={{ color: '#8B7E63' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#B85042'; e.currentTarget.style.background = 'rgba(184,80,66,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B7E63'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
