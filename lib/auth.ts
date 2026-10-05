import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/server'
import { Creator } from '@/types/database'

// Helper para obtener el creador autenticado (se usará en el layout)
export async function getAuthenticatedCreator(): Promise<Creator | null> {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const adminClient = createAdminClient()
  const { data } = await adminClient
    .from('creators')
    .select('*')
    .eq('user_id', user.id)
    .single()

  return data as unknown as Creator | null
}
