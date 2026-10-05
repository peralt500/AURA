import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const token = searchParams.get('token')

  if (!token) {
    return new NextResponse('Falta el token de confirmación.', { status: 400 })
  }

  const supabase = createAdminClient()

  const { data: fan, error } = await supabase
    .from('fans')
    .select('id, confirmed_at, creators(username)')
    .eq('confirm_token', token)
    .single()

  if (error || !fan) {
    return new NextResponse('Enlace de confirmación inválido o caducado.', { status: 400 })
  }

  if (fan.confirmed_at) {
    // Ya estaba confirmado
    const username = (fan.creators as any).username
    return NextResponse.redirect(new URL(`/${username}?confirmed=true`, request.url))
  }

  // Actualizar a confirmado
  const { error: updateError } = await supabase
    .from('fans')
    .update({ confirmed_at: new Date().toISOString() })
    .eq('id', fan.id)

  if (updateError) {
    return new NextResponse('Error al confirmar suscripción. Intenta de nuevo.', { status: 500 })
  }

  const username = (fan.creators as any).username
  
  // HTML simple de éxito o redirección. Usaremos HTML.
  return new NextResponse(`
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Suscripción Confirmada</title>
      <style>
        body { font-family: system-ui, sans-serif; background: #0a0a0a; color: white; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; text-align: center; }
        .card { background: #171717; padding: 2rem; border-radius: 1rem; max-width: 400px; border: 1px solid #262626; }
        a { color: #a855f7; text-decoration: none; font-weight: bold; margin-top: 1rem; display: inline-block; }
      </style>
    </head>
    <body>
      <div class="card">
        <h2>¡Suscripción confirmada! 🎉</h2>
        <p>A partir de ahora recibirás las novedades directamente en tu correo.</p>
        <a href="/${username}">Volver al perfil</a>
      </div>
    </body>
    </html>
  `, { headers: { 'Content-Type': 'text/html' } })
}
