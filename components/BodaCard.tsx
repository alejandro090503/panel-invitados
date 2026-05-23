'use client'
import { useState, useEffect } from 'react'
import { Copy, Check, ExternalLink, Users, Trash2, KeyRound } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import type { Boda, Invitado } from '@/lib/supabase'

interface Props {
  boda: Boda
  onDeleted: () => void
}

export function BodaCard({ boda, onDeleted }: Props) {
  const [copied, setCopied] = useState<'panel' | 'pass' | null>(null)
  const [stats, setStats] = useState({ total: 0, confirmados: 0, pendientes: 0 })

  const panelUrl = typeof window !== 'undefined' ? `${window.location.origin}/${boda.slug}` : ''

  useEffect(() => {
    async function loadStats() {
      const { data } = await supabase
        .from('invitados')
        .select('estado')
        .eq('url_boda', boda.url_boda)
      if (!data) return
      const invitados = data as Pick<Invitado, 'estado'>[]
      setStats({
        total: invitados.length,
        confirmados: invitados.filter(i => i.estado === 'confirmado').length,
        pendientes: invitados.filter(i => i.estado === 'pendiente').length,
      })
    }
    loadStats()
  }, [boda.url_boda])

  async function copyText(text: string, type: 'panel' | 'pass') {
    await navigator.clipboard.writeText(text)
    setCopied(type)
    setTimeout(() => setCopied(null), 2000)
  }

  async function deleteBoda() {
    if (!confirm(`¿Eliminar el panel de ${boda.nombre}? Los invitados también se borrarán.`)) return
    await supabase.from('invitados').delete().eq('url_boda', boda.url_boda)
    await supabase.from('bodas').delete().eq('id', boda.id)
    onDeleted()
  }

  return (
    <div className="glass-sm rounded-2xl p-5 animate-in">
      {/* Header */}
      <div className="flex items-start justify-between mb-3 gap-3">
        <div className="min-w-0">
          <h3 className="serif font-semibold text-lg leading-tight" style={{ color: '#3F2E1F' }}>
            {boda.nombre}
          </h3>
          <p className="text-xs mt-1 font-mono truncate max-w-[260px]" style={{ color: '#8B7E63' }}>
            /{boda.slug}
          </p>
        </div>
        <a
          href={boda.url_boda}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir invitación de ${boda.nombre}`}
          className="p-2 rounded-xl transition-all duration-200 shrink-0"
          style={{ color: '#8B7E63' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#A88A4B'; e.currentTarget.style.background = 'rgba(168,138,75,0.10)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B7E63'; e.currentTarget.style.background = 'transparent' }}
        >
          <ExternalLink size={15} strokeWidth={1.8} />
        </a>
      </div>

      {/* Stats */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-xs">
        <div className="flex items-center gap-1.5" style={{ color: '#5D4A33' }}>
          <Users size={13} strokeWidth={2} style={{ color: '#A88A4B' }} />
          <span><strong className="font-semibold tabular-nums" style={{ color: '#3F2E1F' }}>{stats.total}</strong> invitaciones</span>
        </div>
        <div className="tabular-nums" style={{ color: '#2F5A28' }}>
          <strong className="font-semibold">{stats.confirmados}</strong> confirmadas
        </div>
        <div className="tabular-nums" style={{ color: '#6E4A18' }}>
          <strong className="font-semibold">{stats.pendientes}</strong> pendientes
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyText(panelUrl, 'panel')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
          style={
            copied === 'panel'
              ? { background: 'rgba(107,155,100,0.14)', color: '#2F5A28', border: '1px solid rgba(107,155,100,0.30)' }
              : { background: 'rgba(168,138,75,0.10)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }
          }
        >
          {copied === 'panel'
            ? <><Check size={13} /> Copiado</>
            : <><Copy size={13} /> Copiar link del panel</>
          }
        </button>

        <button
          onClick={() => copyText(boda.password, 'pass')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
          style={
            copied === 'pass'
              ? { background: 'rgba(107,155,100,0.14)', color: '#2F5A28', border: '1px solid rgba(107,155,100,0.30)' }
              : { background: 'rgba(168,138,75,0.10)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }
          }
        >
          {copied === 'pass'
            ? <><Check size={13} /> Copiado</>
            : <><KeyRound size={13} /> Copiar contraseña</>
          }
        </button>

        <button
          onClick={deleteBoda}
          aria-label={`Eliminar panel de ${boda.nombre}`}
          className="p-2 rounded-xl transition-all duration-200 active:scale-95 ml-auto"
          style={{ color: '#8B7E63' }}
          onMouseEnter={(e) => { e.currentTarget.style.color = '#B85042'; e.currentTarget.style.background = 'rgba(184,80,66,0.08)' }}
          onMouseLeave={(e) => { e.currentTarget.style.color = '#8B7E63'; e.currentTarget.style.background = 'transparent' }}
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
