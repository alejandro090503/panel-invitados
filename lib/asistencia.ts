import type { Invitado } from '@/lib/supabase'

// Clave para comparar el nombre asignado contra el que escribió el invitado.
// Sin acentos: el invitado teclea "Diana Duran Trejo" y en la invitación está
// "Diana Durán Trejo"; comparando tal cual salía ✗ como si hubiera declinado.
// También ignora mayúsculas y espacios repetidos.
export function claveNombre(n: string): string {
  return n
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

export type Emparejado = { ok: boolean; comoEscribio?: string }

// Empareja los nombres asignados con los que el invitado dejó registrados.
//
// No siempre son el mismo texto: quien confirmó ANTES de que se le asignaran
// los nombres escribió el suyo a mano, y suele escribirlo más corto —
// "Itzel Macias Marin" por "Jennifer Itzel Macias Marin". Comparando tal cual
// salía con ✗ como si hubiera declinado, y el cliente no sabía qué contestó.
//
// Dos pasadas: primero los que coinciden exacto (sin acentos), y solo con los
// que sobran se busca una coincidencia por palabras. Se exige que un nombre
// contenga TODAS las palabras del otro y compartan al menos dos, para no
// confundir a dos invitados con nombres parecidos.
export function emparejarNombres(asignados: string[], confirmados: string[]): Emparejado[] {
  const conf = confirmados.map(c => ({ original: c, palabras: claveNombre(c).split(' ').filter(Boolean), usado: false }))
  const out: Emparejado[] = asignados.map(() => ({ ok: false }))

  asignados.forEach((a, i) => {
    const clave = claveNombre(a)
    const exacto = conf.find(c => !c.usado && c.palabras.join(' ') === clave)
    if (exacto) { exacto.usado = true; out[i] = { ok: true } }
  })

  asignados.forEach((a, i) => {
    if (out[i].ok) return
    const palabrasA = claveNombre(a).split(' ').filter(Boolean)
    let mejor: typeof conf[number] | null = null
    let mejorComunes = 0
    for (const c of conf) {
      if (c.usado) continue
      const comunes = palabrasA.filter(p => c.palabras.includes(p)).length
      const unoContieneAlOtro = comunes === palabrasA.length || comunes === c.palabras.length
      if (comunes >= 2 && unoContieneAlOtro && comunes > mejorComunes) { mejor = c; mejorComunes = comunes }
    }
    if (mejor) { mejor.usado = true; out[i] = { ok: true, comoEscribio: mejor.original } }
  })

  return out
}

/**
 * Cuántas personas asisten y cuántas no, según la MISMA cuenta que pintan las
 * palomitas de cada tarjeta.
 *
 * En las bodas que asignan nombres, `pases_confirmados` puede no cuadrar con
 * los nombres (pasó con dos invitaciones que se llamaban igual: la respuesta de
 * una se copió en la otra). La tarjeta decía "2 de 2 asisten" mientras una de
 * las dos personas salía tachada. Manda siempre el emparejado de nombres.
 */
export function asistencia(inv: Invitado): { asisten: number; noAsisten: number; total: number } {
  const asignados = inv.nombres_asignados ?? []
  const total = inv.pases + (inv.pases_menores || 0)

  if (asignados.length > 0) {
    if (inv.estado === 'pendiente') return { asisten: 0, noAsisten: 0, total: asignados.length }
    if (inv.estado === 'declino')   return { asisten: 0, noAsisten: asignados.length, total: asignados.length }
    const asisten = emparejarNombres(asignados, inv.nombres_confirmados ?? []).filter(p => p.ok).length
    return { asisten, noAsisten: Math.max(0, asignados.length - asisten), total: asignados.length }
  }

  // Sin nombres asignados el invitado solo eligió cuántos lugares ocupa.
  if (inv.estado === 'pendiente') return { asisten: 0, noAsisten: 0, total }
  if (inv.estado === 'declino')   return { asisten: 0, noAsisten: total, total }
  const asisten = (inv.nombres_confirmados ?? []).length || inv.pases_confirmados || 0
  return { asisten, noAsisten: 0, total }
}
