'use client'
import { useState } from 'react'
import { usePrefs } from '@/lib/prefs'

/* WhatsApp con selector de país: el cliente elige el país y escribe solo el
   número; la lada se agrega sola. Se guarda como "+52 5512345678" (wa.me usa
   solo los dígitos, ver normalizarTelefono). Select nativo a propósito: en
   iPhone es el que mejor funciona. */

interface Pais { iso: string; es: string; en: string; lada: string }

export const PAISES: Pais[] = [
  { iso: 'MX', es: 'México', en: 'Mexico', lada: '52' },
  { iso: 'US', es: 'Estados Unidos', en: 'United States', lada: '1' },
  { iso: 'CA', es: 'Canadá', en: 'Canada', lada: '1' },
  { iso: 'CO', es: 'Colombia', en: 'Colombia', lada: '57' },
  { iso: 'GT', es: 'Guatemala', en: 'Guatemala', lada: '502' },
  { iso: 'SV', es: 'El Salvador', en: 'El Salvador', lada: '503' },
  { iso: 'HN', es: 'Honduras', en: 'Honduras', lada: '504' },
  { iso: 'NI', es: 'Nicaragua', en: 'Nicaragua', lada: '505' },
  { iso: 'CR', es: 'Costa Rica', en: 'Costa Rica', lada: '506' },
  { iso: 'PA', es: 'Panamá', en: 'Panama', lada: '507' },
  { iso: 'DO', es: 'República Dominicana', en: 'Dominican Republic', lada: '1' },
  { iso: 'PR', es: 'Puerto Rico', en: 'Puerto Rico', lada: '1' },
  { iso: 'CU', es: 'Cuba', en: 'Cuba', lada: '53' },
  { iso: 'VE', es: 'Venezuela', en: 'Venezuela', lada: '58' },
  { iso: 'EC', es: 'Ecuador', en: 'Ecuador', lada: '593' },
  { iso: 'PE', es: 'Perú', en: 'Peru', lada: '51' },
  { iso: 'BO', es: 'Bolivia', en: 'Bolivia', lada: '591' },
  { iso: 'CL', es: 'Chile', en: 'Chile', lada: '56' },
  { iso: 'AR', es: 'Argentina', en: 'Argentina', lada: '54' },
  { iso: 'PY', es: 'Paraguay', en: 'Paraguay', lada: '595' },
  { iso: 'UY', es: 'Uruguay', en: 'Uruguay', lada: '598' },
  { iso: 'BR', es: 'Brasil', en: 'Brazil', lada: '55' },
  { iso: 'ES', es: 'España', en: 'Spain', lada: '34' },
  { iso: 'GB', es: 'Reino Unido', en: 'United Kingdom', lada: '44' },
  { iso: 'FR', es: 'Francia', en: 'France', lada: '33' },
  { iso: 'DE', es: 'Alemania', en: 'Germany', lada: '49' },
  { iso: 'IT', es: 'Italia', en: 'Italy', lada: '39' },
  { iso: 'CH', es: 'Suiza', en: 'Switzerland', lada: '41' },
  { iso: 'NL', es: 'Países Bajos', en: 'Netherlands', lada: '31' },
  { iso: 'IN', es: 'India', en: 'India', lada: '91' },
  { iso: 'AU', es: 'Australia', en: 'Australia', lada: '61' },
  { iso: 'JP', es: 'Japón', en: 'Japan', lada: '81' },
]

const CLAVE_PAIS = 'ely-pais-whatsapp'

function paisGuardado(): string {
  if (typeof window === 'undefined') return 'MX'
  try { return localStorage.getItem(CLAVE_PAIS) || 'MX' } catch { return 'MX' }
}

/* Separa un número guardado en país + número local. Los números viejos se
   escribieron a mano: "+52 55…", "5215512345678", "5512345678"… Con 10 dígitos
   o menos no traen lada (se quedan con el país preferido). */
export function separarTelefono(raw: string | null | undefined, preferido = 'MX'): { iso: string; local: string } {
  const txt = (raw ?? '').trim()
  const dig = txt.replace(/\D/g, '')
  if (!dig) return { iso: preferido, local: '' }
  if (!txt.startsWith('+') && dig.length <= 10) return { iso: preferido, local: dig }
  const pref = PAISES.find(p => p.iso === preferido)
  // Lada más larga primero (502 antes que 5); entre empates gana el país preferido.
  const candidatos = [...PAISES]
    .filter(p => dig.startsWith(p.lada))
    .sort((a, b) => b.lada.length - a.lada.length || (a.iso === pref?.iso ? -1 : b.iso === pref?.iso ? 1 : 0))
  const p = candidatos[0]
  if (!p) return { iso: preferido, local: dig }
  return { iso: p.iso, local: dig.slice(p.lada.length) }
}

export function unirTelefono(iso: string, local: string): string {
  const dig = local.replace(/\D/g, '')
  if (!dig) return ''
  const p = PAISES.find(x => x.iso === iso) ?? PAISES[0]
  return `+${p.lada} ${dig}`
}

interface Props {
  value: string
  onChange: (v: string) => void
  id?: string
  inputClassName?: string
  inputStyle?: React.CSSProperties
  compacto?: boolean
}

export function TelefonoInput({ value, onChange, id, inputClassName = '', inputStyle, compacto = false }: Props) {
  const { tr, idioma } = usePrefs()
  // Sin número todavía: arranca con el último país que se usó en este equipo.
  const [iso, setIso] = useState(() => value ? separarTelefono(value).iso : paisGuardado())
  const local = value ? separarTelefono(value, iso).local : ''
  const pais = PAISES.find(p => p.iso === iso) ?? PAISES[0]

  function cambiarPais(nuevo: string) {
    setIso(nuevo)
    try { localStorage.setItem(CLAVE_PAIS, nuevo) } catch {}
    onChange(unirTelefono(nuevo, local))
  }

  function cambiarNumero(txt: string) {
    // Si pegan el número completo con "+lada", se detecta el país.
    if (txt.trim().startsWith('+')) {
      const s = separarTelefono(txt, iso)
      setIso(s.iso)
      onChange(unirTelefono(s.iso, s.local))
      return
    }
    onChange(unirTelefono(iso, txt))
  }

  const alto = compacto ? 'py-1.5' : 'py-2.5'
  return (
    <div className="flex gap-1.5 w-full">
      <div className="relative shrink-0">
        <select
          aria-label={tr('País del WhatsApp', 'WhatsApp country')}
          value={iso}
          onChange={e => cambiarPais(e.target.value)}
          className={`tel-pais appearance-none rounded-xl pl-3 pr-7 ${alto} text-sm font-medium focus:outline-none focus:ring-2 cursor-pointer`}
          style={{ ...inputStyle, width: 98, color: 'transparent' }}
        >
          {PAISES.map(p => (
            <option key={p.iso} value={p.iso}>
              {(idioma === 'en' ? p.en : p.es)} +{p.lada}
            </option>
          ))}
        </select>
        {/* El select muestra solo el código; la lista abierta trae el país completo */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 flex items-center pl-3 pr-7 text-sm font-medium whitespace-nowrap"
          style={{ color: inputStyle?.color ?? 'var(--ink)' }}
        >
          {pais.iso} +{pais.lada}
        </span>
        <svg aria-hidden="true" className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: 'var(--muted)' }}>
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>
      <input
        id={id}
        type="tel"
        inputMode="tel"
        value={local}
        onChange={e => cambiarNumero(e.target.value)}
        placeholder={iso === 'MX' ? '55 1234 5678' : tr('Número', 'Number')}
        autoComplete="off"
        className={`min-w-0 flex-1 ${inputClassName}`}
        style={inputStyle}
      />
    </div>
  )
}
