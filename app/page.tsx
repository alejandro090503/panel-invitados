import { Heart } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-dvh flex items-center justify-center px-4">
      <div className="glass rounded-3xl p-10 w-full max-w-sm text-center animate-in">
        <div
          className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ background: 'linear-gradient(135deg, #F9A8D4 0%, #9E0059 100%)' }}
        >
          <Heart size={22} color="white" strokeWidth={1.8} />
        </div>
        <h1 className="text-2xl font-semibold tracking-wide" style={{ color: '#9E0059' }}>
          Panel de Invitados
        </h1>
        <p className="text-sm mt-2" style={{ color: '#6B7280' }}>
          Accede con el enlace que te proporcionamos.
        </p>
        <p className="text-center text-xs mt-8" style={{ color: '#9CA3AF' }}>
          © {new Date().getFullYear()} Elysium Invitaciones
        </p>
      </div>
    </div>
  )
}
