'use client'
import { useState } from 'react'
import { Copy, Check, Trash2, Users, UserCheck, MessageCircle, Pencil } from 'lucide-react'
import type { Invitado, EstadoInvitado } from '@/lib/supabase'
import { supabase } from '@/lib/supabase'
import { waLink, mensajeInvitacion, normalizarTelefono } from '@/lib/whatsapp'
import { nombreYaExiste, avisoNombreDuplicado } from '@/lib/duplicados'

interface Props {
  invitado: Invitado
  nombreBoda: string
  showMenores?: boolean
  onDeleted: () => void
}

const BADGE: Record<EstadoInvitado, string> = {
  pendiente:  'badge-pendiente',
  confirmado: 'badge-confirmado',
  declino:    'badge-declino',
}

const LABEL: Record<EstadoInvitado, string> = {
  pendiente:  'Pendiente',
  confirmado: 'Confirmado',
  declino:    'Declinó',
}

// Clave para comparar el nombre asignado contra el que escribió el invitado.
// Sin acentos: el invitado teclea "Diana Duran Trejo" y en la invitación está
// "Diana Durán Trejo"; comparando tal cual salía ✗ como si hubiera declinado.
// También ignora mayúsculas y espacios repetidos.
function claveNombre(n: string): string {
  return n
    .normalize('NFD').replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .trim()
}

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
type Emparejado = { ok: boolean; comoEscribio?: string }

function emparejarNombres(asignados: string[], confirmados: string[]): Emparejado[] {
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

// Codifica nombre|pases|menores en un token base64url (solo A-Z a-z 0-9 - _).
// Sin espacios, & ni % → sobrevive el linkificado y el link-shim de Messenger.
function encodeInvite(nombre: string, pases: number, menores: number): string {
  const raw = `${nombre}|${pases}|${menores}`
  const utf8 = new TextEncoder().encode(raw)
  let bin = ''
  utf8.forEach((b) => { bin += String.fromCharCode(b) })
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

export function GuestCard({ invitado, nombreBoda, showMenores = false, onDeleted }: Props) {
  const [copied, setCopied]     = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [editing, setEditing]   = useState(false)
  const [saving, setSaving]     = useState(false)
  const [editNombre, setEditNombre]     = useState(invitado.nombre)
  const [editTelefono, setEditTelefono] = useState(invitado.telefono ?? '')
  const [editPases, setEditPases]       = useState(String(invitado.pases))
  const [editMenores, setEditMenores]   = useState(String(invitado.pases_menores || 0))
  const [editAsignados, setEditAsignados] = useState((invitado.nombres_asignados ?? []).join('\n'))
  const [error, setError]       = useState('')
  /* Aviso de "¿seguro?" dentro de la tarjeta: `confirm()` no es fiable en
     iPhone (Safari permite bloquear los dialogos y entonces devuelve false). */
  const [aviso, setAviso] = useState<{ texto: string; etiqueta: string; accion: () => void } | null>(null)

  const menores = invitado.pases_menores || 0
  const asignados = invitado.nombres_asignados ?? []
  const tieneAsignados = asignados.length > 0
  // Bodas específicas usan un token único base64url (?i=...) en vez de
  // ?para=&pases= para sobrevivir Facebook Messenger: Messenger rompe la URL
  // en el primer espacio o & al pegarla, y su link-shim (l.php) elimina el
  // fragment (#). El token no tiene espacios, & ni %, así que atraviesa intacto.
  const usarToken = invitado.url_boda.includes('elsa-y-adrian')
    || invitado.url_boda.includes('anabel-y-salvador')
    || invitado.url_boda.includes('daniela-y-rafael')
    || invitado.url_boda.includes('alexis-y-edgar')
    || invitado.url_boda.includes('sarahi-y-miguel')
    || invitado.url_boda.includes('xv-ariadne-hernandez')
    || invitado.url_boda.includes('neidy-y-cesar')
    || invitado.url_boda.includes('alma-y-luis')
    || invitado.url_boda.includes('cumple-hector-y-eva')
    || invitado.url_boda.includes('ramiro-y-rosy')
    || invitado.url_boda.includes('xv-zoe-galan')
    || invitado.url_boda.includes('deny-y-arturo')
    || invitado.url_boda.includes('ana-y-wilber')
    || invitado.url_boda.includes('xv-alia-valeshka')
    || invitado.url_boda.includes('xv-celeste-melgar')
    || invitado.url_boda.includes('victoria-y-eduardo')
    || invitado.url_boda.includes('jessica-y-jessica')
    || invitado.url_boda.includes('maria-luisa-y-jorge-eduardo')
    || invitado.url_boda.includes('xv-ximena-hernandez')
    || invitado.url_boda.includes('xv-amelia-marie-de-la-rosa')
    || invitado.url_boda.includes('xv-diana-victoria')
    || invitado.url_boda.includes('xv-valentina-govea')
    || invitado.url_boda.includes('carlos-y-sarai')
    || invitado.url_boda.includes('raiza-hernandez-y-orlando-acevedo')
    || invitado.url_boda.includes('lorena-y-orlando')
    || invitado.url_boda.includes('andy-y-marco')
    || invitado.url_boda.includes('joselyn-y-felix')
    || invitado.url_boda.includes('erika-y-marin')
    || invitado.url_boda.includes('xv-xanath')
    || invitado.url_boda.includes('sebastian-y-diana')
    || invitado.url_boda.includes('amanda-y-jorge')
    || invitado.url_boda.includes('xv-giselle-cervantes-castillo')
    || invitado.url_boda.includes('bautizo-jorge-esteban-ruiz')
  // El token lleva el NOMBRE dentro: si el cliente renombra la invitación, el
  // link ya enviado deja de encontrarla y el invitado sigue viendo los datos
  // viejos. Con `?c=<id>` el link apunta a la fila y sobrevive al renombrado.
  const usarId = invitado.url_boda.includes('erika-y-marin')
    || invitado.url_boda.includes('xv-leticia')
    || invitado.url_boda.includes('mauricio-y-brenda')

  const link = usarId
    ? `${invitado.url_boda}?c=${invitado.id}`
    : usarToken
      ? `${invitado.url_boda}?i=${encodeInvite(invitado.nombre, invitado.pases, menores)}`
      : `${invitado.url_boda}?para=${encodeURIComponent(invitado.nombre)}&pases=${invitado.pases}` + (menores > 0 ? `&menores=${menores}` : '')

  const tieneTel = normalizarTelefono(invitado.telefono).length > 0
  const waHref = waLink(invitado.telefono, mensajeInvitacion(invitado.nombre, nombreBoda, link))

  async function copyLink() {
    await navigator.clipboard.writeText(link)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  async function deleteGuest() {
    // Borrar es definitivo: el link ya enviado deja de encontrar el registro y,
    // si el invitado ya había respondido, esa respuesta se pierde.
    let texto = `¿Eliminar la invitación de ${invitado.nombre}?\n\n`
    if (invitado.estado === 'confirmado') {
      const quienes = (invitado.nombres_confirmados ?? []).filter(Boolean)
      const nConf = invitado.pases_confirmados || 0
      texto += `OJO: esta invitación YA ESTÁ CONFIRMADA (${nConf} ${nConf === 1 ? 'persona' : 'personas'}`
      texto += quienes.length ? `: ${quienes.join(', ')}` : ''
      texto += ').\nSi la borras, pierdes esa respuesta y no la vas a poder recuperar.\n\n'
    } else if (invitado.estado === 'declino') {
      texto += 'OJO: esta invitación ya tiene respuesta registrada (no podrán asistir).\n'
      texto += 'Si la borras, pierdes ese registro.\n\n'
    }
    texto += 'Si ya enviaste el link, dejará de funcionar: al abrirlo no encontrará la invitación '
    texto += 'y no van a poder confirmar.'

    setAviso({ texto, etiqueta: 'Sí, eliminar', accion: borrarAhora })
  }

  async function borrarAhora() {
    setDeleting(true)
    // Lápida ANTES del borrado: marca que esta invitación se borró a propósito
    // para que una confirmación posterior no la reviva. Solo surte efecto en
    // bodas con `borrado_definitivo` encendido. Si falla, seguimos: el borrado
    // en sí no debe quedar a medias.
    // El índice único es sobre lower(btrim(nombre)) — una lápida repetida
    // devuelve 23505 y se ignora sin problema.
    await supabase
      .from('invitados_borrados')
      .insert({ nombre: invitado.nombre.trim(), url_boda: invitado.url_boda })
    await supabase.from('invitados').delete().eq('id', invitado.id)
    onDeleted()
  }

  function startEdit() {
    setEditNombre(invitado.nombre)
    setEditTelefono(invitado.telefono ?? '')
    setEditPases(String(invitado.pases))
    setEditMenores(String(invitado.pases_menores || 0))
    setEditAsignados((invitado.nombres_asignados ?? []).join('\n'))
    setError('')
    setEditing(true)
  }

  async function saveEdit() {
    const nuevoNombre = editNombre.trim()
    const nuevoTel = editTelefono.trim()
    if (!nuevoNombre) {
      setError('El nombre no puede quedar vacío.')
      return
    }
    if (nuevoNombre.toLowerCase() !== invitado.nombre.trim().toLowerCase()
        && await nombreYaExiste(invitado.url_boda, nuevoNombre, invitado.id)) {
      setError(avisoNombreDuplicado(nuevoNombre))
      return
    }

    // Pases / nombres asignados según el modo de la boda.
    const cambios: Record<string, unknown> = { nombre: nuevoNombre, telefono: nuevoTel || null }
    let nuevosAsignados: string[] = []
    let nuevosPases = invitado.pases
    let nuevosMenores = invitado.pases_menores || 0

    if (tieneAsignados) {
      nuevosAsignados = editAsignados.split('\n').map(s => s.trim()).filter(s => s.length > 0)
      if (nuevosAsignados.length === 0) {
        setError('Deja al menos un nombre (uno por línea).')
        return
      }
      // En modo nombres, los pases son exactamente cuántos nombres hay.
      nuevosPases = nuevosAsignados.length
      cambios.nombres_asignados = nuevosAsignados
      cambios.pases = nuevosPases
    } else {
      const p = Math.floor(Number(editPases))
      if (!Number.isFinite(p) || p < 1 || p > 20) {
        setError('Los pases deben ser un número entre 1 y 20.')
        return
      }
      nuevosPases = p
      cambios.pases = p
      if (showMenores) {
        const m = Math.floor(Number(editMenores))
        if (!Number.isFinite(m) || m < 0 || m > 20) {
          setError('Los menores deben ser un número entre 0 y 20.')
          return
        }
        nuevosMenores = m
        cambios.pases_menores = m
      }
    }

    // Si ya confirmaron MÁS lugares de los que ahora tendrá, los confirmados se
    // recortan al nuevo cupo (primero quienes siguen en la lista asignada). Sin
    // esto "Personas confirmadas" quedaba por encima de "Pases" y no cuadraba.
    const nuevoCupo = nuevosPases + nuevosMenores
    const confPrevios = invitado.nombres_confirmados ?? []
    if (invitado.estado === 'confirmado' && (invitado.pases_confirmados || 0) > nuevoCupo) {
      let conservar = confPrevios
      if (tieneAsignados) {
        const pares = emparejarNombres(nuevosAsignados, confPrevios)
        const siguen = pares.flatMap((par, i) => (par.ok ? [par.comoEscribio ?? nuevosAsignados[i]] : []))
        const claves = new Set(siguen.map(claveNombre))
        conservar = [...siguen, ...confPrevios.filter(n => !claves.has(claveNombre(n)))]
      }
      cambios.nombres_confirmados = conservar.slice(0, nuevoCupo)
      cambios.pases_confirmados = nuevoCupo
    }

    // Si ya respondieron, avisar antes de alterar cupos o nombres: lo que ya
    // confirmaron puede quedar fuera de lo que ahora tienen asignado.
    const yaRespondio = invitado.estado !== 'pendiente'
    const cambioCupos = nuevosPases !== invitado.pases || nuevosMenores !== (invitado.pases_menores || 0)
    const cambioNombres = tieneAsignados &&
      nuevosAsignados.join('|') !== (invitado.nombres_asignados ?? []).join('|')
    const avisos: string[] = []
    if (yaRespondio && (cambioCupos || cambioNombres)) {
      const total = nuevosPases + nuevosMenores
      avisos.push(
        `Esta invitación ya tiene respuesta (${LABEL[invitado.estado].toLowerCase()}) con ` +
        `${invitado.pases_confirmados || 0} confirmado(s).\n` +
        (cambioNombres
          ? 'Vas a cambiar los nombres asignados. Los que confirmaron y ya no estén en la lista dejarán de aparecer como asistentes.'
          : `Vas a cambiar los lugares a ${total}. Si quedan por debajo de lo ya confirmado, tendrán que responder de nuevo.`) +
        '\nConviene avisarles para que vuelvan a abrir su link.'
      )
    }
    // En las bodas con link por nombre (?para= o el token), el link ya enviado
    // deja de encontrar la invitación si el nombre cambia. Con `?c=<id>` no
    // pasa: el link apunta a la fila y sobrevive al renombrado.
    if (nuevoNombre !== invitado.nombre && !usarId) {
      avisos.push(
        `Vas a cambiar el nombre de "${invitado.nombre}" a "${nuevoNombre}".\n` +
        'El link que ya hayas enviado con el nombre anterior dejará de funcionar. ' +
        'Tendrás que volver a compartir el link nuevo.'
      )
    }
    if (avisos.length > 0) {
      setAviso({
        texto: avisos.join('\n\n'),
        etiqueta: 'Guardar de todos modos',
        accion: () => { void aplicarCambios(cambios, nuevoNombre) },
      })
      return
    }
    await aplicarCambios(cambios, nuevoNombre)
  }

  async function aplicarCambios(cambios: Record<string, unknown>, nuevoNombre: string) {
    setSaving(true)
    setError('')
    const { error: err } = await supabase
      .from('invitados')
      .update(cambios)
      .eq('id', invitado.id)
    // Si el nombre nuevo coincide con uno borrado antes, retiramos su lápida:
    // esta invitación está viva y debe poder confirmar.
    if (!err && nuevoNombre !== invitado.nombre) {
      await supabase
        .from('invitados_borrados')
        .delete()
        .ilike('nombre', nuevoNombre)
        .eq('url_boda', invitado.url_boda)
    }
    setSaving(false)
    if (err) {
      setError('No se pudo guardar. Intenta de nuevo.')
      return
    }
    setEditing(false)
    onDeleted() // refresca la lista
  }

  const confirmados = invitado.pases_confirmados || 0

  const inputStyle: React.CSSProperties = {
    background: 'rgba(255,252,246,0.9)',
    border: '1px solid rgba(168,138,75,0.35)',
    color: '#3F2E1F',
  }

  return (
    <div className="glass-sm rounded-2xl px-4 py-4 flex flex-col sm:flex-row sm:items-center gap-3 animate-in">
      {/* Avatar dorado */}
      <div
        className="w-11 h-11 rounded-full flex items-center justify-center shrink-0 serif text-base font-semibold"
        style={{
          background: 'linear-gradient(135deg, #D4BC85 0%, #A88A4B 100%)',
          color: '#FFFCF6',
          boxShadow: '0 4px 12px rgba(168,138,75,0.22)',
        }}
        aria-hidden="true"
      >
        {invitado.nombre.charAt(0).toUpperCase()}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        {editing ? (
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row gap-2">
              <label className="flex-1 min-w-0">
                <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8B7E63' }}>
                  Nombre o familia
                </span>
                <input
                  type="text"
                  value={editNombre}
                  onChange={(e) => setEditNombre(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                  autoFocus
                />
              </label>
              <label className="flex-1 min-w-0">
                <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8B7E63' }}>
                  WhatsApp (opcional)
                </span>
                <input
                  type="tel"
                  inputMode="tel"
                  value={editTelefono}
                  onChange={(e) => setEditTelefono(e.target.value)}
                  placeholder="Ej. 5215512345678"
                  className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                  style={inputStyle}
                />
              </label>
            </div>
            {/* Modo nombres específicos: lista editable, uno por línea */}
            {tieneAsignados ? (
              <label className="block">
                <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8B7E63' }}>
                  Nombres asignados (uno por línea)
                </span>
                <textarea
                  value={editAsignados}
                  onChange={(e) => setEditAsignados(e.target.value)}
                  rows={Math.min(8, Math.max(2, editAsignados.split('\n').length))}
                  className="w-full px-3 py-1.5 rounded-lg text-sm outline-none resize-y"
                  style={inputStyle}
                />
                <span className="block text-[10px] mt-1" style={{ color: '#A89876' }}>
                  Los pases se ajustan solos al número de nombres.
                </span>
              </label>
            ) : (
              /* Modo X pases: número de pases (y menores si la boda los usa) */
              <div className="flex gap-2">
                <label className="w-24">
                  <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8B7E63' }}>
                    Pases
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={20}
                    value={editPases}
                    onChange={(e) => setEditPases(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                    style={inputStyle}
                  />
                </label>
                {showMenores && (
                  <label className="w-24">
                    <span className="block text-[10px] uppercase tracking-wider mb-1" style={{ color: '#8B7E63' }}>
                      Menores
                    </span>
                    <input
                      type="number"
                      min={0}
                      max={20}
                      value={editMenores}
                      onChange={(e) => setEditMenores(e.target.value)}
                      className="w-full px-3 py-1.5 rounded-lg text-sm outline-none"
                      style={inputStyle}
                    />
                  </label>
                )}
              </div>
            )}

            {error && (
              <p className="text-[11px]" style={{ color: '#B85042' }}>{error}</p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={saveEdit}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg, #C9A961, #A88A4B)', color: '#FFFCF6' }}
              >
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                onClick={() => { setEditing(false); setError(''); setAviso(null) }}
                disabled={saving}
                className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95 disabled:opacity-50"
                style={{ background: 'rgba(255,252,246,0.6)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }}
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <>
            <p className="serif font-semibold text-base leading-tight truncate" style={{ color: '#3F2E1F' }}>
              {invitado.nombre}
            </p>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="flex items-center gap-1 text-xs" style={{ color: '#8B7E63' }}>
                <Users size={11} strokeWidth={2} />
                {invitado.pases + menores} {invitado.pases + menores === 1 ? 'pase' : 'pases'}
              </span>
              {invitado.estado === 'confirmado' && (
                <span className="flex items-center gap-1 text-xs font-medium" style={{ color: '#2F5A28' }}>
                  <UserCheck size={11} strokeWidth={2} />
                  {confirmados} de {invitado.pases + menores} asisten
                </span>
              )}
              <span className={`text-[11px] px-2 py-0.5 rounded-full font-medium ${BADGE[invitado.estado]}`}>
                {LABEL[invitado.estado]}
              </span>
              {tieneTel && (
                <span className="flex items-center gap-1 text-xs" style={{ color: '#8B7E63' }}>
                  <MessageCircle size={11} strokeWidth={2} />
                  {invitado.telefono}
                </span>
              )}
            </div>

            {tieneAsignados && (() => {
              const todosNo = invitado.estado === 'declino'
              // Si confirmo todos sus lugares nadie falta, aunque el nombre que
              // quedo guardado no sea identico al asignado (lo escribieron a mano
              // o el cliente lo corrigio despues de que confirmaran).
              const todosSi = invitado.estado === 'confirmado'
                && (invitado.pases_confirmados || 0) >= asignados.length
              const pares = todosNo
                ? asignados.map(() => ({ ok: false }) as Emparejado)
                : todosSi
                  ? asignados.map(() => ({ ok: true }) as Emparejado)
                  : emparejarNombres(asignados, invitado.nombres_confirmados ?? [])
              return (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {asignados.map((n, i) => {
                    const { ok, comoEscribio } = pares[i]
                    const decidido = invitado.estado !== 'pendiente'
                    const style: React.CSSProperties = !decidido
                      ? { background: 'rgba(168,138,75,0.08)', color: '#876338', border: '1px solid rgba(168,138,75,0.22)' }
                      : ok
                        ? { background: 'rgba(47,90,40,0.10)', color: '#2F5A28', border: '1px solid rgba(47,90,40,0.30)' }
                        : { background: 'rgba(184,80,66,0.08)', color: '#B85042', border: '1px solid rgba(184,80,66,0.25)' }
                    return (
                      <span
                        key={i}
                        className="text-[11px] px-2 py-0.5 rounded-full font-medium"
                        style={style}
                        // Si confirmó con el nombre escrito distinto, se ve al pasar el cursor.
                        title={comoEscribio ? `Confirmó escribiendo "${comoEscribio}"` : undefined}
                      >
                        {n}{decidido ? (ok ? ' ✓' : ' ✗') : ''}
                        {comoEscribio && <span className="opacity-70"> · escribió “{comoEscribio}”</span>}
                      </span>
                    )
                  })}
                </div>
              )
            })()}
          </>
        )}
      </div>

      {/* Link preview */}
      {!editing && !aviso && (
        <div className="hidden lg:block flex-1 min-w-0">
          <p className="text-xs truncate font-mono" style={{ color: '#A89876' }} title={link}>
            {link.length > 55 ? link.slice(0, 55) + '…' : link}
          </p>
        </div>
      )}

      {/* Acciones */}
      {!editing && !aviso && (
        <div className="flex items-center gap-2 shrink-0">
          <a
            href={waHref}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={tieneTel ? `Enviar invitación por WhatsApp a ${invitado.nombre}` : 'Compartir invitación por WhatsApp'}
            title={tieneTel ? `Enviar por WhatsApp a ${invitado.telefono}` : 'Compartir por WhatsApp (elige el contacto)'}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
            style={{ background: 'rgba(37,211,102,0.12)', color: '#1D7A44', border: '1px solid rgba(37,211,102,0.32)' }}
          >
            <MessageCircle size={13} />
            <span>WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={copyLink}
            aria-label="Copiar link de invitación"
            title="Copiar link"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium transition-all duration-200 active:scale-95"
            style={
              copied
                ? { background: 'rgba(107,155,100,0.14)', color: '#2F5A28', border: '1px solid rgba(107,155,100,0.30)' }
                : { background: 'rgba(168,138,75,0.10)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }
            }
          >
            {copied
              ? <><Check size={13} /><span>Copiado</span></>
              : <><Copy size={13} /><span>Copiar</span></>
            }
          </button>

          <button
            onClick={startEdit}
            aria-label={`Editar nombre y WhatsApp de ${invitado.nombre}`}
            title="Editar nombre y WhatsApp"
            type="button"
            className="btn-icono p-2 rounded-xl transition-all duration-200 active:scale-95"
          >
            <Pencil size={15} strokeWidth={1.8} />
          </button>

          <button
            onClick={deleteGuest}
            disabled={deleting}
            aria-label={`Eliminar invitación de ${invitado.nombre}`}
            title="Eliminar invitación"
            type="button"
            className="btn-icono btn-icono--peligro p-2 rounded-xl transition-all duration-200 active:scale-95 disabled:opacity-50"
          >
            <Trash2 size={15} strokeWidth={1.8} />
          </button>
        </div>
      )}

      {aviso && (
        <div
          className="w-full sm:flex-1 min-w-0 rounded-xl px-3 py-3 flex flex-col gap-2"
          style={{ background: 'rgba(184,80,66,0.06)', border: '1px solid rgba(184,80,66,0.28)' }}
          role="alertdialog"
          aria-label="Confirmar acción"
        >
          <p className="text-xs leading-relaxed" style={{ color: '#7A3B31', whiteSpace: 'pre-line' }}>
            {aviso.texto}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => { const seguir = aviso.accion; setAviso(null); seguir() }}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: '#B85042', color: '#FFFCF6' }}
            >
              {aviso.etiqueta}
            </button>
            <button
              type="button"
              onClick={() => setAviso(null)}
              className="px-3 py-1.5 rounded-xl text-xs font-medium transition-all active:scale-95"
              style={{ background: 'rgba(255,252,246,0.7)', color: '#876338', border: '1px solid rgba(168,138,75,0.25)' }}
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
