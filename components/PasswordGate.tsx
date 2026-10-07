'use client'
import { useState, useRef } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'
import { usePrefs } from '@/lib/prefs'

interface Props {
  nombrePareja: string
  password: string
  slug: string
  onSuccess: () => void
}

export function PasswordGate({ nombrePareja, password, slug, onSuccess }: Props) {
  const [value, setValue] = useState('')
  const [show, setShow] = useState(false)
  const [error, setError] = useState(false)
  const [loading, setLoading] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)
  const { tr } = usePrefs()

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    if (value === password.trim()) {
      sessionStorage.setItem(`panel_auth_${slug}`, '1')
      onSuccess()
    } else {
      setError(true)
      setLoading(false)
      setValue('')
      setTimeout(() => setError(false), 2000)
      inputRef.current?.focus()
    }
  }

  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 w-full max-w-sm animate-in">
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{
              background: 'linear-gradient(135deg, #D4BC85 0%, #A88A4B 100%)',
              boxShadow: '0 6px 18px rgba(168,138,75,0.28)',
            }}
          >
            <Lock size={20} color="#FFFCF6" strokeWidth={1.8} />
          </div>
          <p className="text-[10px] uppercase tracking-[0.28em] mb-2" style={{ color: 'var(--gold-t)' }}>
            Elysium
          </p>
          <h1 className="serif text-2xl font-semibold tracking-wide" style={{ color: 'var(--ink)' }}>
            {nombrePareja}
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
            {tr('Panel de invitados', 'Guest panel')}
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="pass" className="block text-xs font-medium mb-2 uppercase tracking-wider" style={{ color: 'var(--ink-2)' }}>
            {tr('Contraseña de acceso', 'Access password')}
          </label>
          <div className="relative">
            <input
              ref={inputRef}
              id="pass"
              type={show ? 'text' : 'password'}
              value={value}
              onChange={e => setValue(e.target.value)}
              required
              autoComplete="current-password"
              placeholder="••••••••"
              aria-describedby={error ? 'pass-error' : undefined}
              aria-invalid={error}
              className="w-full rounded-xl px-4 py-3 pr-12 text-base transition-all duration-200 focus:outline-none focus:ring-2"
              style={{
                background: 'rgb(var(--surface-rgb) / 0.85)',
                border: `1px solid ${error ? 'var(--danger)' : 'var(--line)'}`,
                color: 'var(--ink)',
              }}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              aria-label={show ? tr('Ocultar contraseña', 'Hide password') : tr('Mostrar contraseña', 'Show password')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-colors"
              style={{ color: 'var(--muted)' }}
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p id="pass-error" role="alert" className="text-xs mt-2 animate-in" style={{ color: 'var(--danger)' }}>
              {tr('Contraseña incorrecta. Inténtalo de nuevo.', 'Wrong password. Please try again.')}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !value}
            className="mt-5 w-full py-3 rounded-xl font-medium text-sm tracking-wide transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[.98]"
            style={{
              background: loading ? 'var(--bronze-t)' : 'linear-gradient(135deg, #C9A961 0%, #A88A4B 100%)',
              color: '#FFFCF6',
              boxShadow: '0 4px 14px rgba(168,138,75,0.25)',
            }}
          >
            {loading ? tr('Verificando…', 'Checking…') : tr('Entrar al panel', 'Open panel')}
          </button>
        </form>

        <div className="mt-7 divider-orn"><span className="text-xs">✦</span></div>

        <p className="text-center text-xs mt-5" style={{ color: 'var(--gold-t)', opacity: 0.7 }}>
          © {new Date().getFullYear()} Elysium Invitaciones
        </p>
      </div>
    </div>
  )
}
