import { imagenPanel, OG_SIZE } from '@/lib/og'

export const alt = 'Panel de invitados — Elysium Invitaciones'
export const size = OG_SIZE
export const contentType = 'image/png'

export default async function Image() {
  return imagenPanel('Elysium Invitaciones', 'Panel de invitados')
}
