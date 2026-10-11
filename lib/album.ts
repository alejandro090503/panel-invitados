import { createClient, SupabaseClient } from '@supabase/supabase-js'

/**
 * Álbum de fotos por evento. Las fotos viven en el Supabase del formulario (el que
 * tiene espacio); aquí solo va su llave PÚBLICA. Ver y ocultar fotos se valida con la
 * contraseña del panel de ese evento (funciones album_* en la base).
 *
 * Un álbum existe solo si hay fila en album_eventos para ese slug: activarlo
 * para un evento NO cambia ningún otro panel.
 */
export const ALBUM_URL = 'https://bsjoelxktbvlavfoozhk.supabase.co'
const ALBUM_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJzam9lbHhrdGJ2bGF2Zm9vemhrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzc2NDYwNTIsImV4cCI6MjA5MzIyMjA1Mn0.jZlKZuH-KXlBLl5njadkKPmOemrj9cdm92nVZxBjFHI'

let cliente: SupabaseClient | null = null
export function albumDb(): SupabaseClient {
  if (!cliente) cliente = createClient(ALBUM_URL, ALBUM_ANON, { auth: { persistSession: false } })
  return cliente
}

export type EstadoAlbum = 'antes' | 'abierto' | 'cerrado' | 'expirado'
export interface InfoAlbum { slug: string; nombre: string; fecha_evento: string; estado: EstadoAlbum; fotos: number }

export async function infoAlbum(slug: string): Promise<InfoAlbum | null> {
  const { data, error } = await albumDb().rpc('album_info', { p_slug: slug })
  if (error || !data || !data.length) return null
  const r = data[0]
  return { ...r, fotos: Number(r.fotos) } as InfoAlbum
}

export function urlPublica(path: string): string {
  return `${ALBUM_URL}/storage/v1/object/public/album/${path}`
}

/** "sábado 21 de noviembre" */
export function fechaBonita(fecha: string, lang: 'es' | 'en' = 'es'): string {
  const [y, m, d] = fecha.split('-').map(Number)
  const t = new Date(Date.UTC(y, m - 1, d, 12)).toLocaleDateString(lang === 'en' ? 'en-US' : 'es-MX', {
    weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC',
  })
  return t.charAt(0).toUpperCase() + t.slice(1)
}

export interface FotoAlbum { id: string; path: string; thumb: string; invitado: string | null; oculto: boolean; created_at: string }

/** Fotos del álbum para los novios: se valida con la contraseña de SU panel. */
export async function listarFotos(slug: string, clave: string): Promise<FotoAlbum[]> {
  const { data, error } = await albumDb().rpc('album_listar', { p_slug: slug, p_clave: clave })
  if (error) throw new Error(error.message)
  return (data ?? []) as FotoAlbum[]
}

export async function ocultarFoto(slug: string, clave: string, id: string, oculto: boolean): Promise<void> {
  const { error } = await albumDb().rpc('album_ocultar', { p_slug: slug, p_clave: clave, p_id: id, p_oculto: oculto })
  if (error) throw new Error(error.message)
}

/** Borra archivos y filas de los álbumes que ya cumplieron 3 semanas (lo corre el cron diario). */
export async function limpiarExpirados(): Promise<{ archivos: number; albumes: number }> {
  const db = albumDb()
  const { data, error } = await db.rpc('album_expirados')
  if (error) throw new Error(error.message)
  const filas = (data ?? []) as Array<{ slug: string; path: string; thumb: string }>
  const rutas = filas.flatMap(f => [f.path, f.thumb])
  for (let i = 0; i < rutas.length; i += 100) {
    const { error: e } = await db.storage.from('album').remove(rutas.slice(i, i + 100))
    if (e) throw new Error(e.message)
  }
  const slugs = [...new Set(filas.map(f => f.slug))]
  for (const s of slugs) {
    const { error: e } = await db.rpc('album_purgar', { p_slug: s })
    if (e) throw new Error(e.message)
  }
  return { archivos: rutas.length, albumes: slugs.length }
}
