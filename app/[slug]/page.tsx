'use client'
import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import type { Boda } from '@/lib/supabase'
import { PasswordGate } from '@/components/PasswordGate'
import { GuestList } from '@/components/GuestList'

export default function PanelBoda() {
  const { slug } = useParams<{ slug: string }>()
  const [boda, setBoda] = useState<Boda | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [auth, setAuth] = useState<boolean | null>(null)

  useEffect(() => {
    async function loadBoda() {
      const { data } = await supabase
        .from('bodas')
        .select('*')
        .eq('slug', slug)
        .single()

      if (!data) {
        setNotFound(true)
        return
      }

      setBoda(data as Boda)
      const ok = sessionStorage.getItem(`panel_auth_${slug}`) === '1'
      setAuth(ok)
    }
    loadBoda()
  }, [slug])

  if (notFound) {
    return (
      <div className="min-h-dvh flex items-center justify-center px-4">
        <div className="glass rounded-3xl p-10 w-full max-w-sm text-center animate-in">
          <p className="text-4xl mb-4">💒</p>
          <h1 className="text-xl font-semibold" style={{ color: '#9E0059' }}>
            Panel no encontrado
          </h1>
          <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
            Verifica que el enlace sea correcto.
          </p>
          <p className="text-center text-xs mt-8" style={{ color: '#9CA3AF' }}>
            © {new Date().getFullYear()} Elysium Invitaciones
          </p>
        </div>
      </div>
    )
  }

  if (!boda || auth === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-pink-300 border-t-transparent animate-spin" />
      </div>
    )
  }

  if (!auth) {
    return (
      <PasswordGate
        nombrePareja={boda.nombre}
        password={boda.password}
        slug={boda.slug}
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
              {boda.nombre}
            </h1>
            <p className="text-xs mt-0.5" style={{ color: '#9CA3AF' }}>
              Panel de Invitados · Tiempo real
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" aria-hidden="true" />
            <span className="text-xs" style={{ color: '#6B7280' }}>En vivo</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <GuestList urlBoda={boda.url_boda} nombreBoda={boda.nombre} />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: '#D1D5DB' }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
