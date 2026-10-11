import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Sube tus fotos · Álbum del evento',
  description: 'Comparte las fotos que tomaste en el evento.',
  robots: { index: false, follow: false },
}

export default function SubirLayout({ children }: { children: React.ReactNode }) {
  return children
}
