'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Resend } from 'resend'
import { revalidatePath } from 'next/cache'

const BATCH_SIZE = 100 // Límite de Resend batch.send

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br />')
}

function buildEmailHtml(subject: string, body: string, unsubscribeUrl: string, fromName: string, fromEmail: string): string {
  const safeBody = escapeHtml(body)
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${subject}</title>
  <style>
    body { margin: 0; padding: 0; background-color: #0a0a0a; color: #f0f0f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    .wrapper { max-width: 600px; margin: 0 auto; padding: 40px 20px; }
    .card { background: #171717; border: 1px solid #262626; border-radius: 12px; padding: 32px; }
    h1 { font-size: 22px; font-weight: 700; margin: 0 0 20px; color: #ffffff; }
    p { font-size: 15px; line-height: 1.7; color: #a3a3a3; margin: 0 0 16px; }
    .footer { margin-top: 32px; padding-top: 20px; border-top: 1px solid #262626; }
    .footer p { font-size: 12px; color: #525252; margin: 4px 0; }
    .footer a { color: #7c3aed; text-decoration: none; }
  </style>
</head>
<body>
  <div class="wrapper">
    <div class="card">
      <h1>${subject}</h1>
      <p>${safeBody}</p>
      <div class="footer">
        <p>Recibes este correo porque te suscribiste a las novedades de <strong>${fromName}</strong>.</p>
        <p>Remitente: <strong>${fromName}</strong> &lt;${fromEmail}&gt;</p>
        <p>¿No quieres recibir más correos? <a href="${unsubscribeUrl}">Darte de baja</a></p>
        <p>${fromName} · Enviado con Resend</p>
      </div>
    </div>
  </div>
</body>
</html>`
}

interface BroadcastResult {
  success?: boolean
  error?: string
  sent?: number
  failed?: number
}

export async function sendBroadcast(formData: FormData): Promise<BroadcastResult> {
  // 1. Verificar sesión
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'No autenticado.' }

  const admin = createAdminClient()

  // 2. Obtener creador
  const { data: creatorData } = await admin
    .from('creators')
    .select('id, display_name')
    .eq('user_id', user.id)
    .single()

  if (!creatorData) return { error: 'Perfil de creador no encontrado.' }
  const creator = creatorData as any

  // 3. Validar inputs
  const subject = formData.get('subject')?.toString()?.trim()
  const body = formData.get('body')?.toString()?.trim()
  if (!subject || !body) return { error: 'El asunto y el cuerpo son obligatorios.' }
  if (subject.length > 200) return { error: 'El asunto es demasiado largo (máx. 200 caracteres).' }
  if (body.length > 10000) return { error: 'El cuerpo es demasiado largo (máx. 10.000 caracteres).' }

  // 4. Obtener destinatarios activos
  const { data: fans } = await admin
    .from('fans')
    .select('email, unsubscribe_token')
    .eq('creator_id', creator.id)
    .not('confirmed_at', 'is', null)
    .is('unsubscribed_at', null)

  if (!fans || fans.length === 0) {
    return { error: 'No hay fans confirmados y activos para enviar.' }
  }

  // 5. Enviar en lotes de máximo 100
  const resend = new Resend(process.env.RESEND_API_KEY)
  const fromEmail = process.env.RESEND_FROM_EMAIL!
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL!

  let totalSent = 0
  let totalFailed = 0
  const batchErrors: string[] = []

  for (let i = 0; i < fans.length; i += BATCH_SIZE) {
    const batch = fans.slice(i, i + BATCH_SIZE) as any[]
    const messages = batch.map((fan: any) => {
      const unsubscribeUrl = `${siteUrl}/api/unsubscribe?token=${fan.unsubscribe_token}`
      return {
        from: `${creator.display_name} <${fromEmail}>`,
        to: fan.email,
        subject,
        html: buildEmailHtml(subject, body, unsubscribeUrl, creator.display_name, fromEmail),
        headers: {
          'List-Unsubscribe': `<${unsubscribeUrl}>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
        },
      }
    })

    try {
      const result = await resend.batch.send(messages)
      // Resend devuelve { data: [{ id }] } por batch exitoso
      if (result.data) {
        totalSent += batch.length
      }
    } catch (batchErr: any) {
      // Error parcial: contar los fallidos de este lote
      totalFailed += batch.length
      batchErrors.push(`Lote ${Math.floor(i / BATCH_SIZE) + 1}: ${batchErr.message}`)
    }
  }

  // 6. Registrar en broadcast_logs
  if (totalSent > 0) {
    await admin
      .from('broadcast_logs')
      .insert({
        creator_id: creator.id,
        subject,
        body,
        recipients_count: totalSent,
        sent_at: new Date().toISOString(),
      } as any)
    revalidatePath('/dashboard')
  }

  if (batchErrors.length > 0) {
    return {
      success: true,
      sent: totalSent,
      failed: totalFailed,
      error: `Enviados: ${totalSent}. Errores en algunos lotes: ${batchErrors.join('; ')}`,
    }
  }

  return { success: true, sent: totalSent, failed: 0 }
}

export async function getActiveFansCount(creatorId: string): Promise<number> {
  const admin = createAdminClient()
  const { count } = await admin
    .from('fans')
    .select('*', { count: 'exact', head: true })
    .eq('creator_id', creatorId)
    .not('confirmed_at', 'is', null)
    .is('unsubscribed_at', null)

  return count ?? 0
}
