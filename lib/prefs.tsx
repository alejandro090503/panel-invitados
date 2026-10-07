'use client'
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

/* Preferencias del panel: tema (claro/oscuro) e idioma (es/en).
   Se guardan en el navegador de quien lo abre; no tocan la base de datos. */

export type Tema = 'light' | 'dark'
export type Idioma = 'es' | 'en'

const CLAVE_TEMA = 'panel_tema'
const CLAVE_IDIOMA = 'panel_idioma'

type Prefs = {
  tema: Tema
  idioma: Idioma
  setTema: (t: Tema) => void
  setIdioma: (i: Idioma) => void
  /** tr('Texto', 'Text') → el texto del idioma activo */
  tr: (es: string, en: string) => string
}

const Ctx = createContext<Prefs>({
  tema: 'light',
  idioma: 'es',
  setTema: () => {},
  setIdioma: () => {},
  tr: (es) => es,
})

function leer(clave: string): string | null {
  try { return localStorage.getItem(clave) } catch { return null }
}
function guardar(clave: string, valor: string) {
  try { localStorage.setItem(clave, valor) } catch {}
}

/* Corre en <head> antes de pintar: evita el destello claro al abrir en oscuro. */
export const SCRIPT_TEMA_INICIAL = `(function(){try{var t=localStorage.getItem('${CLAVE_TEMA}');if(t==='dark'||t==='light'){document.documentElement.setAttribute('data-theme',t)}var i=localStorage.getItem('${CLAVE_IDIOMA}');if(i==='en'){document.documentElement.lang='en'}}catch(e){}})();`

export function PrefsProvider({ children }: { children: ReactNode }) {
  const [tema, setTemaState] = useState<Tema>('light')
  const [idioma, setIdiomaState] = useState<Idioma>('es')

  // Se lee al montar (no en el estado inicial) para que el HTML del servidor
  // y el del cliente coincidan; el <head> ya pintó el tema correcto antes.
  useEffect(() => {
    const t = leer(CLAVE_TEMA)
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (t === 'dark' || t === 'light') setTemaState(t)
    if (leer(CLAVE_IDIOMA) === 'en') setIdiomaState('en')
  }, [])

  const setTema = useCallback((t: Tema) => {
    const html = document.documentElement
    // La transición solo vive mientras dura el cambio
    html.classList.add('tema-anim')
    html.setAttribute('data-theme', t)
    window.setTimeout(() => html.classList.remove('tema-anim'), 520)
    guardar(CLAVE_TEMA, t)
    setTemaState(t)
  }, [])

  const setIdioma = useCallback((i: Idioma) => {
    document.documentElement.lang = i
    guardar(CLAVE_IDIOMA, i)
    setIdiomaState(i)
  }, [])

  const tr = useCallback((es: string, en: string) => (idioma === 'en' ? en : es), [idioma])

  return <Ctx.Provider value={{ tema, idioma, setTema, setIdioma, tr }}>{children}</Ctx.Provider>
}

export function usePrefs() {
  return useContext(Ctx)
}
