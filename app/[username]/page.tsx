import { notFound } from 'next/navigation'
import Link from 'next/link'
import { createClient, createAdminClient } from '@/lib/supabase/server'
import { CreatorHeader, SocialHub, Gallery, EventsAgenda, FanCaptureForm } from '@/components/landing'
import { Creator, EventItem, GalleryItem, SocialLinks } from '@/types/database'
import { Metadata } from 'next'
import { ArrowLeft, User as UserIcon } from 'lucide-react'
import { getCreatorStats } from '@/lib/actions/follows'

interface CreatorPageProps {
  params: {
    username: string
  }
}

// Generación de metadatos SEO
export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const admin = createAdminClient()
  const { data } = await admin
    .from('creators')
    .select('display_name, bio, avatar_url')
    .eq('username', params.username)
    .single()
    
  const creator = data as unknown as Creator

  if (!creator) return { title: 'Creador no encontrado' }

  return {
    title: `${creator.display_name} | Perfil Oficial en AURA`,
    description: creator.bio || `Descubre las próximas fechas y novedades de ${creator.display_name}.`,
    openGraph: {
      images: creator.avatar_url ? [creator.avatar_url] : [],
    }
  }
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const admin = createAdminClient()
  const authSupabase = createClient()

  // 1. Obtener usuario autenticado y su propio perfil (si tiene)
  const { data: { user } } = await authSupabase.auth.getUser()
  let viewerCreator: Creator | null = null

  if (user) {
    const { data } = await admin
      .from('creators')
      .select('username, display_name')
      .eq('user_id', user.id)
      .single()
    viewerCreator = data as unknown as Creator
  }

  // 2. Obtener perfil del creador de esta página
  const { data: creatorData } = await admin
    .from('creators')
    .select('*')
    .eq('username', params.username)
    .single()
    
  const creator = creatorData as unknown as Creator

  if (!creator) {
    notFound()
  }

  const isOwner = Boolean(user && creator.user_id === user.id)

  // 3. Obtener estadísticas del creador (fans por correo, seguidores, eventos)
  const stats = await getCreatorStats(creator.id)

  // 4. Obtener agenda de eventos
  const { data: events } = await admin
    .from('events')
    .select('*')
    .eq('creator_id', creator.id)
    .order('event_date', { ascending: true })

  // 5. Obtener galería
  const { data: galleryItems } = await admin
    .from('gallery_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('sort_order', { ascending: true })

  return (
    <main className="min-h-screen relative overflow-hidden pb-20 selection:bg-purple-600 selection:text-white">
      {/* Background Decorativo */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/20 to-background -z-10" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      {/* Floating Top Nav (Navegación fluida en la misma pestaña) */}
      <div className="sticky top-4 z-40 max-w-4xl mx-auto px-4">
        <div className="glass px-4 py-2.5 rounded-2xl border border-white/10 flex items-center justify-between shadow-xl backdrop-blur-xl text-xs">
          <Link
            href="/explore"
            className="flex items-center gap-1.5 text-muted-foreground hover:text-white transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span className="font-medium">Explorar Feed</span>
          </Link>

          <div className="flex items-center gap-3">
            {viewerCreator && !isOwner ? (
              <Link
                href={`/${viewerCreator.username}`}
                className="px-3.5 py-1.5 bg-white/10 hover:bg-white/15 text-white rounded-xl font-medium transition-colors flex items-center gap-1.5"
              >
                <UserIcon className="w-3 h-3 text-purple-400" />
                <span>Mi Perfil</span>
              </Link>
            ) : !user ? (
              <Link
                href="/login?tab=register"
                className="text-purple-300 hover:text-white transition-colors flex items-center gap-1 font-medium"
              >
                <span>Crea tu perfil gratis</span>
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 pt-8 space-y-14">
        {/* Cabecera con Botón Seguir y los 3 Contadores */}
        <section className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CreatorHeader
            creator={creator}
            fansCount={stats.fansCount}
            followersCount={stats.followersCount}
            eventsCount={stats.eventsCount}
            isOwner={isOwner}
            initialFollowing={stats.isFollowing}
          />
          <SocialHub socialLinks={creator.social_links as SocialLinks} />
        </section>

        {/* Captura de Fans (Instantánea y limpia, sin Turnstile) */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FanCaptureForm creatorId={creator.id} />
        </section>

        {/* Agenda de eventos */}
        {events && events.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <EventsAgenda events={events as EventItem[]} />
          </section>
        )}

        {/* Galería de fotos */}
        {galleryItems && galleryItems.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
            <Gallery items={galleryItems as GalleryItem[]} />
          </section>
        )}
      </div>
    </main>
  )
}
