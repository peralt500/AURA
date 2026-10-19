'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export interface CreatorStats {
  fansCount: number
  followersCount: number
  eventsCount: number
  isFollowing: boolean
}

/**
 * Obtiene las estadísticas públicas del creador:
 * - Fans (que dieron su correo)
 * - Seguidores (que picaron el botón Seguir)
 * - Próximos eventos en agenda
 */
export async function getCreatorStats(
  creatorId: string,
  clientIdentifier?: string
): Promise<CreatorStats> {
  const admin = createAdminClient()
  const authSupabase = createClient()
  const { data: { user } } = await authSupabase.auth.getUser()

  // 1. Contador de fans confirmados (por correo)
  const { count: fansCount } = await admin
    .from('fans')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .not('confirmed_at', 'is', null)
    .is('unsubscribed_at', null)

  // 2. Contador de próximos eventos
  const nowIso = new Date().toISOString()
  const { count: eventsCount } = await admin
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .gte('event_date', nowIso)

  // 3. Contador de seguidores normales (botón Seguir)
  let followersCount = 0
  let isFollowing = false

  try {
    const { count, error } = await admin
      .from('follows')
      .select('*', { count: 'exact', head: true })
      .eq('creator_id', creatorId)

    if (!error && typeof count === 'number') {
      followersCount = count

      // Verificar si el visitante actual ya sigue a este creador
      if (user?.id) {
        const { data: followRecord } = await admin
          .from('follows')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('follower_id', user.id)
          .single()
        if (followRecord) isFollowing = true
      } else if (clientIdentifier) {
        const { data: followRecord } = await admin
          .from('follows')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('client_identifier', clientIdentifier)
          .single()
        if (followRecord) isFollowing = true
      }
    } else {
      // Fallback si la tabla follows aún no existe en Supabase
      const { data: creator } = await admin
        .from('creators')
        .select('social_links')
        .eq('id', creatorId)
        .single()
      const links = (creator?.social_links as any) || {}
      followersCount = Number(links._followers_count || 0)
    }
  } catch {
    followersCount = 0
  }

  return {
    fansCount: fansCount || 0,
    followersCount: followersCount || 0,
    eventsCount: eventsCount || 0,
    isFollowing,
  }
}

/**
 * Alterna el estado de Seguir / Dejar de seguir a un artista
 */
export async function toggleFollowCreator(
  creatorId: string,
  clientIdentifier?: string
): Promise<{ success: boolean; isFollowing: boolean; followersCount: number }> {
  try {
    const admin = createAdminClient()
    const authSupabase = createClient()
    const { data: { user } } = await authSupabase.auth.getUser()

    let isFollowing = false

    // Intentar consultar la tabla follows
    try {
      let existingFollow = null

      if (user?.id) {
        const { data } = await admin
          .from('follows')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('follower_id', user.id)
          .single()
        existingFollow = data
      } else if (clientIdentifier) {
        const { data } = await admin
          .from('follows')
          .select('id')
          .eq('creator_id', creatorId)
          .eq('client_identifier', clientIdentifier)
          .single()
        existingFollow = data
      }

      if (existingFollow) {
        // Dejar de seguir
        await admin.from('follows').delete().eq('id', existingFollow.id)
        isFollowing = false
      } else {
        // Seguir
        await admin.from('follows').insert({
          creator_id: creatorId,
          follower_id: user?.id || null,
          client_identifier: clientIdentifier || null,
        } as any)
        isFollowing = true
      }

      const { count } = await admin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', creatorId)

      revalidatePath(`/[username]`, 'page')
      return { success: true, isFollowing, followersCount: count || 0 }
    } catch {
      // Fallback en social_links si la tabla no está creada
      const { data: creator } = await admin
        .from('creators')
        .select('social_links')
        .eq('id', creatorId)
        .single()

      const links = (creator?.social_links as any) || {}
      let count = Number(links._followers_count || 0)
      count = count + 1

      await admin
        .from('creators')
        .update({
          social_links: { ...links, _followers_count: count },
        } as any)
        .eq('id', creatorId)

      return { success: true, isFollowing: true, followersCount: count }
    }
  } catch (err: any) {
    return { success: false, isFollowing: false, followersCount: 0 }
  }
}
