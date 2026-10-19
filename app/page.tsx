import Link from 'next/link'
import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Sparkles, ArrowRight, Zap, Globe, Users, LogIn, UserPlus } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const authSupabase = createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  // Verificación de Sesión Activa: Si ya inició sesión, redirigir automáticamente al Inicio (/explore)
  if (user) {
    redirect('/explore')
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col justify-between selection:bg-purple-600 selection:text-white">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[500px] bg-purple-600/15 rounded-full blur-[140px] pointer-events-none -z-10" />
      <div className="absolute top-2/3 right-10 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Header / Navbar */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-purple-600/20 border border-purple-500/30 group-hover:border-purple-500 transition-colors shadow-sm">
              <Sparkles className="w-5 h-5 text-purple-400" />
            </div>
            <span className="font-extrabold text-lg tracking-wider bg-gradient-to-r from-white via-neutral-200 to-purple-400 bg-clip-text text-transparent">
              AURA
            </span>
          </Link>

          <nav className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-xs font-semibold text-muted-foreground hover:text-white transition-colors px-3 py-2"
            >
              Ingresar
            </Link>
            <Link
              href="/login?tab=register"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-semibold rounded-xl transition-all shadow-md shadow-purple-600/20 flex items-center gap-1.5"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Crear Perfil</span>
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl mx-auto px-4 py-16 sm:py-24 text-center relative z-10 space-y-8">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs sm:text-sm font-medium animate-in fade-in slide-in-from-bottom-2 duration-500">
          <Sparkles className="w-4 h-4 text-purple-400" />
          <span>La Red Abierta para Creadores & Fans</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight max-w-3xl mx-auto leading-tight bg-gradient-to-r from-white via-neutral-100 to-purple-300 bg-clip-text text-transparent">
          Tu universo artístico y tu comunidad en un solo lugar
        </h1>

        <p className="text-muted-foreground text-base sm:text-lg max-w-xl mx-auto leading-relaxed">
          Centraliza tus redes sociales, publica tus conciertos, comparte actualizaciones y conecta con tus seguidores sin intermediarios ni algoritmos que silencien tu contenido.
        </p>

        {/* Botones de Acción Claros: Ingresar y Crear Perfil */}
        <div className="flex flex-col sm:flex-row gap-3.5 justify-center pt-2 max-w-md mx-auto">
          <Link
            href="/login?tab=register"
            className="px-7 py-3.5 rounded-2xl font-bold bg-purple-600 hover:bg-purple-500 text-white transition-all shadow-xl shadow-purple-600/30 flex items-center justify-center gap-2 text-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Crear Perfil</span>
          </Link>

          <Link
            href="/login"
            className="px-7 py-3.5 rounded-2xl font-bold bg-white/5 hover:bg-white/10 border border-white/10 text-white transition-all flex items-center justify-center gap-2 text-sm"
          >
            <LogIn className="w-4 h-4 text-purple-400" />
            <span>Ingresar</span>
          </Link>
        </div>

        {/* 3 Propuestas de Valor Claras */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-12 text-left">
          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
            <Zap className="w-5 h-5 text-purple-400" />
            <p className="font-bold text-sm text-white">Acceso Inmediato</p>
            <p className="text-xs text-muted-foreground">
              Sin esperas de correo de verificación ni captchas. Entras directamente al feed al registrarte.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
            <Globe className="w-5 h-5 text-purple-400" />
            <p className="font-bold text-sm text-white">Perfil Centralizado</p>
            <p className="text-xs text-muted-foreground">
              Tu enlace único con todas tus redes, galería de momentos destacados y fechas en vivo.
            </p>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-white/5 space-y-2">
            <Users className="w-5 h-5 text-purple-400" />
            <p className="font-bold text-sm text-white">Comunidad Directa</p>
            <p className="text-xs text-muted-foreground">
              Descubre creadores en el feed, sigue a tus favoritos y recibe a tus fans sin fricción.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/5 py-8 text-center text-xs text-muted-foreground relative z-10">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p>© {new Date().getFullYear()} AURA · El hub abierto para artistas y creadores.</p>
          <div className="flex items-center gap-4">
            <Link href="/login" className="hover:text-white transition-colors">Ingresar</Link>
            <Link href="/login?tab=register" className="hover:text-white transition-colors">Crear Perfil</Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
