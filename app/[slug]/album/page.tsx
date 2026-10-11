'use client'
import { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { ArrowLeft, Download, EyeOff, Eye, X, ChevronLeft, ChevronRight, ImageOff } from 'lucide-react'
import { supabase, type Boda } from '@/lib/supabase'
import { infoAlbum, urlPublica, fechaBonita, listarFotos, ocultarFoto, type InfoAlbum, type FotoAlbum } from '@/lib/album'
import { usePrefs } from '@/lib/prefs'

type Foto = FotoAlbum

export default function AlbumNoviosPage() {
  const { slug } = useParams<{ slug: string }>()
  const router = useRouter()
  const { tr, idioma } = usePrefs()
  const [boda, setBoda] = useState<Boda | null>(null)
  const [info, setInfo] = useState<InfoAlbum | null | undefined>(undefined)
  const [fotos, setFotos] = useState<Foto[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [verOcultas, setVerOcultas] = useState(false)
  const [abierta, setAbierta] = useState<number | null>(null)
  const [zip, setZip] = useState<{ hechas: number; total: number } | null>(null)

  // Mismo acceso que el panel: si no entró con su contraseña, regresa al panel.
  useEffect(() => {
    if (sessionStorage.getItem(`panel_auth_${slug}`) !== '1') { router.replace(`/${slug}`); return }
    supabase.from('bodas').select('*').eq('slug', slug).single().then(({ data }) => setBoda(data as Boda))
    infoAlbum(slug).then(setInfo)
  }, [slug, router])

  const cargar = useCallback(async () => {
    if (!boda) return
    try {
      setFotos(await listarFotos(slug, boda.password))
    } catch {
      setError(tr('No se pudieron cargar las fotos. Si cambiaste la contraseña del panel, avísanos.', 'Could not load the photos. If you changed the panel password, let us know.'))
    }
  }, [boda, slug, tr])
  useEffect(() => { cargar() }, [cargar])

  const visibles = useMemo(() => (fotos ?? []).filter(f => verOcultas || !f.oculto), [fotos, verOcultas])
  const ocultas = (fotos ?? []).filter(f => f.oculto).length

  async function alternarOculta(f: Foto) {
    if (!boda) return
    setFotos(fs => fs?.map(x => (x.id === f.id ? { ...x, oculto: !x.oculto } : x)) ?? null)
    await ocultarFoto(slug, boda.password, f.id, !f.oculto).catch(() => cargar())
  }

  async function descargarTodo() {
    const lista = (fotos ?? []).filter(f => !f.oculto)
    if (!lista.length) return
    const { default: JSZip } = await import('jszip')
    const z = new JSZip()
    setZip({ hechas: 0, total: lista.length })
    let n = 0
    for (const f of lista) {
      try {
        const blob = await fetch(urlPublica(f.path)).then(r => r.blob())
        const quien = (f.invitado ?? 'invitado').replace(/[^\p{L}\p{N} _-]/gu, '').trim() || 'invitado'
        z.file(`${String(++n).padStart(4, '0')} - ${quien}.jpg`, blob)
      } catch {}
      setZip({ hechas: n, total: lista.length })
    }
    const out = await z.generateAsync({ type: 'blob' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(out)
    a.download = `Album - ${boda?.nombre ?? slug}.zip`
    a.click()
    URL.revokeObjectURL(a.href)
    setZip(null)
  }

  const foto = abierta != null ? visibles[abierta] : null

  return (
    <main className="min-h-dvh px-4 py-8 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto">
        <Link href={`/${slug}`} className="inline-flex items-center gap-1.5 text-sm mb-4" style={{ color: 'var(--muted)' }}>
          <ArrowLeft size={15} />{tr('Volver al panel', 'Back to panel')}
        </Link>

        <div className="glass rounded-3xl px-6 py-6 flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[10px] uppercase tracking-[0.22em] mb-1" style={{ color: 'var(--gold-t)' }}>{tr('Álbum de fotos', 'Photo album')}</p>
            <h1 className="serif text-2xl sm:text-3xl font-semibold" style={{ color: 'var(--ink)' }}>{boda?.nombre ?? info?.nombre ?? '…'}</h1>
            {info && (
              <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                {fotos ? `${visibles.length} ${tr('fotos', 'photos')}` : ''}
                {info.estado === 'antes' && ` · ${tr('Se habilita el', 'Opens on')} ${fechaBonita(info.fecha_evento, idioma)}`}
                {info.estado === 'abierto' && ` · ${tr('Tus invitados pueden subir fotos hasta 7 días después del evento', 'Guests can upload until 7 days after the event')}`}
                {info.estado === 'cerrado' && ` · ${tr('Descárgalas: se borran 3 semanas después del evento', 'Download them: they are deleted 3 weeks after the event')}`}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {ocultas > 0 && (
              <button type="button" onClick={() => setVerOcultas(v => !v)} className="inline-flex items-center gap-1.5 text-sm px-3.5 py-2 rounded-xl cursor-pointer" style={{ border: '1px solid var(--line)', color: 'var(--ink)' }}>
                {verOcultas ? <EyeOff size={15} /> : <Eye size={15} />}
                {verOcultas ? tr('Esconder ocultas', 'Hide hidden') : `${tr('Ver ocultas', 'Show hidden')} (${ocultas})`}
              </button>
            )}
            <button
              type="button"
              onClick={descargarTodo}
              disabled={!fotos?.length || !!zip}
              className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-xl text-white disabled:opacity-50 cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)' }}
            >
              <Download size={15} />
              {zip ? `${tr('Preparando', 'Preparing')} ${zip.hechas}/${zip.total}…` : tr('Descargar todas (ZIP)', 'Download all (ZIP)')}
            </button>
          </div>
        </div>

        {error && <p className="text-sm text-center" style={{ color: 'var(--err-t)' }}>{error}</p>}

        {info === null && (
          <p className="text-center text-sm py-16" style={{ color: 'var(--muted)' }}>{tr('Este evento no tiene álbum de fotos.', 'This event has no photo album.')}</p>
        )}

        {fotos && visibles.length === 0 && info && (
          <div className="text-center py-16">
            <ImageOff size={32} className="mx-auto" style={{ color: 'var(--muted)' }} />
            <p className="text-sm mt-3" style={{ color: 'var(--muted)' }}>
              {info.estado === 'antes'
                ? tr('Aquí aparecerán las fotos que suban tus invitados el día del evento.', 'Photos your guests upload on the event day will appear here.')
                : tr('Todavía no hay fotos.', 'No photos yet.')}
            </p>
          </div>
        )}

        <ul className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-1.5 sm:gap-2">
          {visibles.map((f, i) => (
            <li key={f.id} className="relative aspect-square overflow-hidden rounded-lg" style={{ background: 'var(--line)' }}>
              <button type="button" onClick={() => setAbierta(i)} className="block w-full h-full cursor-zoom-in" aria-label={tr('Ver foto', 'View photo')}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={urlPublica(f.thumb)} alt={f.invitado ? `${tr('Foto de', 'Photo by')} ${f.invitado}` : tr('Foto del evento', 'Event photo')} loading="lazy" className={`w-full h-full object-cover ${f.oculto ? 'opacity-35 grayscale' : ''}`} />
              </button>
              {f.oculto && <span className="absolute top-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white">{tr('Oculta', 'Hidden')}</span>}
            </li>
          ))}
        </ul>
      </div>

      {foto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90" role="dialog" aria-modal="true" onClick={() => setAbierta(null)}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPublica(foto.path)} alt="" className="max-w-[94vw] max-h-[82dvh] object-contain" onClick={e => e.stopPropagation()} />
          <div className="absolute bottom-0 inset-x-0 p-4 flex items-center justify-between gap-3 text-white" onClick={e => e.stopPropagation()}>
            <p className="text-sm opacity-80 truncate">{foto.invitado ?? tr('Invitado', 'Guest')}</p>
            <div className="flex items-center gap-2">
              <button type="button" onClick={() => alternarOculta(foto)} className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white/10 cursor-pointer">
                {foto.oculto ? <Eye size={15} /> : <EyeOff size={15} />}{foto.oculto ? tr('Mostrar', 'Show') : tr('Ocultar', 'Hide')}
              </button>
              <a href={urlPublica(foto.path)} download className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white/10">
                <Download size={15} />{tr('Descargar', 'Download')}
              </a>
            </div>
          </div>
          <button type="button" aria-label={tr('Cerrar', 'Close')} onClick={() => setAbierta(null)} className="absolute top-3 right-3 p-2 rounded-full bg-white/10 text-white cursor-pointer"><X size={20} /></button>
          {abierta! > 0 && (
            <button type="button" aria-label={tr('Anterior', 'Previous')} onClick={e => { e.stopPropagation(); setAbierta(abierta! - 1) }} className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white cursor-pointer"><ChevronLeft size={22} /></button>
          )}
          {abierta! < visibles.length - 1 && (
            <button type="button" aria-label={tr('Siguiente', 'Next')} onClick={e => { e.stopPropagation(); setAbierta(abierta! + 1) }} className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-white/10 text-white cursor-pointer"><ChevronRight size={22} /></button>
          )}
        </div>
      )}
    </main>
  )
}
