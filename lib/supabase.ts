import { createClient } from '@supabase/supabase-js'

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(url, key)

export type EstadoInvitado = 'pendiente' | 'confirmó' | 'declinó'

export interface Invitado {
  id: string
  nombre: string
  pases: number
  estado: EstadoInvitado
  url_boda: string
  created_at: string
}
