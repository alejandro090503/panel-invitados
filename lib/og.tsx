import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

/* Imagen de vista previa (WhatsApp, Messenger, iMessage…) de cada panel.
   Misma paleta crema + dorado del panel y tipografía editorial. */

export const OG_SIZE = { width: 1200, height: 630 }

type Boda = { slug: string; nombre: string; url_boda: string }

// Lee la boda con la llave pública: corre en el servidor al pedir la imagen.
export async function leerBoda(slug: string): Promise<Boda | null> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) return null
  try {
    const r = await fetch(
      `${url}/rest/v1/bodas?select=slug,nombre,url_boda&slug=eq.${encodeURIComponent(slug)}&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } },
    )
    if (!r.ok) return null
    const rows = (await r.json()) as Boda[]
    return rows[0] ?? null
  } catch {
    return null
  }
}

// "Boda Omar & Cari" → { tipo: 'Boda', nombre: 'Omar & Cari' }. El tipo sale
// del dominio de la invitación; si el nombre ya lo traía al inicio, se quita.
export function partesEvento(boda: Boda | null): { tipo: string; nombre: string } {
  if (!boda) return { tipo: 'Elysium Invitaciones', nombre: 'Panel de invitados' }
  const host = boda.url_boda.replace(/^https?:\/\//, '')
  const tipo =
    host.startsWith('boda-') ? 'Boda' :
    host.startsWith('xv-') || host.startsWith('15-') ? 'XV Años' :
    host.startsWith('bautizo-') ? 'Bautizo' :
    host.startsWith('cumple-') ? 'Cumpleaños' :
    host.startsWith('sweet-16-') ? 'Sweet 16' :
    'Celebración'
  const nombre = boda.nombre.replace(/^(boda|xv|bautizo|cumple(años)?)\s+/i, '').trim() || boda.nombre
  return { tipo, nombre }
}

async function fuentes() {
  const dir = join(process.cwd(), 'assets/fonts')
  const [serif, serifIt, sans] = await Promise.all([
    readFile(join(dir, 'CormorantGaramond-SemiBold.ttf')),
    readFile(join(dir, 'CormorantGaramond-MediumItalic.ttf')),
    readFile(join(dir, 'Inter-Medium.ttf')),
  ])
  return [
    { name: 'Cormorant', data: serif, style: 'normal' as const, weight: 600 as const },
    { name: 'Cormorant', data: serifIt, style: 'italic' as const, weight: 500 as const },
    { name: 'Inter', data: sans, style: 'normal' as const, weight: 500 as const },
  ]
}

const GOLD = '#A88A4B'
const GOLD_SOFT = '#D4BC85'
const MOCHA = '#3F2E1F'
const TAUPE = '#8B7E63'

export async function imagenPanel(tipo: string, nombre: string) {
  // El nombre se achica si es largo para que siempre quepa en dos renglones
  const n = nombre.length
  const tam = n <= 16 ? 104 : n <= 24 ? 88 : n <= 34 ? 72 : 58

  const linea = (ancho: number) => (
    <div style={{ width: ancho, height: 1, background: `linear-gradient(90deg, transparent, ${GOLD_SOFT}, transparent)` }} />
  )

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%', height: '100%', display: 'flex', padding: 28,
          background: 'linear-gradient(135deg, #FBF8F2 0%, #F4ECD8 55%, #E8D9B5 100%)',
        }}
      >
        {/* Marco doble dorado */}
        <div
          style={{
            flex: 1, display: 'flex', padding: 10,
            border: `1.5px solid ${GOLD_SOFT}`,
          }}
        >
          <div
            style={{
              flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
              border: `1px solid rgba(168,138,75,0.45)`,
              background: 'rgba(255,252,246,0.55)',
              padding: '0 70px',
            }}
          >
            <div style={{ fontFamily: 'Inter', fontSize: 20, letterSpacing: 9, color: GOLD, textTransform: 'uppercase', display: 'flex' }}>
              {tipo}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '26px 0 14px' }}>
              {linea(120)}
              <div style={{ fontSize: 22, color: GOLD, display: 'flex' }}>✦</div>
              {linea(120)}
            </div>

            <div
              style={{
                fontFamily: 'Cormorant', fontStyle: 'italic', fontWeight: 500, fontSize: tam,
                color: MOCHA, lineHeight: 1.08, textAlign: 'center', display: 'flex',
                justifyContent: 'center', maxWidth: 960,
              }}
            >
              {nombre}
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 18, margin: '20px 0 26px' }}>
              {linea(170)}
            </div>

            <div style={{ fontFamily: 'Cormorant', fontWeight: 600, fontSize: 40, color: MOCHA, display: 'flex' }}>
              Panel de invitados
            </div>
            <div style={{ fontFamily: 'Inter', fontSize: 19, color: TAUPE, marginTop: 10, letterSpacing: 1, display: 'flex' }}>
              Confirmaciones en tiempo real · Acceso privado
            </div>

            <div style={{ fontFamily: 'Inter', fontSize: 15, letterSpacing: 7, color: GOLD, marginTop: 44, textTransform: 'uppercase', display: 'flex' }}>
              Elysium Invitaciones
            </div>
          </div>
        </div>
      </div>
    ),
    { ...OG_SIZE, fonts: await fuentes() },
  )
}
