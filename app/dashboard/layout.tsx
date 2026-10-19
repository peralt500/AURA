import { redirect } from 'next/navigation'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Creator } from '@/types/database'
import { Sparkles, LogOut, ExternalLink, Compass, User } from 'lucide-react'
import Link from 'next/link'

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // Buscar el perfil del creador vinculado al usuario
  const admin = createAdminClient()
  const { data: creator } = await admin
    .from('creators')
    .select('display_name, username, avatar_url')
    .eq('user_id', user.id)
    .single()

  const creatorData = creator as unknown as Pick<Creator, 'display_name' | 'username' | 'avatar_url'> | null

  return (
    <div className="min-h-screen flex flex-col selection:bg-purple-600 selection:text-white">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 glass border-b border-white/5 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-6">
            <Link href="/explore" className="flex items-center gap-2.5 group">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 group-hover:border-purple-500 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
              <span className="font-extrabold text-base tracking-wider bg-gradient-to-r from-white to-purple-300 bg-clip-text text-transparent">
                AURA
              </span>
            </Link>

            <div className="flex items-center gap-4">
              {/* Título (NO botón) según instrucción del usuario */}
              <span className="text-xs sm:text-sm font-bold text-white tracking-wide border-l border-white/10 pl-4 py-1">
                Panel del Creador
              </span>

              <Link
                href="/explore"
                className="hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-white py-1 px-2.5 rounded-lg hover:bg-white/5 transition-colors"
              >
                <Compass className="w-3.5 h-3.5 text-purple-400" />
                <span>Explorar Feed</span>
              </Link>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Link a su perfil público en la MISMA página (SIN target="_blank") */}
            {creatorData?.username && (
              <Link
                href={`/${creatorData.username}`}
                className="flex items-center gap-1.5 text-xs text-purple-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-xl transition-all"
                title="Ir a tu perfil oficial (misma página)"
              >
                <User className="w-3.5 h-3.5" />
                <span>Mi Perfil</span>
              </Link>
            )}

            {/* Avatar & Identidad */}
            <div className="flex items-center gap-2 pl-2 border-l border-white/10">
              {creatorData?.avatar_url ? (
                <img
                  src={creatorData.avatar_url}
                  alt={creatorData.display_name}
                  className="w-8 h-8 rounded-full object-cover border border-white/10"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                  {(creatorData?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xs font-medium hidden md:block truncate max-w-[120px]">
                {creatorData?.display_name || user.email}
              </span>
            </div>

            {/* Logout */}
            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-xl transition-colors"
                title="Cerrar sesión"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>
    </div>
  )
}
