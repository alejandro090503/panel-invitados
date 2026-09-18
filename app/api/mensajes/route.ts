import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MAX_NOMBRE = 60
const MAX_MENSAJE = 500
const MAX_LISTA = 100

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

function client() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Muro de mensajes de los invitados.
 * Tabla propia (`mensajes`), independiente de `invitados`: las bodas que no
 * usan esta sección no se ven afectadas en nada.
 */
export async function POST(req: NextRequest) {
  let body: { url_boda?: string; nombre?: string; mensaje?: string }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400, headers: CORS_HEADERS })
  }

  const urlBoda = typeof body.url_boda === 'string' ? normalizeUrl(body.url_boda) : ''
  const nombre = typeof body.nombre === 'string' ? body.nombre.trim().slice(0, MAX_NOMBRE) : ''
  const mensaje = typeof body.mensaje === 'string' ? body.mensaje.trim().slice(0, MAX_MENSAJE) : ''

  if (!urlBoda || !nombre || !mensaje) {
    return Response.json(
      { error: 'url_boda, nombre y mensaje son requeridos' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const supabase = client()

  const { data, error } = await supabase
    .from('mensajes')
    .insert({ url_boda: urlBoda, nombre, mensaje })
    .select('id,nombre,mensaje,creado_en')
    .single()

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  return Response.json({ ok: true, mensaje: data }, { headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const urlBoda = url.searchParams.get('url_boda')

  if (!urlBoda) {
    return Response.json({ error: 'url_boda es requerido' }, { status: 400, headers: CORS_HEADERS })
  }

  const supabase = client()

  const { data, error } = await supabase
    .from('mensajes')
    .select('id,nombre,mensaje,creado_en')
    .eq('url_boda', normalizeUrl(urlBoda))
    .eq('oculto', false)
    .order('creado_en', { ascending: false })
    .limit(MAX_LISTA)

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  return Response.json({ ok: true, mensajes: data ?? [] }, { headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
