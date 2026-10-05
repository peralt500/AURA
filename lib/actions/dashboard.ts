'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { uploadImage } from '@/lib/actions/storage'
import type { Json } from '@/types/database'

async function getCreatorIdForUser(): Promise<string> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('No autenticado')

  const admin = createAdminClient()
  const { data } = await admin
    .from('creators')
    .select('id')
    .eq('user_id', user.id)
    .single()

  if (!data) throw new Error('Creador no encontrado para este usuario')
  return (data as any).id as string
}

// ─── PERFIL INICIAL / ONBOARDING ─────────────────────────────────────────────

export async function createCreatorProfile(formData: FormData) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado.' }

    const displayName = formData.get('display_name')?.toString()?.trim()
    const username = formData.get('username')?.toString()?.trim()?.toLowerCase()
    const bio = formData.get('bio')?.toString()?.trim() || ''

    if (!displayName || !username) {
      return { error: 'El nombre artístico y el usuario (@slug) son obligatorios.' }
    }

    const validUsername = /^[a-z0-9_-]{3,30}$/.test(username)
    if (!validUsername) {
      return { error: 'El usuario solo puede contener letras minúsculas, números, guiones y guiones bajos (3 a 30 caracteres).' }
    }

    const admin = createAdminClient()

    const { data: existing } = await admin
      .from('creators')
      .select('id')
      .eq('username', username)
      .single()

    if (existing) {
      return { error: `El usuario @${username} ya está registrado por otro artista. Por favor elige otro.` }
    }

    const avatarUrl = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`

    const { error } = await admin
      .from('creators')
      .insert({
        user_id: user.id,
        username,
        display_name: displayName,
        bio: bio || `Perfil oficial de ${displayName}. Descubre mis próximas fechas y suscríbete a mis novedades.`,
        avatar_url: avatarUrl,
        social_links: {}
      } as any)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    revalidatePath(`/${username}`)
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ─── EVENTOS ─────────────────────────────────────────────────────────────────

export async function createEvent(formData: FormData) {
  try {
    const creatorId = await getCreatorIdForUser()
    const title = formData.get('title')?.toString()
    const eventDate = formData.get('event_date')?.toString()
    const location = formData.get('location')?.toString() || null
    const ticketUrl = formData.get('ticket_url')?.toString() || null

    if (!title || !eventDate) return { error: 'Título y fecha son obligatorios.' }

    const admin = createAdminClient()
    const { error } = await admin
      .from('events')
      .insert({ creator_id: creatorId, title, event_date: eventDate, location, ticket_url: ticketUrl } as any)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteEvent(eventId: string) {
  try {
    const creatorId = await getCreatorIdForUser()
    const admin = createAdminClient()
    const { error } = await admin
      .from('events')
      .delete()
      .eq('id', eventId)
      .eq('creator_id', creatorId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ─── PERFIL ───────────────────────────────────────────────────────────────────

export async function updateProfile(formData: FormData) {
  try {
    const creatorId = await getCreatorIdForUser()
    const displayName = formData.get('display_name')?.toString()
    const bio = formData.get('bio')?.toString() || null
    let avatarUrl = formData.get('avatar_url')?.toString() || null
    const instagram = formData.get('instagram')?.toString() || null
    const tiktok = formData.get('tiktok')?.toString() || null
    const youtube = formData.get('youtube')?.toString() || null
    const facebook = formData.get('facebook')?.toString() || null
    const shop = formData.get('shop')?.toString() || null

    const avatarFile = formData.get('avatar_file') as File | null
    if (avatarFile && avatarFile.size > 0) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', avatarFile)
      uploadFormData.append('folder', 'avatars')
      const uploadResult = await uploadImage(uploadFormData)
      if (uploadResult.error) {
        return { error: 'Error subiendo el avatar: ' + uploadResult.error }
      }
      if (uploadResult.url) {
        avatarUrl = uploadResult.url
      }
    }

    if (!displayName) return { error: 'El nombre es obligatorio.' }

    const socialLinks: Record<string, string> = {}
    if (instagram) socialLinks.instagram = instagram
    if (tiktok) socialLinks.tiktok = tiktok
    if (youtube) socialLinks.youtube = youtube
    if (facebook) socialLinks.facebook = facebook
    if (shop) socialLinks.shop = shop

    const admin = createAdminClient()
    const { error } = await admin
      .from('creators')
      .update({ display_name: displayName, bio, avatar_url: avatarUrl, social_links: socialLinks as Json } as any)
      .eq('id', creatorId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

// ─── GALERÍA ──────────────────────────────────────────────────────────────────

export async function addGalleryItem(formData: FormData) {
  try {
    const creatorId = await getCreatorIdForUser()
    let imageUrl = formData.get('image_url')?.toString()
    const caption = formData.get('caption')?.toString() || null

    const imageFile = formData.get('image_file') as File | null
    if (imageFile && imageFile.size > 0) {
      const uploadFormData = new FormData()
      uploadFormData.append('file', imageFile)
      uploadFormData.append('folder', 'gallery')
      const uploadResult = await uploadImage(uploadFormData)
      if (uploadResult.error) {
        return { error: 'Error subiendo la imagen: ' + uploadResult.error }
      }
      if (uploadResult.url) {
        imageUrl = uploadResult.url
      }
    }

    if (!imageUrl) return { error: 'Debes proporcionar una URL o subir una imagen.' }

    const admin = createAdminClient()

    // Obtener el sort_order más alto actual
    const { data: lastItem } = await admin
      .from('gallery_items')
      .select('sort_order')
      .eq('creator_id', creatorId)
      .order('sort_order', { ascending: false })
      .limit(1)
      .single()

    const nextOrder = lastItem ? (lastItem as any).sort_order + 1 : 1

    const { error } = await admin
      .from('gallery_items')
      .insert({ creator_id: creatorId, image_url: imageUrl, caption, sort_order: nextOrder } as any)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteGalleryItem(itemId: string) {
  try {
    const creatorId = await getCreatorIdForUser()
    const admin = createAdminClient()
    const { error } = await admin
      .from('gallery_items')
      .delete()
      .eq('id', itemId)
      .eq('creator_id', creatorId)

    if (error) return { error: error.message }
    revalidatePath('/dashboard')
    return { success: true }
  } catch (e: any) {
    return { error: e.message }
  }
}
