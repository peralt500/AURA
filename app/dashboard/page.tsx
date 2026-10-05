import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { DashboardTabs, OnboardingForm } from '@/components/dashboard'
import { Creator, Fan, EventItem, GalleryItem, BroadcastLog } from '@/types/database'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Panel del Creador | Agenda Creadores',
}

export default async function DashboardPage() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  const admin = createAdminClient()

  // Obtener el perfil del creador
  const { data: creatorData } = await admin
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (!creatorData) {
    return <OnboardingForm userEmail={user.email} />
  }

  const creator = creatorData as unknown as Creator

  // Obtener todos los datos en paralelo
  const [
    { data: fans },
    { data: events },
    { data: galleryItems },
    { data: broadcastLogs },
  ] = await Promise.all([
    admin.from('fans').select('*').eq('creator_id', creator.id).order('created_at', { ascending: false }),
    admin.from('events').select('*').eq('creator_id', creator.id).order('event_date', { ascending: true }),
    admin.from('gallery_items').select('*').eq('creator_id', creator.id).order('sort_order', { ascending: true }),
    admin.from('broadcast_logs').select('*').eq('creator_id', creator.id).order('sent_at', { ascending: false }),
  ])

  const now = new Date()
  const confirmedFansCount = (fans || []).filter((f: Fan) => f.confirmed_at && !f.unsubscribed_at).length
  const upcomingEventsCount = (events || []).filter((e: EventItem) => new Date(e.event_date) > now).length

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Welcome header */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold">Bienvenido, {creator.display_name} 👋</h2>
        <p className="text-muted-foreground text-sm mt-1">
          Gestiona tu perfil, fans, eventos y galería desde aquí.
        </p>
      </div>

      <DashboardTabs
        creator={creator}
        fans={(fans || []) as Fan[]}
        events={(events || []) as EventItem[]}
        galleryItems={(galleryItems || []) as GalleryItem[]}
        broadcastLogs={(broadcastLogs || []) as BroadcastLog[]}
        confirmedFansCount={confirmedFansCount}
        upcomingEventsCount={upcomingEventsCount}
      />
    </div>
  )
}
