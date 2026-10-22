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
    return `${texto}${propio.salto ?? '\n\n'}${link}`
  }
  return `Hola ${nombre}, nos encantaría contar contigo. Aquí está tu invitación personalizada a ${evento}: ${link}`
}

// Mensajes que el cliente pidió en lugar del predeterminado. Solo aplican a su
// evento: el resto de los paneles sigue con el mensaje de siempre. El texto va
// tal cual lo mandó el cliente; el link se agrega al final en su propio renglón.
// Si el mensaje nombra al invitado, se escribe como función de su nombre.
const MENSAJE_POR_EVENTO: Array<{ url: string; texto: string | ((nombre: string) => string); salto?: string }> = [
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
  {
    // Los novios lo mandaron con emojis a propósito; van tal cual.
    url: 'boda-omar-y-cari',
    texto:
      'Comienza una de las aventuras más bonitas de nuestras vidas y queremos celebrar este momento rodeados de personas especiales para nosotros. 🤍💍\n\n' +
      'Será una gran alegría contar con ustedes y compartir juntos un día que recordaremos siempre.\n\n' +
      'Con mucho cariño,\n' +
      'Omar & Caritina',
  },
  {
    // El link va en el renglón siguiente, sin línea en blanco.
    url: 'boda-hugo-villarreal-y-rosario-de-la-cruz',
    texto: (nombre: string) => `Hola, ${nombre}, nos encantaría contar contigo.`,
    salto: '\n',
  },
  {
    // Los novios lo mandaron con emojis a propósito; van tal cual.
    url: 'boda-paola-y-damian',
    texto:
      'Un matrimonio bendecido por Dios, también necesita corazones que lo acompañen.\n' +
      'Con el corazón lleno de amor y gratitud a Dios por permitirnos coincidir y elegirnos para toda la vida, queremos compartir contigo uno de los días más hermosos de nuestra historia.\n\n' +
      'Nos encantaría que nos acompañaras a celebrar el amor que nos une y la bendición de comenzar juntos esta nueva etapa, rodeados de las personas que forman parte de nuestra vida y de nuestra felicidad.\n' +
      'Tu presencia hará aún más especial este día ✨\n\n' +
      'Con todo nuestro cariño, te esperamos para celebrar juntos el comienzo de nuestro para siempre. ♡\n\n' +
      'Paola & Damián 🤍',
  },
  {
    url: 'boda-nicte-ha-y-efren',
    texto:
      '¡Hola! 🥰 ¡Nos casamos y queremos celebrar contigo! 💍 Te compartimos nuestra invitación en este enlace. Por favor, entra para ver los detalles y no olvides confirmar tu asistencia. ¡Te esperamos con mucha emoción! ❤️✨',
  },
  {
    // Los novios lo mandaron con emojis a propósito; van tal cual.
    url: 'boda-perci-y-virsabit',
    texto:
      '¡Hola! ✨\n\n' +
      'Después de tanto esperar este momento, por fin podemos compartirte nuestra invitación digital donde podrás encontrar todos los detalles de nuestra boda Cosis L❤️VE.\n\n' +
      'Nos hará muy felices que nos acompañes en este día tan especial.',
  },
]

// Botón "Recordar" del panel: solo aparece en los eventos de esta lista y solo
// en invitaciones que siguen pendientes. Abre el WhatsApp del invitado con el
// texto listo; el link de su invitación va al final en su propio renglón.
const RECORDATORIO_POR_EVENTO: Array<{ url: string; texto: (nombre: string) => string }> = [
  {
    url: 'confirmacion-vale-y-andres',
    texto: (nombre: string) =>
      `Hola, ${nombre}. Te recordamos que aún no recibimos tu confirmación para la boda de Valeria y Andrés. ` +
      'Nos ayudaría mucho que nos confirmes antes del 6 de febrero de 2027 en tu enlace personalizado:',
  },
]

export function mensajeRecordatorio(nombre: string, link: string): string | null {
  const propio = RECORDATORIO_POR_EVENTO.find(m => link.includes(m.url))
  return propio ? `${propio.texto(nombre)}\n\n${link}` : null
}
