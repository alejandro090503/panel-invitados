import { createClient, SupabaseClient } from '@supabase/supabase-js'

export type EstadoInvitado = 'pendiente' | 'confirmado' | 'declino'

export interface Boda {
  id: string
  slug: string
  nombre: string
  url_boda: string
  password: string
  created_at: string
}

export interface Invitado {
  id: string
  nombre: string
  pases: number
  pases_confirmados: number
  nombres_confirmados: string[] | null
  estado: EstadoInvitado
  url_boda: string
  created_at: string
}

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (!_client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL  ?? 'https://placeholder.supabase.co'
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? 'placeholder'
    _client = createClient(url, key)
  }
  return _client
}

export const supabase = {
  get from() { return getSupabase().from.bind(getSupabase()) },
  get channel() { return getSupabase().channel.bind(getSupabase()) },
  get removeChannel() { return getSupabase().removeChannel.bind(getSupabase()) },
}
