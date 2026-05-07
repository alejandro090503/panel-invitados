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

  const panelUrl = `${window.location.origin}/${boda.slug}`

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
      <div className="flex items-start justify-between mb-3">
        <div>
          <h3 className="font-semibold text-base" style={{ color: '#1F1F2E' }}>
            {boda.nombre}
          </h3>
          <p className="text-xs mt-0.5 font-mono truncate max-w-[260px]" style={{ color: '#9CA3AF' }}>
            /{boda.slug}
          </p>
        </div>
        <a
          href={boda.url_boda}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Abrir invitación de ${boda.nombre}`}
          className="p-2 rounded-xl text-gray-400 hover:text-pink-500 hover:bg-pink-50 transition-all"
        >
          <ExternalLink size={15} strokeWidth={1.8} />
        </a>
      </div>

      {/* Stats */}
      <div className="flex gap-4 mb-4">
        <div className="flex items-center gap-1.5 text-xs" style={{ color: '#6B7280' }}>
          <Users size={13} strokeWidth={2} />
          <span><strong className="font-semibold" style={{ color: '#1F1F2E' }}>{stats.total}</strong> invitados</span>
        </div>
        <div className="text-xs" style={{ color: '#059669' }}>
          {stats.confirmados} confirmados
        </div>
        <div className="text-xs" style={{ color: '#D97706' }}>
          {stats.pendientes} pendientes
        </div>
      </div>

      {/* Acciones */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => copyText(panelUrl, 'panel')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
          style={{
            background: copied === 'panel' ? 'rgba(5,150,105,.12)' : 'rgba(158,0,89,.08)',
            color: copied === 'panel' ? '#059669' : '#9E0059',
            border: `1px solid ${copied === 'panel' ? 'rgba(5,150,105,.25)' : 'rgba(158,0,89,.2)'}`,
          }}
        >
          {copied === 'panel'
            ? <><Check size={13} /> Copiado</>
            : <><Copy size={13} /> Copiar link del panel</>
          }
        </button>

        <button
          onClick={() => copyText(boda.password, 'pass')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
          style={{
            background: copied === 'pass' ? 'rgba(5,150,105,.12)' : 'rgba(124,58,237,.08)',
            color: copied === 'pass' ? '#059669' : '#7C3AED',
            border: `1px solid ${copied === 'pass' ? 'rgba(5,150,105,.25)' : 'rgba(124,58,237,.2)'}`,
          }}
        >
          {copied === 'pass'
            ? <><Check size={13} /> Copiado</>
            : <><KeyRound size={13} /> Copiar contraseña</>
          }
        </button>

        <button
          onClick={deleteBoda}
          aria-label={`Eliminar panel de ${boda.nombre}`}
          className="p-2 rounded-xl text-gray-400 hover:text-red-500 hover:bg-red-50 transition-all duration-200 active:scale-95 ml-auto"
        >
          <Trash2 size={14} strokeWidth={1.8} />
        </button>
      </div>
    </div>
  )
}
