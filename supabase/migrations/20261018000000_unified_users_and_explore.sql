-- ==============================================================================
-- MIGRACIÓN: Modelo Unificado (Fan + Artista), Confirmación Inmediata, Feed y Seguidores
-- Archivo: supabase/migrations/20261018000000_unified_users_and_explore.sql
-- ==============================================================================

-- 1. Modificar el valor por defecto de fans.confirmed_at para que las nuevas suscripciones
-- sean inmediatas sin requerir double opt-in.
ALTER TABLE public.fans ALTER COLUMN confirmed_at SET DEFAULT timezone('utc'::text, now());

-- 2. Confirmar retroactivamente a los fans que se encontraban en estado 'pendiente'
UPDATE public.fans
SET confirmed_at = now()
WHERE confirmed_at IS NULL AND unsubscribed_at IS NULL;

-- 3. Tabla de Seguidores (Botón Seguir)
CREATE TABLE IF NOT EXISTS public.follows (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    follower_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    client_identifier TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_creator_follower UNIQUE NULLS NOT DISTINCT (creator_id, follower_id, client_identifier)
);

CREATE INDEX IF NOT EXISTS idx_follows_creator_id ON public.follows(creator_id);
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'follows_select_public') THEN
        CREATE POLICY "follows_select_public" ON public.follows FOR SELECT TO public USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'follows_insert_public') THEN
        CREATE POLICY "follows_insert_public" ON public.follows FOR INSERT TO public WITH CHECK (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'follows' AND policyname = 'follows_delete_public') THEN
        CREATE POLICY "follows_delete_public" ON public.follows FOR DELETE TO public USING (true);
    END IF;
END $$;

-- 4. Asegurar que las consultas públicas de lectura para explorar creadores,
-- eventos y publicaciones de galería estén permitidas para todos.
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'gallery_items' AND policyname = 'gallery_select_public'
    ) THEN
        CREATE POLICY "gallery_select_public" ON public.gallery_items FOR SELECT TO public USING (true);
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'events' AND policyname = 'events_select_public'
    ) THEN
        CREATE POLICY "events_select_public" ON public.events FOR SELECT TO public USING (true);
    END IF;
END $$;
