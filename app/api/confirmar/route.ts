import { createClient } from '@supabase/supabase-js'
import { NextRequest } from 'next/server'

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

export async function POST(req: NextRequest) {
  const supabaseUrl  = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? ''
  const supabaseKey  = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ''
  const supabase     = createClient(supabaseUrl, supabaseKey)

  let body: { nombre?: string; estado?: string; url_boda?: string }

  try {
    body = await req.json()
  } catch {
    return Response.json({ error: 'JSON inválido' }, { status: 400, headers: CORS_HEADERS })
  }

  const { nombre, estado = 'confirmó', url_boda } = body

  if (!nombre) {
    return Response.json({ error: 'nombre es requerido' }, { status: 400, headers: CORS_HEADERS })
  }

  let query = supabase
    .from('invitados')
    .update({ estado })
    .ilike('nombre', nombre.trim())

  if (url_boda) {
    query = query.eq('url_boda', url_boda)
  }

  const { error } = await query

  if (error) {
    return Response.json({ error: error.message }, { status: 500, headers: CORS_HEADERS })
  }

  return Response.json({ ok: true, estado }, { headers: CORS_HEADERS })
}

export async function OPTIONS() {
  return new Response(null, { status: 204, headers: CORS_HEADERS })
}
