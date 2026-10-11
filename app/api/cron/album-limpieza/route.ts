import { NextRequest, NextResponse } from 'next/server'
import { limpiarExpirados } from '@/lib/album'

/** Vercel Cron diario: borra las fotos de los álbumes con más de 3 semanas. */
export async function GET(req: NextRequest) {
  const expected = process.env.CRON_SECRET
  if (expected && req.headers.get('authorization') !== `Bearer ${expected}`) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
  }
  try {
    return NextResponse.json({ ok: true, ...(await limpiarExpirados()) })
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 })
  }
}
