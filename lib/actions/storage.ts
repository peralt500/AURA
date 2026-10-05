'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'

export async function uploadImage(formData: FormData) {
  try {
    const supabase = createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'No autenticado' }

    const file = formData.get('file') as File
    const folder = formData.get('folder')?.toString() || 'misc'

    if (!file) {
      return { error: 'No se ha seleccionado ninguna imagen.' }
    }

    if (!file.type.startsWith('image/')) {
      return { error: 'El archivo debe ser una imagen.' }
    }

    if (file.size > 5 * 1024 * 1024) {
      return { error: 'La imagen no puede pesar más de 5MB.' }
    }

    const admin = createAdminClient()
    
    // Generar un nombre único para el archivo
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}/${folder}/${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    const { data, error } = await admin.storage
      .from('media')
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      })

    if (error) {
      return { error: error.message }
    }

    // Obtener la URL pública
    const { data: { publicUrl } } = admin.storage.from('media').getPublicUrl(data.path)

    return { success: true, url: publicUrl }
  } catch (e: any) {
    return { error: e.message }
  }
}
