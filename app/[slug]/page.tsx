'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { esSoloAlbum } from '@/lib/soloAlbum'
import { supabase } from '@/lib/supabase'
import type { Boda } from '@/lib/supabase'
import { PasswordGate } from '@/components/PasswordGate'
import { GuestList } from '@/components/GuestList'
import { usePrefs } from '@/lib/prefs'
import Link from 'next/link'
import { Images } from 'lucide-react'

/* Eventos que se pasaron al panel Celestial (QR): aquí ya no se gestiona nada,
   solo se manda al panel nuevo. El álbum de fotos sigue viéndose aquí. */
const MUDADOS_A_CELESTIAL: Record<string, string> = {
  'ligia-y-guillermo': 'https://panel-invitados-qr.vercel.app/ligia-y-guillermo',
  'boda-johanna-y-leonardo': 'https://panel-invitados-qr.vercel.app/boda-johanna-y-leonardo',
}
import { infoAlbum, type InfoAlbum } from '@/lib/album'

export default function PanelBoda() {
  const { slug } = useParams<{ slug: string }>()
  const [boda, setBoda] = useState<Boda | null>(null)
  const [notFound, setNotFound] = useState(false)
  const [auth, setAuth] = useState<boolean | null>(null)
  // Solo los eventos con álbum activado (fila en album_eventos) muestran el botón
  const [album, setAlbum] = useState<InfoAlbum | null>(null)
  useEffect(() => { if (auth) infoAlbum(slug).then(setAlbum) }, [auth, slug])
  const { tr } = usePrefs()
  const router = useRouter()
  const soloAlbum = esSoloAlbum(slug)
  useEffect(() => { if (auth && soloAlbum) router.replace(`/${slug}/album`) }, [auth, soloAlbum, slug, router])

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
          <h1 className="serif text-2xl font-semibold" style={{ color: 'var(--ink)' }}>
            {tr('Panel no encontrado', 'Panel not found')}
          </h1>
          <p className="text-sm mt-2" style={{ color: 'var(--muted)' }}>
            {tr('Verifica que el enlace sea correcto.', 'Please check that the link is correct.')}
          </p>
          <p className="text-center text-xs mt-8" style={{ color: 'var(--gold-t)', opacity: 0.6 }}>
            © {new Date().getFullYear()} Elysium Invitaciones
          </p>
        </div>
      </div>
    )
  }

  if (!boda || auth === null || (auth && soloAlbum)) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div
          className="w-9 h-9 rounded-full border-2 animate-spin"
          style={{ borderColor: 'rgba(168,138,75,0.25)', borderTopColor: 'var(--gold-t)' }}
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
            <p className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--gold-t)' }}>
              {tr('Evento', 'Event')}
            </p>
            <h1 className="serif text-2xl sm:text-3xl font-semibold tracking-wide" style={{ color: 'var(--ink)' }}>
              {boda.nombre}
            </h1>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {tr('Panel de invitados · Tiempo real', 'Guest panel · Real time')}
            </p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
          {album && (
            <Link
              href={`/${slug}/album`}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors"
              style={{ background: 'rgba(168,138,75,0.12)', border: '1px solid rgba(168,138,75,0.35)', color: 'var(--gold-t)' }}
            >
              <Images size={14} />
              {tr('Álbum de fotos', 'Photo album')}
              {album.fotos > 0 && <span className="tabular-nums opacity-80">· {album.fotos}</span>}
            </Link>
          )}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ background: 'rgba(107,155,100,0.10)', border: '1px solid rgba(107,155,100,0.25)' }}>
            <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#6B9B64' }} aria-hidden="true" />
            <span className="text-xs font-medium" style={{ color: 'var(--ok-t)' }}>{tr('En vivo', 'Live')}</span>
          </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto">
        {MUDADOS_A_CELESTIAL[slug] ? (
          <div className="glass rounded-3xl px-6 py-8 text-center space-y-4" role="status">
            <p className="text-[10px] uppercase tracking-[0.22em]" style={{ color: 'var(--gold-t)' }}>{tr('Tu panel se mudó', 'Your panel has moved')}</p>
            <h2 className="serif text-2xl font-semibold" style={{ color: 'var(--ink)' }}>{tr('Ahora usas el Panel Celestial', 'You now use the Celestial Panel')}</h2>
            <p className="text-sm max-w-md mx-auto" style={{ color: 'var(--muted)' }}>
              {tr('Todas tus invitaciones y confirmaciones ya están en tu panel nuevo, con la misma contraseña. Aquí ya no se registran confirmaciones: agrega, edita y envía tus invitaciones desde el panel Celestial.',
                  'All your invitations and responses are already in your new panel, with the same password. Responses are no longer recorded here: add, edit and send your invitations from the Celestial panel.')}
            </p>
            <a href={MUDADOS_A_CELESTIAL[slug]} className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold"
               style={{ background: 'var(--gold-t)', color: '#FFFFFF' }}>
              {tr('Ir a mi Panel Celestial', 'Go to my Celestial Panel')}
            </a>
          </div>
        ) : (
          <GuestList urlBoda={boda.url_boda} nombreBoda={boda.nombre} />
        )}
      </div>

      <p className="text-center text-xs mt-10" style={{ color: 'var(--gold-t)', opacity: 0.6 }}>
        © {new Date().getFullYear()} Elysium Invitaciones
      </p>
    </main>
  )
}
