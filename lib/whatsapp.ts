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
// Sin emojis: se muestran como carácter roto en algunos clientes de WhatsApp.
// Sin la palabra "boda": el panel también sirve XV años, bautizos y cumpleaños,
// y el nombre del evento ya trae su propio prefijo ("Boda …", "XV …").
export function mensajeInvitacion(nombre: string, evento: string, link: string): string {
  const propio = MENSAJE_POR_EVENTO.find(m => link.includes(m.url))
  if (propio) return `${propio.texto}\n\n${link}`
  return `Hola ${nombre}, nos encantaría contar contigo. Aquí está tu invitación personalizada a ${evento}: ${link}`
}

// Mensajes que el cliente pidió en lugar del predeterminado. Solo aplican a su
// evento: el resto de los paneles sigue con el mensaje de siempre. El texto va
// tal cual lo mandó el cliente; el link se agrega al final en su propio renglón.
const MENSAJE_POR_EVENTO: Array<{ url: string; texto: string }> = [
  {
    url: 'boda-deny-y-arturo',
    texto: 'Les compartimos con mucha alegria nuestra invitación de boda, esperamos contar con ustedes',
  },
]
