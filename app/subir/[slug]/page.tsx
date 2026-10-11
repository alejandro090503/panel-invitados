'use client'
import { useEffect, useRef, useState } from 'react'
import { useParams } from 'next/navigation'
import { Camera, ImagePlus, Check, Clock, Lock, AlertCircle } from 'lucide-react'
import { albumDb, infoAlbum, fechaBonita, type InfoAlbum } from '@/lib/album'
import { usePrefs } from '@/lib/prefs'

/** Reduce la foto en el celular antes de subirla: sube rápido aunque haya mala señal. */
async function reducir(file: File, lado: number, calidad: number): Promise<Blob> {
  const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' } as ImageBitmapOptions)
  const escala = Math.min(1, lado / Math.max(bmp.width, bmp.height))
  const w = Math.round(bmp.width * escala)
  const h = Math.round(bmp.height * escala)
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  canvas.getContext('2d')!.drawImage(bmp, 0, 0, w, h)
  bmp.close?.()
  return new Promise((ok, mal) => canvas.toBlob(b => (b ? ok(b) : mal(new Error('No se pudo leer la foto'))), 'image/jpeg', calidad))
}

const MAX_POR_VEZ = 30

export default function SubirFotosPage() {
  const { slug } = useParams<{ slug: string }>()
  const { tr, idioma } = usePrefs()
  const [info, setInfo] = useState<InfoAlbum | null | undefined>(undefined)
  const [nombre, setNombre] = useState('')
  const [subiendo, setSubiendo] = useState<{ hechas: number; total: number } | null>(null)
  const [listas, setListas] = useState(0)
  const [errores, setErrores] = useState(0)
  const [aviso, setAviso] = useState<string | null>(null)
  const galeria = useRef<HTMLInputElement>(null)
  const camara = useRef<HTMLInputElement>(null)

  useEffect(() => {
    infoAlbum(slug).then(setInfo)
    try { setNombre(localStorage.getItem('album_nombre') ?? '') } catch {}
  }, [slug])

  async function subir(files: FileList | null) {
    if (!files || !files.length || !info) return
    const lista = Array.from(files).filter(f => f.type.startsWith('image/')).slice(0, MAX_POR_VEZ)
    if (files.length > MAX_POR_VEZ) setAviso(tr(`Se suben ${MAX_POR_VEZ} a la vez; después puedes elegir más.`, `Up to ${MAX_POR_VEZ} at a time; you can add more after.`))
    else setAviso(null)
    try { localStorage.setItem('album_nombre', nombre) } catch {}
    setSubiendo({ hechas: 0, total: lista.length })
    const db = albumDb()
    let ok = 0
    let mal = 0
    for (const f of lista) {
      try {
        const [grande, mini] = await Promise.all([reducir(f, 2048, 0.82), reducir(f, 480, 0.72)])
        const id = crypto.randomUUID()
        const path = `${slug}/${id}.jpg`
        const thumb = `${slug}/t/${id}.jpg`
        const a = await db.storage.from('album').upload(path, grande, { contentType: 'image/jpeg', upsert: false })
        if (a.error) throw a.error
        const b = await db.storage.from('album').upload(thumb, mini, { contentType: 'image/jpeg', upsert: false })
        if (b.error) throw b.error
        const r = await db.rpc('album_registrar', { p_slug: slug, p_path: path, p_thumb: thumb, p_invitado: nombre })
        if (r.error) throw r.error
        ok++
      } catch {
        mal++
      }
      setSubiendo({ hechas: ok + mal, total: lista.length })
    }
    setListas(n => n + ok)
    setErrores(n => n + mal)
    setSubiendo(null)
    if (galeria.current) galeria.current.value = ''
    if (camara.current) camara.current.value = ''
  }

  if (info === undefined) {
    return (
      <div className="min-h-dvh flex items-center justify-center">
        <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(168,138,75,0.25)', borderTopColor: 'var(--gold-t)' }} />
      </div>
    )
  }

  const cerrado = !info || info.estado !== 'abierto'

  return (
    <main className="min-h-dvh flex items-center justify-center px-4 py-10">
      <div className="glass rounded-3xl p-7 sm:p-9 w-full max-w-md animate-in text-center">
        <p className="text-[10px] uppercase tracking-[0.28em]" style={{ color: 'var(--gold-t)' }}>
          {tr('Álbum de fotos', 'Photo album')}
        </p>
        <h1 className="serif text-3xl font-semibold mt-2" style={{ color: 'var(--ink)' }}>
          {info?.nombre ?? tr('Álbum no encontrado', 'Album not found')}
        </h1>
        {info && (
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>{fechaBonita(info.fecha_evento, idioma)}</p>
        )}

        {cerrado ? (
          <div className="mt-8 rounded-2xl px-5 py-6" style={{ background: 'rgb(var(--surface-rgb) / 0.7)', border: '1px solid var(--line)' }}>
            {info?.estado === 'antes' ? (
              <>
                <Clock size={26} className="mx-auto" style={{ color: 'var(--gold-t)' }} />
                <p className="mt-3 text-[15px]" style={{ color: 'var(--ink)' }}>
                  {tr('El álbum se habilita el día del evento.', 'The album opens on the day of the event.')}
                </p>
                <p className="mt-1 text-sm" style={{ color: 'var(--muted)' }}>
                  {tr('Regresa aquí y sube todas tus fotos de la noche.', 'Come back here and upload all your photos from the night.')}
                </p>
              </>
            ) : (
              <>
                <Lock size={24} className="mx-auto" style={{ color: 'var(--muted)' }} />
                <p className="mt-3 text-[15px]" style={{ color: 'var(--ink)' }}>
                  {info ? tr('El álbum ya cerró. ¡Gracias por compartir!', 'The album is closed. Thank you for sharing!') : tr('Verifica que el enlace sea correcto.', 'Please check the link.')}
                </p>
              </>
            )}
          </div>
        ) : (
          <>
            <p className="mt-5 text-[15px]" style={{ color: 'var(--ink)' }}>
              {tr('Comparte las fotos que tomaste. Los novios las recibirán todas.', 'Share the photos you took. The couple will receive them all.')}
            </p>

            <label className="block text-left mt-6">
              <span className="block text-xs uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>
                {tr('Tu nombre (opcional)', 'Your name (optional)')}
              </span>
              <input
                value={nombre}
                onChange={e => setNombre(e.target.value)}
                maxLength={60}
                autoComplete="name"
                placeholder={tr('Para que sepan de quién son', 'So they know who sent them')}
                className="w-full rounded-xl px-4 py-3 text-base focus:outline-none focus:ring-2"
                style={{ background: 'rgb(var(--surface-rgb) / 0.85)', border: '1px solid var(--line)', color: 'var(--ink)' }}
              />
            </label>

            <input ref={galeria} type="file" accept="image/*" multiple hidden onChange={e => subir(e.target.files)} />
            <input ref={camara} type="file" accept="image/*" capture="environment" hidden onChange={e => subir(e.target.files)} />

            <div className="grid gap-3 mt-5">
              <button
                type="button"
                disabled={!!subiendo}
                onClick={() => galeria.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-4 text-base font-semibold text-white disabled:opacity-60 cursor-pointer"
                style={{ background: 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)', boxShadow: '0 8px 22px rgba(168,138,75,0.28)' }}
              >
                <ImagePlus size={20} />{tr('Elegir fotos', 'Choose photos')}
              </button>
              <button
                type="button"
                disabled={!!subiendo}
                onClick={() => camara.current?.click()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-2xl px-5 py-3.5 text-[15px] font-medium disabled:opacity-60 cursor-pointer"
                style={{ border: '1px solid var(--line)', color: 'var(--ink)', background: 'rgb(var(--surface-rgb) / 0.6)' }}
              >
                <Camera size={18} />{tr('Tomar una foto', 'Take a photo')}
              </button>
            </div>

            <div aria-live="polite" className="mt-5 min-h-[44px]">
              {subiendo && (
                <div>
                  <p className="text-sm" style={{ color: 'var(--ink)' }}>
                    {tr('Subiendo', 'Uploading')} {subiendo.hechas} / {subiendo.total}…
                  </p>
                  <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--line)' }}>
                    <div className="h-full transition-all" style={{ width: `${(subiendo.hechas / subiendo.total) * 100}%`, background: 'var(--gold-t)' }} />
                  </div>
                </div>
              )}
              {!subiendo && listas > 0 && (
                <p className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--ok-t)' }}>
                  <Check size={16} />
                  {listas === 1 ? tr('¡1 foto enviada! Gracias.', '1 photo sent! Thank you.') : tr(`¡${listas} fotos enviadas! Gracias.`, `${listas} photos sent! Thank you.`)}
                </p>
              )}
              {!subiendo && errores > 0 && (
                <p className="inline-flex items-center gap-1.5 text-sm mt-1" style={{ color: 'var(--err-t)' }}>
                  <AlertCircle size={15} />
                  {tr(`${errores} no se pudieron subir. Intenta de nuevo con esas.`, `${errores} could not be uploaded. Please try those again.`)}
                </p>
              )}
              {aviso && <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{aviso}</p>}
            </div>
          </>
        )}

        <p className="text-xs mt-8" style={{ color: 'var(--gold-t)', opacity: 0.6 }}>© {new Date().getFullYear()} Elysium Invitaciones</p>
      </div>
    </main>
  )
}
