'use client'
import { useEffect, useState } from 'react'
import { PasswordGate } from '@/components/PasswordGate'
import { AdminPanel } from '@/components/AdminPanel'

export default function Home() {
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    const ok = sessionStorage.getItem('panel_auth_admin') === '1'
    setAuth(ok)
  }, [])

  if (auth === null) return null

  if (!auth) {
    return (
      <PasswordGate
        nombrePareja="Elysium Admin"
        password={(process.env.NEXT_PUBLIC_ADMIN_PASSWORD ?? 'elysium2026').trim()}
        slug="admin"
        onSuccess={() => setAuth(true)}
      />
    )
  }

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto mb-8">
        <div className="glass rounded-3xl px-6 py-5 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-semibold tracking-wide" style={{ color: '#9E0059' }}>
              Elysium — Panel Admin
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Gestión de bodas y paneles de invitados
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <AdminPanel />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: '#D1D5DB' }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
