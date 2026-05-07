'use client'
import { useState, useRef } from 'react'
import { Eye, EyeOff, Lock } from 'lucide-react'

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
            style={{ background: 'linear-gradient(135deg, #F9A8D4 0%, #9E0059 100%)' }}
          >
            <Lock size={22} color="white" strokeWidth={1.8} />
          </div>
          <h1 className="text-2xl font-semibold tracking-wide" style={{ color: '#9E0059' }}>
            {nombrePareja}
          </h1>
          <p className="text-sm mt-1" style={{ color: '#6B7280' }}>
            Panel de Invitados
          </p>
        </div>

        <form onSubmit={handleSubmit} noValidate>
          <label htmlFor="pass" className="block text-sm font-medium mb-2" style={{ color: '#4B5563' }}>
            Contraseña de acceso
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
              className={`
                w-full rounded-xl px-4 py-3 pr-12 text-base
                bg-white/70 border transition-all duration-200
                ${error
                  ? 'border-red-400 focus:border-red-500'
                  : 'border-pink-200 focus:border-pink-400'}
                focus:outline-none focus:ring-2 focus:ring-pink-200
              `}
            />
            <button
              type="button"
              onClick={() => setShow(s => !s)}
              aria-label={show ? 'Ocultar contraseña' : 'Mostrar contraseña'}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg text-gray-400 hover:text-gray-600 transition-colors"
            >
              {show ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>

          {error && (
            <p id="pass-error" role="alert" className="text-xs mt-2 text-red-600 animate-in">
              Contraseña incorrecta. Inténtalo de nuevo.
            </p>
          )}

          <button
            type="submit"
            disabled={loading || !value}
            className="
              mt-5 w-full py-3 rounded-xl text-white font-medium text-sm tracking-wide
              transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed
              active:scale-[.98]
            "
            style={{ background: loading ? '#C2185B' : 'linear-gradient(135deg, #C2185B 0%, #9E0059 100%)' }}
          >
            {loading ? 'Verificando…' : 'Entrar al panel'}
          </button>
        </form>

        <p className="text-center text-xs mt-6" style={{ color: '#9CA3AF' }}>
          © {new Date().getFullYear()} Elysium Invitaciones
        </p>
      </div>
    </div>
  )
}
