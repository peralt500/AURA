'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

export async function signInWithMagicLink(formData: FormData) {
  const email = formData.get('email')?.toString()
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
      return { error: 'Límite de correos por hora alcanzado en Supabase. Puedes acceder con tu contraseña temporal mientras tanto.' }
    }
    return { error: error.message }
  }
  return { success: true }
}

export async function signInWithPassword(formData: FormData) {
  const email = formData.get('email')?.toString()?.trim()
  const password = formData.get('password')?.toString()
  if (!email || !password) return { error: 'Email y contraseña requeridos.' }

  const supabase = createClient()
  const { error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) return { error: error.message }
  return { success: true }
}

export async function signOut() {
  const supabase = createClient()
  await supabase.auth.signOut()
  revalidatePath('/', 'layout')
}
