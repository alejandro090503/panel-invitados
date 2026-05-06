'use client'
import { useEffect, useState } from 'react'
import { PasswordGate } from '@/components/PasswordGate'
import { GuestList } from '@/components/GuestList'

export default function Home() {
  const [auth, setAuth] = useState<boolean | null>(null)

  // URL de la boda — configurable desde env o query param
  const [urlBoda] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      return params.get('boda') ?? process.env.NEXT_PUBLIC_URL_BODA ?? 'https://tu-boda.vercel.app'
    }
    return process.env.NEXT_PUBLIC_URL_BODA ?? 'https://tu-boda.vercel.app'
  })

  useEffect(() => {
    const ok = sessionStorage.getItem('panel_auth') === '1'
    setAuth(ok)
  }, [])

  if (auth === null) return null

  if (!auth) return <PasswordGate onSuccess={() => setAuth(true)} />

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="max-w-4xl mx-auto mb-8">
        <div className="glass rounded-3xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-wide" style={{ color: '#9E0059' }}>
              Panel de Invitados
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Elysium Invitaciones · Tiempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs" style={{ color: '#6B7280' }}>En vivo</span>
          </div>
        </div>
      </div>

      {/* Panel principal */}
      <div className="max-w-4xl mx-auto">
        <GuestList urlBoda={urlBoda} />
      </div>

      {/* Footer */}
      <p className="text-center text-xs mt-10" style={{ color: '#D1D5DB' }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
