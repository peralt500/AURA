import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { signOut } from '@/lib/actions/auth'
import { Creator } from '@/types/database'
import { Sparkles, LogOut, ExternalLink } from 'lucide-react'
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
    <div className="min-h-screen flex flex-col">
      {/* Top navbar */}
      <header className="sticky top-0 z-50 glass border-b border-white/5">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30">
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold hidden sm:block">Panel del Creador</span>
          </div>

          <div className="flex items-center gap-3">
            {creatorData?.username && (
              <Link
                href={`/${creatorData.username}`}
                target="_blank"
                className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-white transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                <span className="hidden sm:inline">Ver perfil</span>
              </Link>
            )}

            <div className="flex items-center gap-2">
              {creatorData?.avatar_url ? (
                <img src={creatorData.avatar_url} alt={creatorData.display_name} className="w-8 h-8 rounded-full object-cover border border-white/10" />
              ) : (
                <div className="w-8 h-8 rounded-full bg-purple-600/30 border border-purple-500/20 flex items-center justify-center text-xs font-bold text-purple-300">
                  {(creatorData?.display_name || user.email || 'U').charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-sm hidden md:block truncate max-w-[120px]">
                {creatorData?.display_name || user.email}
              </span>
            </div>

            <form action={signOut}>
              <button
                type="submit"
                className="p-2 text-muted-foreground hover:text-white hover:bg-white/5 rounded-lg transition-colors"
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
