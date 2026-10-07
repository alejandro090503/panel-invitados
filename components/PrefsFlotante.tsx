'use client'
import { usePathname } from 'next/navigation'
import { Moon, Sun } from 'lucide-react'
import { usePrefs } from '@/lib/prefs'

/* Botoncitos en la esquina inferior derecha: tema claro/oscuro e idioma.
   El de idioma solo aparece en los paneles de los clientes (la vista admin
   está solo en español). */
export function PrefsFlotante() {
  const { tema, setTema, idioma, setIdioma, tr } = usePrefs()
  const pathname = usePathname()
  const esAdmin = pathname === '/'
  const oscuro = tema === 'dark'

  return (
    <div className="prefs-flotante glass" role="group" aria-label={tr('Preferencias', 'Preferences')}>
      <button
        type="button"
        className="prefs-btn"
        onClick={() => setTema(oscuro ? 'light' : 'dark')}
        aria-label={oscuro ? tr('Cambiar a tema claro', 'Switch to light theme') : tr('Cambiar a tema oscuro', 'Switch to dark theme')}
        title={oscuro ? tr('Tema claro', 'Light theme') : tr('Tema oscuro', 'Dark theme')}
      >
        <span className="prefs-ico" aria-hidden="true">
          {oscuro ? <Sun size={17} strokeWidth={1.9} /> : <Moon size={17} strokeWidth={1.9} />}
        </span>
      </button>
      {!esAdmin && (
        <button
          type="button"
          className="prefs-btn"
          onClick={() => setIdioma(idioma === 'es' ? 'en' : 'es')}
          aria-label={idioma === 'es' ? 'Switch to English' : 'Cambiar a español'}
          title={idioma === 'es' ? 'English' : 'Español'}
        >
          <span style={{ opacity: idioma === 'es' ? 1 : 0.45 }}>ES</span>
          <span style={{ opacity: 0.35 }}>/</span>
          <span style={{ opacity: idioma === 'en' ? 1 : 0.45 }}>EN</span>
        </button>
      )}
    </div>
  )
}
