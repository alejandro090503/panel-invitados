'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import type { PointerEvent as ReactPointerEvent } from 'react'
import { ImagePlus, Volume2, VolumeX, X } from 'lucide-react'
import { listarHistorias, urlPublica, type FotoHistoria } from '@/lib/album'
import { usePrefs } from '@/lib/prefs'

const DURACION = 5000
const ESPERA_FOTO = 8000
const REFRESCO = 20000

interface Vista { lista: FotoHistoria[]; i: number }

interface Props {
  slug: string
  cancion: string | null
  puedeSubir: boolean
  subiendo: { hechas: number; total: number } | null
  fallidas: number
  /** Rutas recién subidas: se muestran primero. `nonce` cambia con cada tanda. */
  nuevas: { paths: string[]; nonce: number }
  onAgregar: () => void
  onCerrar: () => void
}

function masReciente(fotos: FotoHistoria[], base: string | null): string | null {
  return fotos.reduce<string | null>((max, f) => (!max || f.created_at > max ? f.created_at : max), base)
}

/** Una sola historia con todas las fotos del evento, a pantalla completa. */
export default function HistoriasAlbum({ slug, cancion, puedeSubir, subiendo, fallidas, nuevas, onAgregar, onCerrar }: Props) {
  const { tr, idioma } = usePrefs()
  const [vista, setVista] = useState<Vista>({ lista: [], i: 0 })
  const [lista, setLista] = useState(false)
  const [cargadaId, setCargadaId] = useState<string | null>(null)
  const [sonido, setSonido] = useState(false)

  const vistaRef = useRef(vista)
  const ultima = useRef<string | null>(null)
  const tiempo = useRef(0)
  const presionando = useRef(false)
  const subiendoRef = useRef(false)
  const toque = useRef<{ x: number; y: number; t: number } | null>(null)
  const barra = useRef<HTMLDivElement>(null)
  const foto = useRef<HTMLDivElement>(null)
  const audio = useRef<HTMLAudioElement>(null)
  const raiz = useRef<HTMLDivElement>(null)
  const nonceVisto = useRef(nuevas.nonce)

  const aplicar = useCallback((v: Vista) => { vistaRef.current = v; setVista(v) }, [])

  const reiniciar = useCallback(() => {
    tiempo.current = 0
    if (barra.current) barra.current.style.transform = 'scaleX(0)'
  }, [])

  const siguiente = useCallback(() => {
    const v = vistaRef.current
    if (v.i >= v.lista.length - 1) { onCerrar(); return }
    reiniciar()
    aplicar({ ...v, i: v.i + 1 })
  }, [aplicar, onCerrar, reiniciar])

  const anterior = useCallback(() => {
    const v = vistaRef.current
    reiniciar()
    if (v.i > 0) aplicar({ ...v, i: v.i - 1 })
  }, [aplicar, reiniciar])

  /* Trae lo nuevo sin mover lo que el invitado está viendo; lo recién subido sí salta al frente. */
  const refrescar = useCallback(async (prioridad: string[] = []) => {
    if (!ultima.current) return
    const cambios = await listarHistorias(slug, ultima.current)
    const ocultas = new Set(cambios.filter(f => f.oculto).map(f => f.id))
    const frescas = cambios.filter(f => !f.oculto)
    ultima.current = masReciente(frescas, ultima.current)

    const v = vistaRef.current
    const actual = v.lista[v.i]
    let nueva = v.lista.filter(f => !ocultas.has(f.id))
    const ya = new Set(nueva.map(f => f.id))
    nueva = [...nueva, ...frescas.filter(f => !ya.has(f.id))]

    let i = actual ? nueva.findIndex(f => f.id === actual.id) : -1
    const seOculto = i < 0
    if (seOculto) i = Math.max(0, Math.min(v.i, nueva.length - 1))

    if (prioridad.length) {
      const set = new Set(prioridad)
      const frente = prioridad.map(p => nueva.find(f => f.path === p)).filter((f): f is FotoHistoria => !!f)
      if (frente.length) {
        const queda = nueva[i]
        const resto = nueva.filter(f => !set.has(f.path))
        const pos = queda && !set.has(queda.path) ? resto.findIndex(f => f.id === queda.id) : Math.min(i, resto.length) - 1
        nueva = [...resto.slice(0, pos + 1), ...frente, ...resto.slice(pos + 1)]
        i = pos + 1
        reiniciar()
      }
    } else if (seOculto) {
      reiniciar()
    }

    if (!nueva.length) { onCerrar(); return }
    aplicar({ lista: nueva, i })
  }, [aplicar, onCerrar, reiniciar, slug])

  /* Carga inicial */
  useEffect(() => {
    let vivo = true
    listarHistorias(slug).then(todas => {
      if (!vivo) return
      if (!todas.length) { onCerrar(); return }
      ultima.current = masReciente(todas, null)
      const set = new Set(nuevas.paths)
      const mias = nuevas.paths.map(p => todas.find(f => f.path === p)).filter((f): f is FotoHistoria => !!f)
      aplicar({ lista: [...mias, ...todas.filter(f => !set.has(f.path))], i: 0 })
      setLista(true)
    }).catch(() => { if (vivo) onCerrar() })
    return () => { vivo = false }
    // Solo al abrir: las tandas siguientes entran por `refrescar`.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug])

  /* Fotos subidas desde adentro del visor */
  useEffect(() => {
    if (nuevas.nonce === nonceVisto.current) return
    nonceVisto.current = nuevas.nonce
    refrescar(nuevas.paths).catch(() => {})
  }, [nuevas, refrescar])

  /* Fotos nuevas de los demás mientras se ve la historia */
  useEffect(() => {
    if (!lista) return
    const t = setInterval(() => { if (!document.hidden) refrescar().catch(() => {}) }, REFRESCO)
    return () => clearInterval(t)
  }, [lista, refrescar])

  useEffect(() => { subiendoRef.current = !!subiendo }, [subiendo])

  const actual = vista.lista[vista.i]
  const proxima = vista.lista[vista.i + 1]
  const idActual = actual?.id
  const cargada = !!idActual && cargadaId === idActual

  /* Si la señal está lenta, a los 8 s sigue con la miniatura */
  useEffect(() => {
    if (!idActual || cargada) return
    const t = setTimeout(() => setCargadaId(idActual), ESPERA_FOTO)
    return () => clearTimeout(t)
  }, [idActual, cargada])

  /* Solo se adelanta la foto siguiente: así aguanta álbumes grandes en el celular */
  useEffect(() => {
    if (!proxima) return
    const img = new Image()
    img.src = urlPublica(proxima.path)
  }, [proxima])

  /* Avance de la barra */
  useEffect(() => {
    if (!idActual || !cargada) return
    let raf = 0
    let antes = performance.now()
    const paso = (ahora: number) => {
      const dt = Math.min(100, ahora - antes)
      antes = ahora
      if (!presionando.current && !subiendoRef.current && !document.hidden) {
        tiempo.current += dt
        if (barra.current) barra.current.style.transform = `scaleX(${Math.min(1, tiempo.current / DURACION)})`
        if (tiempo.current >= DURACION) { siguiente(); return }
      }
      raf = requestAnimationFrame(paso)
    }
    raf = requestAnimationFrame(paso)
    return () => cancelAnimationFrame(raf)
  }, [idActual, cargada, siguiente])

  /* Pantalla: sin scroll detrás, teclado y foco */
  useEffect(() => {
    const previo = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    raiz.current?.focus()
    const tecla = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCerrar()
      else if (e.key === 'ArrowRight') siguiente()
      else if (e.key === 'ArrowLeft') anterior()
    }
    window.addEventListener('keydown', tecla)
    return () => {
      document.body.style.overflow = previo
      window.removeEventListener('keydown', tecla)
    }
  }, [anterior, onCerrar, siguiente])

  /* Música: el navegador puede bloquearla hasta que el invitado toque el botón */
  useEffect(() => {
    const a = audio.current
    if (!a) return
    a.volume = 0.6
    a.play().then(() => setSonido(true)).catch(() => setSonido(false))
    const visible = () => { if (document.hidden) a.pause(); else if (!a.dataset.silencio) a.play().catch(() => {}) }
    document.addEventListener('visibilitychange', visible)
    return () => {
      document.removeEventListener('visibilitychange', visible)
      a.pause()
    }
  }, [])

  function alternarSonido() {
    const a = audio.current
    if (!a) return
    if (a.paused) {
      delete a.dataset.silencio
      a.play().then(() => setSonido(true)).catch(() => setSonido(false))
    } else {
      a.dataset.silencio = '1'
      a.pause()
      setSonido(false)
    }
  }

  function marcarPausa(p: boolean) {
    presionando.current = p
    if (foto.current) foto.current.style.animationPlayState = p ? 'paused' : 'running'
  }

  function alPresionar(e: ReactPointerEvent<HTMLDivElement>) {
    if ((e.target as HTMLElement).closest('button')) return
    e.currentTarget.setPointerCapture(e.pointerId)
    toque.current = { x: e.clientX, y: e.clientY, t: performance.now() }
    marcarPausa(true)
  }

  function alSoltar(e: ReactPointerEvent<HTMLDivElement>) {
    const t = toque.current
    if (!t) return
    toque.current = null
    marcarPausa(false)
    const dy = e.clientY - t.y
    if (dy > 90) { onCerrar(); return }
    if (performance.now() - t.t < 280 && Math.abs(dy) < 24) {
      if (e.clientX < window.innerWidth / 3) anterior()
      else siguiente()
    }
  }

  function alCancelar() {
    toque.current = null
    marcarPausa(false)
  }

  const hora = actual
    ? new Date(actual.created_at).toLocaleTimeString(idioma === 'en' ? 'en-US' : 'es-MX', { hour: 'numeric', minute: '2-digit' })
    : ''

  return (
    <div
      ref={raiz}
      role="dialog"
      aria-modal="true"
      aria-label={tr('Historias del álbum', 'Album stories')}
      tabIndex={-1}
      className="fixed inset-0 z-[200] overflow-hidden outline-none"
      style={{ background: '#0E0D0B', color: '#fff', touchAction: 'none', userSelect: 'none', WebkitUserSelect: 'none', WebkitTouchCallout: 'none' }}
      onPointerDown={alPresionar}
      onPointerUp={alSoltar}
      onPointerCancel={alCancelar}
      onContextMenu={e => e.preventDefault()}
    >
      <style>{`
        @keyframes historiaZoom { from { transform: scale(1) } to { transform: scale(1.06) } }
        @keyframes historiaEntra { from { opacity: 0 } to { opacity: 1 } }
        @media (prefers-reduced-motion: reduce) { .historia-foto { animation: none !important } }
      `}</style>

      {cancion && <audio ref={audio} src={cancion} loop preload="auto" />}

      {actual ? (
        <div key={actual.id} className="absolute inset-0" style={{ animation: 'historiaEntra .28s ease-out' }}>
          {/* Fondo difuminado: una sola capa y con la miniatura, para no gastar memoria en iPhone */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={urlPublica(actual.thumb)} alt="" aria-hidden draggable={false} className="absolute inset-0 w-full h-full object-cover" style={{ opacity: 0.5, transform: 'scale(1.2)', filter: 'blur(26px)' }} />
          <div ref={foto} className="historia-foto absolute inset-0" style={{ animation: cargada ? `historiaZoom ${DURACION}ms ease-out forwards` : undefined }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={urlPublica(actual.thumb)} alt="" aria-hidden draggable={false} className="absolute inset-0 w-full h-full object-contain" />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={urlPublica(actual.path)}
              alt={actual.invitado ? tr(`Foto de ${actual.invitado}`, `Photo by ${actual.invitado}`) : tr('Foto de un invitado', 'Photo by a guest')}
              draggable={false}
              className="absolute inset-0 w-full h-full object-contain"
              style={{ opacity: cargada ? 1 : 0, transition: 'opacity .25s' }}
              onLoad={() => setCargadaId(actual.id)}
              onError={() => setCargadaId(actual.id)}
            />
          </div>
        </div>
      ) : (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-9 h-9 rounded-full border-2 animate-spin" style={{ borderColor: 'rgba(255,255,255,.25)', borderTopColor: '#E8CF94' }} />
        </div>
      )}

      {/* Sombras para que el texto se lea sobre cualquier foto */}
      <div aria-hidden className="absolute inset-x-0 top-0 h-32 pointer-events-none" style={{ background: 'linear-gradient(180deg, rgba(0,0,0,.62), transparent)' }} />
      <div aria-hidden className="absolute inset-x-0 bottom-0 h-36 pointer-events-none" style={{ background: 'linear-gradient(0deg, rgba(0,0,0,.62), transparent)' }} />

      <div className="absolute inset-x-0 top-0 px-3" style={{ paddingTop: 'max(10px, env(safe-area-inset-top))' }}>
        <div className="h-[3px] rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,.32)' }}>
          <div ref={barra} className="h-full w-full rounded-full" style={{ background: '#fff', transform: 'scaleX(0)', transformOrigin: 'left' }} />
        </div>
        <div className="flex items-center gap-1 mt-1.5">
          <div className="min-w-0 flex-1 pl-1">
            {actual && (
              <>
                <p className="serif text-lg leading-tight truncate" style={{ fontWeight: 600 }}>
                  {actual.invitado ?? tr('Un invitado', 'A guest')}
                </p>
                <p className="text-[13px] leading-tight" style={{ color: 'rgba(255,255,255,.86)' }}>
                  {hora} · {vista.i + 1} {tr('de', 'of')} {vista.lista.length}
                </p>
              </>
            )}
          </div>
          {cancion && (
            <button type="button" onClick={alternarSonido} aria-label={sonido ? tr('Silenciar música', 'Mute music') : tr('Activar música', 'Play music')} className="w-11 h-11 flex items-center justify-center cursor-pointer">
              {sonido ? <Volume2 size={22} /> : <VolumeX size={22} />}
            </button>
          )}
          <button type="button" onClick={onCerrar} aria-label={tr('Cerrar historias', 'Close stories')} className="w-11 h-11 flex items-center justify-center cursor-pointer">
            <X size={26} />
          </button>
        </div>
      </div>

      <div className="absolute inset-x-0 bottom-0 px-4 text-center" style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
        <div aria-live="polite">
          {!subiendo && fallidas > 0 && (
            <p className="text-sm mb-2" style={{ color: '#FFD7CF' }}>
              {fallidas === 1 ? tr('1 foto no se pudo subir. Intenta de nuevo.', '1 photo could not be uploaded. Try again.') : tr(`${fallidas} fotos no se pudieron subir. Intenta de nuevo.`, `${fallidas} photos could not be uploaded. Try again.`)}
            </p>
          )}
        </div>
        {vista.i === 0 && vista.lista.length > 1 && !subiendo && (
          <p className="text-[13px] mb-3" style={{ color: 'rgba(255,255,255,.86)' }}>
            {tr('Toca a los lados · mantén para pausar', 'Tap the sides · hold to pause')}
          </p>
        )}
        {puedeSubir && (
          <button
            type="button"
            disabled={!!subiendo}
            onClick={onAgregar}
            className="inline-flex items-center justify-center gap-2 rounded-full px-6 min-h-12 text-[15px] font-semibold cursor-pointer disabled:cursor-default"
            style={{ background: '#fff', color: '#2B2417' }}
          >
            <ImagePlus size={19} />
            {subiendo ? `${tr('Subiendo', 'Uploading')} ${subiendo.hechas} / ${subiendo.total}…` : tr('Agregar fotos', 'Add photos')}
          </button>
        )}
      </div>
    </div>
  )
}
