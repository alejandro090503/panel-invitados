import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Panel de Invitados — Elysium',
  description: 'Gestión de invitados para tu boda',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className="h-full">
      <body className="min-h-dvh antialiased">{children}</body>
    </html>
  )
}
