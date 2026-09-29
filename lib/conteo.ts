import type { Invitado } from '@/lib/supabase'

// Un solo lugar para contar: las tarjetas del resumen y las pestañas usan
// estas mismas funciones, así cada número tiene su lista de quién es.
// Por invitación: confirmados + declinados + sin usar = lugares (si ya respondió).

export function lugares(i: Invitado) {
  return i.pases + (i.pases_menores || 0)
}

export function confirmadosDe(i: Invitado) {
  return i.estado === 'confirmado' ? (i.pases_confirmados || lugares(i)) : 0
}

// Personas que dijeron que NO: toda la invitación declinó, o (con nombres
// asignados) alguien de la lista quedó sin marcar al confirmar.
export function declinadosDe(i: Invitado) {
  if (i.estado === 'declino') return lugares(i)
  const asignados = (i.nombres_asignados ?? []).length
  if (i.estado === 'confirmado' && asignados > 0) return Math.max(0, asignados - confirmadosDe(i))
  return 0
}

// Sin nombres asignados el invitado solo elige cuántos lugares usa: los que
// deja libres no son personas que declinaron, son lugares que no se usaron.
export function sinUsarDe(i: Invitado) {
  if (i.estado !== 'confirmado' || (i.nombres_asignados ?? []).length > 0) return 0
  return Math.max(0, lugares(i) - confirmadosDe(i))
}
