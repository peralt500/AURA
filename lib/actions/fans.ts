'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { Resend } from 'resend'

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null

interface FanCaptureResult {
  success: boolean
  message: string
}

/**
 * Captura directa de fan: Registro inmediato sin esperas ni Double Opt-in obligatorio.
 * Sin Cloudflare Turnstile.
 */
export async function captureFan(formData: FormData): Promise<FanCaptureResult> {
  const email = formData.get('email')?.toString()?.trim().toLowerCase()
  const creatorId = formData.get('creatorId')?.toString()

  if (!email || !creatorId) {
    return { success: false, message: 'El correo electrónico es obligatorio.' }
  }

  // Validación básica de email
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { success: false, message: 'Ingresa un correo electrónico válido.' }
  }

  const supabase = createAdminClient()

  // 1. Comprobar si ya existe
  const { data: existingFan } = await supabase
    .from('fans')
    .select('id, confirmed_at, unsubscribed_at')
    .eq('creator_id', creatorId)
    .eq('email', email)
    .single()

  if (existingFan) {
    if (existingFan.unsubscribed_at) {
      // Reactivar suscripción
      await supabase
        .from('fans')
        .update({
          confirmed_at: new Date().toISOString(),
          unsubscribed_at: null,
        } as any)
        .eq('id', existingFan.id)

      revalidatePath('/dashboard')
      return { success: true, message: '¡Te has vuelto a suscribir con éxito a la comunidad!' }
    }

    if (existingFan.confirmed_at) {
      return { success: true, message: '¡Ya estás suscrito a esta comunidad! Te mantendremos al tanto.' }
    }

    // Si estaba pendiente, lo confirmamos directamente
    await supabase
      .from('fans')
      .update({
        confirmed_at: new Date().toISOString(),
      } as any)
      .eq('id', existingFan.id)

    revalidatePath('/dashboard')
    return { success: true, message: '¡Listo! Tu suscripción ha quedado activa inmediatamente.' }
  }

  // 2. Insertar nuevo fan directamente CONFIRMADO (sin double opt-in)
  const nowIso = new Date().toISOString()
  const { data: newFan, error: insertError } = await supabase
    .from('fans')
    .upsert(
      {
        creator_id: creatorId,
        email: email,
        confirmed_at: nowIso,
        unsubscribed_at: null,
      } as any,
      { onConflict: 'creator_id, email' }
    )
    .select('id, unsubscribe_token')
    .single()

  if (insertError || !newFan) {
    console.error('Error insertando fan:', insertError)
    return { success: false, message: 'Error interno al registrarte. Intenta de nuevo.' }
  }

  // Obtener nombre del creador para el mensaje de bienvenida
  const { data: creator } = await supabase
    .from('creators')
    .select('display_name, username')
    .eq('id', creatorId)
    .single()

  // 3. Opcional: Enviar email de bienvenida (sin bloquear si falla)
  if (resend && process.env.RESEND_FROM_EMAIL) {
    const creatorName = creator?.display_name || 'tu artista favorito'
    const profileUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ''}/${creator?.username || ''}`
    
    try {
      await resend.emails.send({
        from: process.env.RESEND_FROM_EMAIL,
        to: email,
        subject: `¡Bienvenido a la comunidad de ${creatorName}! 🎵`,
        html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #0f0d1a; color: #ffffff; border-radius: 16px;">
            <h2 style="color: #c084fc; margin-bottom: 12px;">¡Ya eres parte de la comunidad!</h2>
            <p style="color: #cbd5e1; font-size: 15px; line-height: 1.6;">
              Te has suscrito exitosamente a las actualizaciones de <strong>${creatorName}</strong> en AURA.
            </p>
            <p style="color: #94a3b8; font-size: 14px; line-height: 1.5;">
              Recibirás las fechas de conciertos, lanzamientos de nueva música y noticias exclusivas antes que nadie.
            </p>
            ${profileUrl ? `
              <div style="margin: 24px 0;">
                <a href="${profileUrl}" style="display: inline-block; padding: 12px 24px; background-color: #9333ea; color: white; text-decoration: none; border-radius: 10px; font-weight: bold;">
                  Ver perfil de ${creatorName}
                </a>
              </div>
            ` : ''}
          </div>
        `,
      })
    } catch (err) {
      // Ignoramos silenciosamente si Resend no puede entregar el email (ej. sandbox sin dominio)
      console.warn('Nota: Email de bienvenida opcional no pudo enviarse:', err)
    }
  }

  revalidatePath('/dashboard')
  return { success: true, message: '¡Te has unido con éxito! Ya formas parte de la comunidad.' }
}

/**
 * Confirmar un fan manualmente desde el panel de control.
 */
export async function confirmFanManually(fanId: string) {
  try {
    const authSupabase = createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return { error: 'No autenticado.' }

    const admin = createAdminClient()

    // Verificar que el fan pertenece al creador logueado
    const { data: creator } = await admin
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!creator) return { error: 'Creador no encontrado.' }

    const { error } = await admin
      .from('fans')
      .update({
        confirmed_at: new Date().toISOString(),
        unsubscribed_at: null,
      } as any)
      .eq('id', fanId)
      .eq('creator_id', creator.id)

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true }
  } catch (err: any) {
    return { error: err.message }
  }
}

/**
 * Confirmar TODOS los fans pendientes de una sola vez.
 */
export async function confirmAllPendingFans() {
  try {
    const authSupabase = createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return { error: 'No autenticado.' }

    const admin = createAdminClient()

    const { data: creator } = await admin
      .from('creators')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (!creator) return { error: 'Creador no encontrado.' }

    const { data: updatedFans, error } = await admin
      .from('fans')
      .update({
        confirmed_at: new Date().toISOString(),
      } as any)
      .eq('creator_id', creator.id)
      .is('confirmed_at', null)
      .select('id')

    if (error) return { error: error.message }

    revalidatePath('/dashboard')
    return { success: true, count: updatedFans?.length || 0 }
  } catch (err: any) {
    return { error: err.message }
  }
}
