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
        <div className="glass rounded-3xl px-6 py-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: '#A88A4B' }}>
              Elysium
            </p>
            <h1 className="serif text-2xl font-semibold tracking-wide" style={{ color: '#3F2E1F' }}>
              Panel Admin
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8B7E63' }}>
              Gestión de bodas y paneles de invitados
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <AdminPanel />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: '#A88A4B', opacity: 0.6 }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
