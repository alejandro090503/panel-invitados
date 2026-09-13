import { supabase } from '@/lib/supabase'

// Dos invitaciones de la misma boda NO pueden llamarse igual.
//
// El link de la invitación viaja con el nombre y el API busca al invitado por
// ese nombre (sin distinguir mayúsculas). Con dos "Familia Avilés López", el
// link de la segunda abría la primera: mostraba los nombres de otra familia y,
// al confirmar, la respuesta se guardaba en las dos.
//
// Se compara igual que el API (ilike, sin mayúsculas y sin espacios de sobra),
// escapando % y _ para que no actúen como comodines.
export async function nombreYaExiste(
  urlBoda: string,
  nombre: string,
  excluirId?: string,
): Promise<boolean> {
  const limpio = nombre.trim().replace(/[\\%_]/g, (c) => '\\' + c)
  let q = supabase
    .from('invitados')
    .select('id')
    .eq('url_boda', urlBoda)
    .ilike('nombre', limpio)
    .limit(1)
  if (excluirId) q = q.neq('id', excluirId)
  const { data } = await q
  return Array.isArray(data) && data.length > 0
}

export function avisoNombreDuplicado(nombre: string): string {
  return `Ya existe una invitación llamada "${nombre.trim()}". ` +
    'Cada invitación necesita un nombre distinto, porque el link se abre por nombre. ' +
    'Agrega algo que las distinga, por ejemplo: "Familia Avilés López (José Luis y Ana Lilia)".'
}
