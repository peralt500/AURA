import Link from 'next/link'
import { Sparkles, Calendar, Users, Mail } from 'lucide-react'

export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center relative overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-600/20 rounded-full blur-3xl pointer-events-none" />

      <div className="relative z-10 max-w-xl mx-auto space-y-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-sm font-medium">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>Plataforma MVP para Creadores & Artistas</span>
        </div>

        <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-purple-400 bg-clip-text text-transparent">
          Tu comunidad de fans en un solo lugar
        </h1>

        <p className="text-muted-foreground text-base md:text-lg">
          Landing pública, captura de fans con doble confirmación, agenda de eventos y difusión masiva por correo.
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4">
          <Link
            href="/login"
            className="px-6 py-3 rounded-xl font-medium bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-lg shadow-purple-600/25 text-center"
          >
            Acceder al Panel de Control
          </Link>
        </div>

        <div className="grid grid-cols-3 gap-4 pt-12 text-left border-t border-border">
          <div className="space-y-1">
            <Users className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-sm">Fans Directos</p>
            <p className="text-xs text-muted-foreground">Sin algoritmos ni intermediarios</p>
          </div>
          <div className="space-y-1">
            <Calendar className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-sm">Agenda</p>
            <p className="text-xs text-muted-foreground">Fechas y venta de boletos</p>
          </div>
          <div className="space-y-1">
            <Mail className="w-5 h-5 text-purple-400" />
            <p className="font-semibold text-sm">Difusión</p>
            <p className="text-xs text-muted-foreground">Envíos por lote vía Resend</p>
          </div>
        </div>
      </div>
    </main>
  )
}
