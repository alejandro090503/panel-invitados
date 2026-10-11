import { imagenPanel, leerBoda, partesEvento, OG_SIZE } from '@/lib/og'

export const alt = 'Panel de invitados — Elysium Invitaciones'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const { tipo, nombre } = partesEvento(await leerBoda(slug))
  return imagenPanel(tipo, nombre)
}
