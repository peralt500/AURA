'use server'

import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface FanCaptureResult {
  success: boolean
  message: string
}

export async function captureFan(formData: FormData): Promise<FanCaptureResult> {
  const email = formData.get('email')?.toString()
  const creatorId = formData.get('creatorId')?.toString()
  const turnstileToken = formData.get('cf-turnstile-response')?.toString()

  if (!email || !creatorId || !turnstileToken) {
    return { success: false, message: 'Faltan datos obligatorios.' }
  }

  // 1. Validar Turnstile
  const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
  })
  
  const verifyData = await verifyRes.json()
  if (!verifyData.success) {
    return { success: false, message: 'Verificación de seguridad fallida.' }
  }

  const supabase = createAdminClient()

  // 2. Comprobar si ya existe
  const { data: existingFan } = await supabase
    .from('fans')
    .select('id, confirmed_at, unsubscribed_at')
    .eq('creator_id', creatorId)
    .eq('email', email)
    .single()

  if (existingFan) {
    if (existingFan.unsubscribed_at) {
      return { success: false, message: 'Te diste de baja anteriormente. Contáctanos para volver a suscribirte.' }
    }
    if (existingFan.confirmed_at) {
      return { success: true, message: '¡Ya estás en la lista! No tienes que hacer nada más.' }
    }
    // Si existe pero no está confirmado, podemos reenviar el correo (lo ideal es evitar spam, pero aquí lo haremos simple)
  }

  // 3. Insertar nuevo fan (o actualizar si estaba en otro estado, aunque el UNIQUE lo manejará)
  const { data: newFan, error: insertError } = await supabase
    .from('fans')
    .upsert(
      { creator_id: creatorId, email: email, unsubscribed_at: null },
      { onConflict: 'creator_id, email' }
    )
    .select('confirm_token')
    .single()

  if (insertError || !newFan) {
    console.error('Error insertando fan:', insertError)
    return { success: false, message: 'Error interno al registrarte. Intenta de nuevo.' }
  }

  // 4. Enviar correo de confirmación
  const confirmUrl = `${process.env.NEXT_PUBLIC_SITE_URL}/api/confirm?token=${newFan.confirm_token}`
  
  try {
    await resend.emails.send({
      from: process.env.RESEND_FROM_EMAIL!,
      to: email,
      subject: 'Confirma tu suscripción 💌',
      html: `
        <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto;">
          <h2>¡Gracias por unirte!</h2>
          <p>Para confirmar que eres tú y empezar a recibir noticias, por favor haz clic en el siguiente enlace:</p>
          <a href="${confirmUrl}" style="display: inline-block; padding: 12px 24px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 8px; margin-top: 16px;">
            Confirmar suscripción
          </a>
          <p style="margin-top: 24px; font-size: 12px; color: #666;">
            Si no solicitaste esto, puedes ignorar este correo.
          </p>
        </div>
      `,
    })
  } catch (error) {
    console.error('Error enviando email:', error)
    return { success: false, message: 'Te registramos, pero hubo un error enviando el correo de confirmación.' }
  }

  return { success: true, message: '¡Revisa tu correo para confirmar!' }
}
