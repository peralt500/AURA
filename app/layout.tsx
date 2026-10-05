import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Agenda & Fan Hub de Creadores',
  description: 'Conecta con tus fans, comparte tus próximas fechas y mantén a tu comunidad informada.',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="es" className="dark">
      <body className="bg-background text-foreground min-h-screen selection:bg-purple-600 selection:text-white">
        {children}
      </body>
    </html>
  )
}
