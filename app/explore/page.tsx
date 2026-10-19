import { createAdminClient, createClient } from '@/lib/supabase/server'
import { ExploreFeed } from '@/components/explore/ExploreFeed'
import { Creator, EventItem, GalleryItem } from '@/types/database'
import type { Metadata } from 'next'

export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  title: 'Explorar Creadores y Feed Social | AURA',
  description: 'Descubre artistas, eventos en vivo, fotos y novedades exclusivas en AURA.',
}

export default async function ExplorePage() {
  const admin = createAdminClient()
  const authSupabase = createClient()

  // Obtener usuario autenticado si existe
  const { data: { user } } = await authSupabase.auth.getUser()

  let currentCreator: Creator | null = null
  if (user) {
    const { data: creatorData } = await admin
      .from('creators')
      .select('*')
      .eq('user_id', user.id)
      .single()
    currentCreator = creatorData as unknown as Creator
  }

  // Cargar datos del feed en paralelo
  const [
    { data: creatorsData },
    { data: eventsData },
    { data: galleryData },
  ] = await Promise.all([
    admin.from('creators').select('*').order('created_at', { ascending: false }),
    admin
      .from('events')
      .select('*, creators ( username, display_name, avatar_url )')
      .order('event_date', { ascending: true }),
    admin
      .from('gallery_items')
      .select('*, creators ( username, display_name, avatar_url )')
      .order('created_at', { ascending: false }),
  ])

  const creators = (creatorsData || []) as unknown as Creator[]
  const events = (eventsData || []) as any[]
  const galleryItems = (galleryData || []) as any[]

  return (
    <ExploreFeed
      creators={creators}
      events={events}
      galleryItems={galleryItems}
      currentUser={user}
      currentCreator={currentCreator}
    />
  )
}
