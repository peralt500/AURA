import { notFound } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { CreatorHeader, SocialHub, Gallery, EventsAgenda, FanCaptureForm } from '@/components/landing'
import { Creator, EventItem, GalleryItem, SocialLinks } from '@/types/database'
import { Metadata } from 'next'

interface CreatorPageProps {
  params: {
    username: string
  }
}

// Generación de metadatos SEO
export async function generateMetadata({ params }: CreatorPageProps): Promise<Metadata> {
  const supabase = createClient()
  const { data } = await supabase
    .from('creators')
    .select('display_name, bio, avatar_url')
    .eq('username', params.username)
    .single()
    
  const creator = data as unknown as Creator

  if (!creator) return { title: 'Creador no encontrado' }

  return {
    title: `${creator.display_name} | Sitio Oficial`,
    description: creator.bio || `Descubre las próximas fechas y novedades de ${creator.display_name}.`,
    openGraph: {
      images: creator.avatar_url ? [creator.avatar_url] : [],
    }
  }
}

export default async function CreatorPage({ params }: CreatorPageProps) {
  const supabase = createClient()

  // Obtener perfil del creador
  const { data: creatorData } = await supabase
    .from('creators')
    .select('*')
    .eq('username', params.username)
    .single()
    
  const creator = creatorData as unknown as Creator

  if (!creator) {
    notFound()
  }

  // Obtener agenda
  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('creator_id', creator.id)
    .order('event_date', { ascending: true })

  // Obtener galería
  const { data: galleryItems } = await supabase
    .from('gallery_items')
    .select('*')
    .eq('creator_id', creator.id)
    .order('sort_order', { ascending: true })

  return (
    <main className="min-h-screen relative overflow-hidden pb-20">
      {/* Background Decorativo */}
      <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-purple-900/20 to-background -z-10" />
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-purple-600/10 rounded-full blur-[100px] -z-10 pointer-events-none" />

      <div className="max-w-4xl mx-auto px-4 pt-16 space-y-16">
        {/* Cabecera y Redes */}
        <section className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
          <CreatorHeader creator={creator} />
          <SocialHub socialLinks={creator.social_links as SocialLinks} />
        </section>

        {/* Captura de Fans */}
        <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-150 fill-mode-both">
          <FanCaptureForm creatorId={creator.id} />
        </section>

        {/* Agenda */}
        {events && events.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300 fill-mode-both">
            <EventsAgenda events={events as EventItem[]} />
          </section>
        )}

        {/* Galería */}
        {galleryItems && galleryItems.length > 0 && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 delay-500 fill-mode-both">
            <Gallery items={galleryItems as GalleryItem[]} />
          </section>
        )}
      </div>
    </main>
  )
}
