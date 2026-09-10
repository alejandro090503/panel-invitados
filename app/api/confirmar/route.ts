import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function normalizeUrl(url: string): string {
  return url.trim().replace(/\/+$/, '')
}

export async function POST(req: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const supabase     = createClient(supabaseUrl, supabaseKey)

  let body: {
    nombre?: string
    estado?: string
    pases?: number
    pases_confirmados?: number
    nombres_confirmados?: string[]
    url_boda?: string
  }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400, headers: CORS_HEADERS })
  }

  const { nombre, estado = 'confirmado', pases, pases_confirmados, nombres_confirmados, url_boda } = body

  if (!nombre) {
    return Response.json({ error: 'nombre es requerido' }, { status: 400, headers: CORS_HEADERS })
  }

  const updateData: Record<string, unknown> = { estado }
  if (typeof pases_confirmados === 'number') {
    updateData.pases_confirmados = pases_confirmados
  }
  // Al declinar conservamos los nombres ya guardados (no se sobreescriben),
  // para que al re-confirmar el invitado no tenga que volver a escribirlos.
  if (estado !== 'declino' && Array.isArray(nombres_confirmados)) {
    updateData.nombres_confirmados = nombres_confirmados
      .map(n => (typeof n === 'string' ? n.trim() : ''))
      .filter(n => n.length > 0)
  }

  // Buscar por nombre (case-insensitive, trimmed).
  // `.eq('bloqueado', false)` deja fuera a las invitaciones bloqueadas: aunque
  // alguien tenga la página abierta desde antes, su envío ya no las toca.
  let query = supabase
    .from('invitados')
    .update(updateData)
    .ilike('nombre', nombre.trim())
    .eq('bloqueado', false)

  if (url_boda) {
    query = query.eq('url_boda', normalizeUrl(url_boda))
  }

  // .select() devuelve las filas actualizadas → así sabemos si encontró al invitado
  const { data: updated, error } = await query.select('id')

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  const matched = Array.isArray(updated) ? updated.length : 0

  // Si no coincidió ninguna invitación (link sin ?para= o nombre nuevo),
  // creamos una nueva entrada para no perder la confirmación — siempre que
  // venga un nombre real (no el genérico "Invitado") y un url_boda.
  if (matched === 0) {
    const nombreLimpio = nombre.trim()
    const esGenerico = nombreLimpio.toLowerCase() === 'invitado'

    if (esGenerico || !url_boda) {
      return Response.json(
        { ok: false, matched: 0, error: 'no_match' },
        { status: 404, headers: CORS_HEADERS }
      )
    }

    // La invitación puede existir y estar BLOQUEADA: el UPDATE la excluyó y
    // por eso matched es 0. Sin este corte se crearía un duplicado con el
    // mismo nombre, que es peor que no registrar nada.
    const { data: bloqueada } = await supabase
      .from('invitados')
      .select('id')
      .ilike('nombre', nombreLimpio)
      .eq('url_boda', normalizeUrl(url_boda))
      .eq('bloqueado', true)
      .limit(1)
      .maybeSingle()

    if (bloqueada) {
      return Response.json(
        { ok: false, matched: 0, error: 'respuestas_cerradas' },
        { status: 423, headers: CORS_HEADERS }
      )
    }

    // Borrado definitivo (opt-in por boda): si la boda tiene la bandera
    // encendida y esta invitación fue borrada a propósito desde el panel, NO
    // la recreamos. Sin la bandera, el comportamiento es el de siempre —
    // las bodas ya entregadas no cambian.
    const urlNormalizada = normalizeUrl(url_boda)
    const { data: boda } = await supabase
      .from('bodas')
      .select('borrado_definitivo')
      .eq('url_boda', urlNormalizada)
      .maybeSingle()

    if (boda?.borrado_definitivo) {
      const { data: lapida } = await supabase
        .from('invitados_borrados')
        .select('id')
        .ilike('nombre', nombreLimpio)
        .eq('url_boda', urlNormalizada)
        .limit(1)
        .maybeSingle()

      if (lapida) {
        return Response.json(
          { ok: false, matched: 0, error: 'invitacion_borrada' },
          { status: 410, headers: CORS_HEADERS }
        )
      }
    }

    const nombresLimpios = Array.isArray(nombres_confirmados)
      ? nombres_confirmados.map(n => (typeof n === 'string' ? n.trim() : '')).filter(n => n.length > 0)
      : []
    const capacidad = Math.max(
      1,
      typeof pases === 'number' ? pases : 0,
      typeof pases_confirmados === 'number' ? pases_confirmados : 0,
      nombresLimpios.length,
    )

    const { error: insError } = await supabase.from('invitados').insert({
      nombre: nombreLimpio,
      url_boda: urlNormalizada,
      estado,
      pases: capacidad,
      pases_menores: 0,
      pases_confirmados: typeof pases_confirmados === 'number' ? pases_confirmados : 0,
      nombres_confirmados: nombresLimpios,
    })

    if (insError) {
      return Response.json({ error: insError.message }, { status: 500, headers: CORS_HEADERS })
    }

    return Response.json({ ok: true, matched: 0, created: true, estado }, { headers: CORS_HEADERS })
  }

  return Response.json({ ok: true, matched, estado, pases_confirmados }, { headers: CORS_HEADERS })
}

export async function GET(req: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const supabase    = createClient(supabaseUrl, supabaseKey)

  const url     = new URL(req.url)
  const nombre  = url.searchParams.get('nombre')
  const urlBoda = url.searchParams.get('url_boda')

  if (!nombre || !urlBoda) {
    return Response.json(
      { error: 'nombre y url_boda son requeridos' },
      { status: 400, headers: CORS_HEADERS }
    )
  }

  const { data, error } = await supabase
    .from('invitados')
    .select('nombre,estado,pases,pases_menores,pases_confirmados,nombres_confirmados,nombres_asignados,bloqueado')
    .ilike('nombre', nombre.trim())
    .eq('url_boda', normalizeUrl(urlBoda))
    .limit(1)
    .maybeSingle()

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  return Response.json({ ok: true, invitado: data ?? null }, { headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
