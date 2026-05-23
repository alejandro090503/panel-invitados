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
          <p className="text-4xl mb-4">✦</p>
          <h1 className="serif text-2xl font-semibold" style={{ color: '#3F2E1F' }}>
            Panel no encontrado
          </h1>
          <p className="text-sm mt-2" style={{ color: '#8B7E63' }}>
            Verifica que el enlace sea correcto.
          </p>
          <p className="text-center text-xs mt-8" style={{ color: '#A88A4B', opacity: 0.6 }}>
            © {new Date().getFullYear()} Elysium Invitaciones
          </p>
        </div>
      </div>
    )
  }

  if (!boda || auth === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div
          className="w-9 h-9 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(168,138,75,0.25)', borderTopColor: '#A88A4B' }}
        />
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
        <div className="glass rounded-3xl px-6 py-6 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: '#A88A4B' }}>
              Boda
            </p>
            <h1 className="serif text-2xl sm:text-3xl font-semibold tracking-wide" style={{ color: '#3F2E1F' }}>
              {boda.nombre}
            </h1>
            <p className="text-xs mt-1" style={{ color: '#8B7E63' }}>
              Panel de invitados · Tiempo real
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(107,155,100,0.10)', border: '1px solid rgba(107,155,100,0.25)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6B9B64' }} aria-hidden="true" />
            <span className="text-xs font-medium" style={{ color: '#2F5A28' }}>En vivo</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        <GuestList urlBoda={boda.url_boda} nombreBoda={boda.nombre} />
      </div>

      <p className="text-center text-xs mt-10" style={{ color: '#A88A4B', opacity: 0.6 }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
