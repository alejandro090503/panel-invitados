// Utilidades para compartir la invitación por WhatsApp desde el panel.

// Deja solo dígitos (quita espacios, guiones, paréntesis y el signo +).
export function normalizarTelefono(raw: string | null | undefined): string {
  if (!raw) return ''
  return raw.replace(/\D/g, '')
}

// Enlace wa.me: con teléfono abre el chat de ese contacto; sin teléfono deja
// que el usuario elija a quién enviar. El texto va URL-encoded.
export function waLink(telefono: string | null | undefined, texto: string): string {
  const tel = normalizarTelefono(telefono)
  const q = encodeURIComponent(texto)
  return tel ? `https://wa.me/${tel}?text=${q}` : `https://wa.me/?text=${q}`
}

// Mensaje que acompaña al link de la invitación.
// El predeterminado va sin emojis (se ven como carácter roto en algunos
// clientes) y sin la palabra "boda": el panel también sirve XV años, bautizos
// y cumpleaños, y el nombre del evento ya trae su prefijo ("Boda …", "XV …").
export function mensajeInvitacion(nombre: string, evento: string, link: string): string {
  const propio = MENSAJE_POR_EVENTO.find(m => link.includes(m.url))
  if (propio) {
    const texto = typeof propio.texto === 'function' ? propio.texto(nombre) : propio.texto
    return `${texto}\n\n${link}`
  }
  return `Hola ${nombre}, nos encantaría contar contigo. Aquí está tu invitación personalizada a ${evento}: ${link}`
}

// Mensajes que el cliente pidió en lugar del predeterminado. Solo aplican a su
// evento: el resto de los paneles sigue con el mensaje de siempre. El texto va
// tal cual lo mandó el cliente; el link se agrega al final en su propio renglón.
// Si el mensaje nombra al invitado, se escribe como función de su nombre.
const MENSAJE_POR_EVENTO: Array<{ url: string; texto: string | ((nombre: string) => string) }> = [
  {
    url: 'boda-deny-y-arturo',
    texto: 'Les compartimos con mucha alegria nuestra invitación de boda, esperamos contar con ustedes',
  },
  {
    // MARO Planner lo mandó con emojis a propósito; van tal cual.
    url: 'boda-lorena-y-orlando',
    texto: (nombre: string) =>
      `Hola, ${nombre}\n\n` +
      'Te saludamos de parte de MARO Planner. ✨\n\n' +
      'Con mucha alegría queremos compartir contigo una fecha muy especial para Lorena & Luis Orlando.\n\n' +
      'A continuación encontrarás todos los detalles de la celebración. Agradecemos el tiempo que te tomes para revisar la invitación y confirmar tu asistencia a tiempo.\n\n' +
      'Cualquier duda o comentario, con gusto podremos ayudarte.\n\n' +
      'Atentamente,\n' +
      'Equipo MARO Planner 🤍',
  },
]
