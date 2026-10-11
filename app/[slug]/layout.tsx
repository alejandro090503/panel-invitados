import type { Metadata } from 'next'
import { leerBoda, partesEvento } from '@/lib/og'

// La página del panel es de cliente; el título y la vista previa al compartir
// el link se arman aquí, en el servidor, con el nombre del evento.
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params
  const boda = await leerBoda(slug)
  const { tipo, nombre } = partesEvento(boda)
  const titulo = boda ? `${nombre} · Panel de invitados` : 'Panel de invitados — Elysium'
  const descripcion = boda
    ? `${tipo} ${nombre} — confirmaciones en tiempo real. Acceso privado con contraseña.`
    : 'Gestión de invitados — Elysium Invitaciones'
  return {
    title: titulo,
    description: descripcion,
    // Los paneles son privados: que no aparezcan en buscadores
    robots: { index: false, follow: false },
    openGraph: { title: titulo, description: descripcion, type: 'website', siteName: 'Elysium Invitaciones', locale: 'es_MX' },
    twitter: { card: 'summary_large_image', title: titulo, description: descripcion },
  }
}

export default function PanelLayout({ children }: { children: React.ReactNode }) {
  return children
}
