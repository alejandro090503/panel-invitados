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
  pendiente: 'badge-pendiente',
  confirmó:  'badge-confirmó',
  declinó:   'badge-declinó',
}

const LABEL: Record<EstadoInvitado, string> = {
  pendiente: 'Pendiente',
  confirmó:  'Confirmó',
  declinó:   'Declinó',
}

export function GuestCard({ invitado, onDeleted }: Props) {
  const [copied, setCopied]   = useState(false)
  const [deleting, setDeleting] = useState(false)

  const link = `${invitado.url_boda}?para=${encodeURIComponent(invitado.nombre)}&pases=${invitado.pases}`

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
      {/* Avatar */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 text-white text-sm font-semibold"
        style={{ background: 'linear-gradient(135deg, #F9A8D4 0%, #9E0059 100%)' }}
        aria-hidden="true"
      >
        {invitado.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm truncate" style={{ color: '#1F1F2E' }}>
          {invitado.nombre}
        </p>
        <div className="flex items-center gap-2 mt-0.5 flex-wrap">
          <span className="flex items-center gap-1 text-xs" style={{ color: '#6B7280' }}>
            <Users size={11} strokeWidth={2} />
            {invitado.pases} {invitado.pases === 1 ? 'pase' : 'pases'}
          </span>
          {invitado.estado === 'confirmó' && (
            <span className="flex items-center gap-1 text-xs" style={{ color: '#059669' }}>
              <UserCheck size={11} strokeWidth={2} />
              {confirmados} de {invitado.pases} asisten
            </span>
          )}
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${BADGE[invitado.estado]}`}>
            {LABEL[invitado.estado]}
          </span>
        </div>
      </div>

      {/* Link preview */}
      <div className="hidden lg:block flex-1 min-w-0">
        <p className="text-xs text-gray-400 truncate font-mono" title={link}>
          {link.length > 55 ? link.slice(0, 55) + '…' : link}
        </p>
      </div>

      {/* Acciones */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={copyLink}
          aria-label="Copiar link de invitación"
          title="Copiar link"
          className="
            flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium
            transition-all duration-200 active:scale-95
          "
          style={{
            background: copied ? 'rgba(5,150,105,.12)' : 'rgba(158,0,89,.08)',
            color: copied ? '#059669' : '#9E0059',
            border: `1px solid ${copied ? 'rgba(5,150,105,.25)' : 'rgba(158,0,89,.2)'}`,
          }}
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
          className="
            p-2 rounded-xl transition-all duration-200 active:scale-95
            text-gray-400 hover:text-red-500
            hover:bg-red-50 disabled:opacity-50
          "
        >
          <Trash2 size={15} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
