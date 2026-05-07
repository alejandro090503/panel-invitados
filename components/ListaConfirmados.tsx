'use client'
import { useState } from 'react'
import { Users, Download, ChevronDown, ChevronUp } from 'lucide-react'
import jsPDF from 'jspdf'
import type { Invitado } from '@/lib/supabase'

interface Props {
  invitados: Invitado[]
  nombreBoda: string
}

export function ListaConfirmados({ invitados, nombreBoda }: Props) {
  const [expandido, setExpandido] = useState(true)
  const [generando, setGenerando] = useState(false)

  const confirmados = invitados.filter(i => i.estado === 'confirmado')

  // Aplanar todos los nombres confirmados en una sola lista con su invitación origen
  const personas: Array<{ nombre: string; invitacion: string }> = []
  confirmados.forEach(inv => {
    const lista = inv.nombres_confirmados || []
    if (lista.length > 0) {
      lista.forEach(n => personas.push({ nombre: n, invitacion: inv.nombre }))
    } else {
      // Si confirmaron pero no enviaron nombres (versión vieja), contamos por pases_confirmados
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

      // Header
      doc.setFillColor(158, 0, 89)
      doc.rect(0, 0, pageWidth, 90, 'F')
      doc.setTextColor(255, 255, 255)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(20)
      doc.text('Lista de Confirmados', pageWidth / 2, 38, { align: 'center' })
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(13)
      doc.text(nombreBoda, pageWidth / 2, 60, { align: 'center' })
      doc.setFontSize(9)
      doc.text(
        `Generado el ${new Date().toLocaleDateString('es-MX', {
          year: 'numeric', month: 'long', day: 'numeric',
        })}`,
        pageWidth / 2, 78, { align: 'center' }
      )

      y = 130

      // Resumen
      doc.setTextColor(31, 31, 46)
      doc.setFont('helvetica', 'bold')
      doc.setFontSize(11)
      doc.text(`Total de personas confirmadas: ${personas.length}`, margin, y)
      y += 18
      doc.setFont('helvetica', 'normal')
      doc.setFontSize(10)
      doc.setTextColor(107, 114, 128)
      doc.text(`Invitaciones confirmadas: ${confirmados.length}`, margin, y)
      y += 30

      // Lista agrupada por invitación
      doc.setTextColor(31, 31, 46)

      confirmados.forEach(inv => {
        if (y > 720) { doc.addPage(); y = 60 }

        // Nombre de la invitación
        doc.setFont('helvetica', 'bold')
        doc.setFontSize(11)
        doc.setTextColor(158, 0, 89)
        doc.text(inv.nombre, margin, y)
        doc.setFont('helvetica', 'normal')
        doc.setFontSize(9)
        doc.setTextColor(107, 114, 128)
        const subt = `(${inv.pases_confirmados || 0} de ${inv.pases} pases)`
        const w = doc.getTextWidth(inv.nombre)
        doc.text(subt, margin + w + 8, y)
        y += 14

        const lista = inv.nombres_confirmados || []
        doc.setTextColor(31, 31, 46)
        doc.setFontSize(10)
        if (lista.length === 0) {
          doc.setTextColor(156, 163, 175)
          doc.text('  • (Sin nombres registrados)', margin + 10, y)
          y += 14
        } else {
          lista.forEach((n, idx) => {
            if (y > 740) { doc.addPage(); y = 60 }
            doc.setTextColor(31, 31, 46)
            doc.text(`  ${idx + 1}. ${n}`, margin + 10, y)
            y += 14
          })
        }
        y += 8
      })

      if (confirmados.length === 0) {
        doc.setTextColor(156, 163, 175)
        doc.setFontSize(11)
        doc.text('Aún no hay confirmaciones.', pageWidth / 2, y + 40, { align: 'center' })
      }

      // Footer
      const totalPages = doc.getNumberOfPages()
      for (let i = 1; i <= totalPages; i++) {
        doc.setPage(i)
        doc.setTextColor(209, 213, 219)
        doc.setFontSize(8)
        doc.text(
          `Página ${i} de ${totalPages} · Elysium Invitaciones`,
          pageWidth / 2, doc.internal.pageSize.getHeight() - 20,
          { align: 'center' }
        )
      }

      const safeName = nombreBoda.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
      doc.save(`confirmados-${safeName || 'boda'}.pdf`)
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="glass rounded-2xl p-5">
      <div className="flex items-center justify-between gap-3 mb-3">
        <button
          type="button"
          onClick={() => setExpandido(v => !v)}
          className="flex items-center gap-2 text-base font-semibold"
          style={{ color: '#9E0059' }}
          aria-expanded={expandido}
        >
          <Users size={18} strokeWidth={1.8} />
          Lista de confirmados
          <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: 'rgba(5,150,105,.12)', color: '#059669' }}>
            {personas.length}
          </span>
          {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>

        <button
          type="button"
          onClick={descargarPDF}
          disabled={generando || personas.length === 0}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-medium text-white transition-all duration-200 active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'linear-gradient(135deg, #C2185B 0%, #9E0059 100%)' }}
          title="Descargar lista en PDF"
        >
          <Download size={13} strokeWidth={2} />
          {generando ? 'Generando…' : 'Descargar PDF'}
        </button>
      </div>

      {expandido && (
        <div className="mt-3">
          {personas.length === 0 ? (
            <p className="text-sm text-center py-6" style={{ color: '#9CA3AF' }}>
              Aún no hay personas confirmadas.
            </p>
          ) : (
            <div className="space-y-3">
              {confirmados.map(inv => {
                const lista = inv.nombres_confirmados || []
                return (
                  <div key={inv.id} className="glass-sm rounded-xl px-4 py-3">
                    <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
                      <p className="text-sm font-semibold" style={{ color: '#9E0059' }}>
                        {inv.nombre}
                      </p>
                      <span className="text-xs" style={{ color: '#6B7280' }}>
                        {inv.pases_confirmados || 0} de {inv.pases} pases
                      </span>
                    </div>
                    {lista.length === 0 ? (
                      <p className="text-xs italic" style={{ color: '#9CA3AF' }}>
                        Sin nombres registrados
                      </p>
                    ) : (
                      <ol className="space-y-1">
                        {lista.map((n, idx) => (
                          <li key={idx} className="text-sm flex items-center gap-2" style={{ color: '#1F1F2E' }}>
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-semibold shrink-0"
                              style={{ background: 'rgba(5,150,105,.12)', color: '#059669' }}
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
