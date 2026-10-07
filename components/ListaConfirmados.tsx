'use client'
import { useState } from 'react'
import { Users, Download, ChevronDown, ChevronUp } from 'lucide-react'
import jsPDF from 'jspdf'
import type { Invitado } from '@/lib/supabase'
import { usePrefs } from '@/lib/prefs'

interface Props {
  invitados: Invitado[]
  nombreBoda: string
}

export function ListaConfirmados({ invitados, nombreBoda }: Props) {
  const [expandido, setExpandido] = useState(true)
  const [generando, setGenerando] = useState(false)
  const { tr, idioma } = usePrefs()
  const personasTxt = (n: number) => n === 1 ? tr('persona', 'person') : tr('personas', 'people')
  const deTxt = tr('de', 'of')

  const confirmados = invitados.filter(i => i.estado === 'confirmado')

  // Aplanar todos los nombres confirmados en una sola lista con su invitación origen
  const personas: Array<{ nombre: string; invitacion: string }> = []
  confirmados.forEach(inv => {
    const lista = inv.nombres_confirmados || []
    if (lista.length > 0) {
      lista.forEach(n => personas.push({ nombre: n, invitacion: inv.nombre }))
    } else {
      const total = inv.pases_confirmados || 0
      for (let i = 0; i < total; i++) {
        personas.push({
          nombre: total === 1 ? inv.nombre : `${inv.nombre} (#${i + 1})`,
          invitacion: inv.nombre,
        })
      }
    }
  })

  function descargarPDF() {
    setGenerando(true)
    try {
      const doc = new jsPDF({ unit: 'pt', format: 'letter' })
      const pageWidth = doc.internal.pageSize.getWidth()
      const margin = 50
      let y = 60

      /* Header con paleta crema + dorado */
      doc.setFillColor(168, 138, 75) // gold
      doc.rect(0, 0, pageWidth, 96, 'F')
      doc.setTextColor(255, 252, 246) // crema-soft
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(9)
      doc.text('ELYSIUM INVITACIONES', pageWidth / 2, 24, { align: 'center' })
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(22)
      doc.text(tr('Lista de Confirmados', 'Confirmed Guests'), pageWidth / 2, 50, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(nombreBoda, pageWidth / 2, 72, { align: 'center' })
      doc.setFontSize(9)
      doc.text(
        `${tr('Generado el', 'Generated on')} ${new Date().toLocaleDateString(idioma === 'en' ? 'en-US' : 'es-MX', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}`,
        pageWidth / 2, 88, { align: 'center' }
      )

      y = 138

      /* Resumen */
      doc.setTextColor(63, 46, 31) // mocha
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`${tr('Total de personas confirmadas', 'Total confirmed guests')}: ${personas.length}`, margin, y)
      y += 18
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(139, 126, 99) // taupe
      doc.text(`${tr('Invitaciones confirmadas', 'Confirmed invitations')}: ${confirmados.length}`, margin, y)
      y += 30

      /* Lista agrupada por invitación */
      confirmados.forEach(inv => {
        if (y > 720) { doc.addPage(); y = 60 }

        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(135, 99, 56) // bronze
        doc.text(inv.nombre, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(139, 126, 99)
        const totalPersonas = inv.pases + (inv.pases_menores || 0)
        const subt = `(${inv.pases_confirmados || 0} ${deTxt} ${totalPersonas} ${personasTxt(totalPersonas)})`
        const w = doc.getTextWidth(inv.nombre)
        doc.text(subt, margin + w + 8, y)
        y += 14

        const lista = inv.nombres_confirmados || []
        doc.setFontSize(10)
        if (lista.length === 0) {
          doc.setTextColor(184, 167, 130)
          doc.text(`  • (${tr('Sin nombres registrados', 'No names recorded')})`, margin + 10, y)
          y += 14
        } else {
          lista.forEach((n, idx) => {
            if (y > 740) { doc.addPage(); y = 60 }
            doc.setTextColor(63, 46, 31)
            doc.text(`  ${idx + 1}. ${n}`, margin + 10, y)
            y += 14
          })
        }
        y += 8
      })

      if (confirmados.length === 0) {
        doc.setTextColor(184, 167, 130)
        doc.setFontSize(11)
        doc.text(tr('Aún no hay confirmaciones.', 'No confirmations yet.'), pageWidth / 2, y + 40, { align: 'center' })
      }

      /* Footer */
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setTextColor(184, 167, 130)
        doc.setFontSize(8)
        doc.text(
          `${tr('Página', 'Page')} ${i} ${deTxt} ${totalPages}  ·  Elysium Invitaciones`,
          pageWidth / 2, doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        )
      }

      const safeName = nombreBoda.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      doc.save(`${tr('confirmados', 'confirmed')}-${safeName || tr('boda', 'event')}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-6">
      <div className="flex items-center justify-between gap-3 mb-1 flex-wrap">
        <button
          type="button"
          onClick={() => setExpandido(v => !v)}
          className="flex items-center gap-2 serif text-lg font-semibold"
          style={{ color: 'var(--ink)' }}
          aria-expanded={expandido}
        >
          <Users size={18} strokeWidth={1.8} style={{ color: 'var(--gold-t)' }} />
          {tr('Lista de confirmados', 'Confirmed list')}
          <span
            className="text-xs px-2.5 py-0.5 rounded-full font-medium tabular-nums"
            style={{ background: 'rgba(107,155,100,0.14)', color: 'var(--ok-t)', border: '1px solid rgba(107,155,100,0.28)' }}
          >
            {personas.length}
          </span>
          {expandido ? <ChevronUp size={16} style={{ color: 'var(--muted)' }} /> : <ChevronDown size={16} style={{ color: 'var(--muted)' }} />}
        </button>

        <button
          type="button"
          onClick={descargarPDF}
          disabled={generando || personas.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)',
            color: '#FFFCF6',
            boxShadow: '0 3px 12px rgba(168,138,75,0.28)',
          }}
          title={tr('Descargar lista en PDF', 'Download list as PDF')}
        >
          <Download size={13} strokeWidth={2} />
          {generando ? tr('Generando…', 'Generating…') : tr('Descargar PDF', 'Download PDF')}
        </button>
      </div>

      {expandido && (
        <div className="mt-4">
          {personas.length === 0 ? (
            <p className="text-sm text-center py-8" style={{ color: 'var(--gold-t)', opacity: 0.7 }}>
              {tr('Aún no hay personas confirmadas.', 'No confirmed guests yet.')}
            </p>
          ) : (
            <div className="space-y-3">
              {confirmados.map(inv => {
                const lista = inv.nombres_confirmados || []
                return (
                  <div key={inv.id} className="glass-sm rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="serif font-semibold text-base" style={{ color: 'var(--bronze-t)' }}>
                        {inv.nombre}
                      </p>
                      <span className="text-xs tabular-nums" style={{ color: 'var(--muted)' }}>
                        {(() => {
                          const total = inv.pases + (inv.pases_menores || 0)
                          return `${inv.pases_confirmados || 0} ${deTxt} ${total} ${personasTxt(total)}`
                        })()}
                      </span>
                    </div>
                    {lista.length === 0 ? (
                      <p className="text-xs italic" style={{ color: 'var(--muted-2)' }}>
                        {tr('Sin nombres registrados', 'No names recorded')}
                      </p>
                    ) : (
                      <ol className="space-y-1.5">
                        {lista.map((n, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2.5" style={{ color: 'var(--ink)' }}>
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0 tabular-nums"
                              style={{ background: 'rgba(107,155,100,0.14)', color: 'var(--ok-t)' }}
                            >
                              {idx + 1}
                            </span>
                            {n}
                          </li>
                        ))}
                      </ol>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
