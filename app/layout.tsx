import type { Metadata } from 'next'
import { Cormorant_Garamond, Inter } from 'next/font/google'
import './globals.css'
import { PrefsProvider, SCRIPT_TEMA_INICIAL } from '@/lib/prefs'
import { PrefsFlotante } from '@/components/PrefsFlotante'

const inter = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
})

const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'Panel de Invitados — Elysium',
  description: 'Gestión de invitados para tu boda',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${inter.variable} ${cormorant.variable} h-full`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: SCRIPT_TEMA_INICIAL }} />
      </head>
      <body className="min-h-dvh antialiased">
        <PrefsProvider>
          {children}
          <PrefsFlotante />
        </PrefsProvider>
      </body>
    </html>
  )
}
