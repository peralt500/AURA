'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

/**
 * Registro unificado e inmediato de usuario (Fan + Artista):
 * Crea cuenta en Auth con email_confirm=true (sin esperas de correo),
 * genera automáticamente su perfil en creators y abre sesión de inmediato.
 */
export async function signUpUser(formData: FormData) {
  const email = formData.get('email')?.toString()?.trim().toLowerCase()
  const password = formData.get('password')?.toString()
  const displayName = formData.get('display_name')?.toString()?.trim()
  let username = formData.get('username')?.toString()?.trim().toLowerCase()

  if (!email || !password || !displayName) {
    return { error: 'Por favor completa todos los campos requeridos.' }
  }

  if (password.length < 6) {
    return { error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  // Generar o limpiar username
  if (!username) {
    username = displayName.toLowerCase().replace(/[^a-z0-9_-]/g, '').slice(0, 20) || email.split('@')[0].replace(/[^a-z0-9_-]/g, '')
  } else {
    username = username.replace(/[^a-z0-9_-]/g, '').toLowerCase()
  }

  if (username.length < 3) {
    username = `user_${Math.random().toString(36).substring(2, 7)}`
  }

  const admin = createAdminClient()

  // 1. Verificar si el @username ya está ocupado en la tabla de creadores
  const { data: existingCreator } = await admin
    .from('creators')
    .select('id')
    .eq('username', username)
    .single()

  if (existingCreator) {
    // Si ya existe, añadir sufijo numérico único
    username = `${username}_${Math.floor(Math.random() * 900 + 100)}`
  }

  // 2. Crear usuario con confirmación automática (email_confirm: true)
  const { data: newUserData, error: createError } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: {
      display_name: displayName,
      username,
    },
  })

  if (createError) {
    if (createError.message.toLowerCase().includes('already registered')) {
      return { error: 'Este correo ya está registrado. Por favor inicia sesión.' }
    }
    return { error: createError.message }
  }

  const user = newUserData.user
  if (!user) {
    return { error: 'No se pudo crear el usuario. Intenta nuevamente.' }
  }

  // 3. Crear perfil unificado en tabla 'creators'
  const defaultAvatar = `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`
  const { error: creatorError } = await admin
    .from('creators')
    .insert({
      user_id: user.id,
      username,
      display_name: displayName,
      bio: `¡Hola! Soy ${displayName}. Descubre mis enlaces, fechas y novedades aquí en AURA.`,
      avatar_url: defaultAvatar,
      social_links: {},
    } as any)

  if (creatorError) {
    console.error('Error insertando perfil de creador unificado:', creatorError)
  }

  // 4. Iniciar sesión automáticamente en el cliente para inyectar cookies
  const clientSupabase = createClient()
  const { error: signInError } = await clientSupabase.auth.signInWithPassword({
    email,
    password,
  })

  if (signInError) {
    return { error: 'Cuenta creada, pero hubo un detalle iniciando sesión. Entra desde Iniciar Sesión.' }
  }

  revalidatePath('/dashboard')
  revalidatePath('/explore')
  revalidatePath(`/${username}`)
  revalidatePath('/', 'layout')

  return { success: true, username }
}

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()?.trim().toLowerCase()
  if (!email) return { error: 'El email es requerido.' }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/api/auth/callback`,
    },
  })

  if (error) {
    if (error.message.toLowerCase().includes('rate limit')) {
      return { error: 'Límite de correos por hora alcanzado en Supabase. Puedes acceder con tu contraseña mientras tanto.' }
    }
    return { error: error.message }
  }
  return { success: true }
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email')?.toString()?.trim().toLowerCase()
  const password = formData.get('password')?.toString()
  if (!email || !password) return { error: 'Email y contraseña requeridos.' }

  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error: error.message }

  // Asegurar que tenga perfil unificado en creators
  if (data.user) {
    const admin = createAdminClient()
    const { data: creator } = await admin
      .from('creators')
      .select('id')
      .eq('user_id', data.user.id)
      .single()

    if (!creator) {
      const suggestedUsername = (email.split('@')[0].replace(/[^a-z0-9_-]/g, '') || `user_${Math.random().toString(36).substring(2, 6)}`).toLowerCase()
      const displayName = data.user.user_metadata?.display_name || email.split('@')[0]
      await admin.from('creators').insert({
        user_id: data.user.id,
        username: suggestedUsername,
        display_name: displayName,
        bio: `Perfil oficial de ${displayName} en AURA.`,
        avatar_url: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80`,
        social_links: {},
      } as any)
    }
  }

  revalidatePath('/dashboard')
  revalidatePath('/explore')
  revalidatePath('/', 'layout')
  return { success: true }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
