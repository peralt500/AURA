-- ==============================================================================
-- MIGRACIÓN INICIAL: Esquema multi-creador, RLS y almacenamiento
-- Archivo: supabase/migrations/20261005000000_init_schema.sql
-- ==============================================================================

-- Habilitar extensión pgcrypto para gen_random_uuid si no está habilitada
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. TABLA: creators
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.creators (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    username TEXT UNIQUE NOT NULL,
    display_name TEXT NOT NULL,
    bio TEXT,
    avatar_url TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. TABLA: events
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    event_date TIMESTAMPTZ NOT NULL,
    location TEXT,
    ticket_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 3. TABLA: fans
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.fans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    email TEXT NOT NULL,
    confirm_token UUID NOT NULL DEFAULT gen_random_uuid(),
    unsubscribe_token UUID NOT NULL DEFAULT gen_random_uuid(),
    confirmed_at TIMESTAMPTZ,
    unsubscribed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    CONSTRAINT uq_fans_creator_email UNIQUE (creator_id, email)
);

-- ==============================================================================
-- 4. TABLA: broadcast_logs
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.broadcast_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    subject TEXT NOT NULL,
    body TEXT NOT NULL,
    recipients_count INT NOT NULL DEFAULT 0,
    sent_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 5. TABLA: gallery_items
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.gallery_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    creator_id UUID NOT NULL REFERENCES public.creators(id) ON DELETE CASCADE,
    image_url TEXT NOT NULL,
    caption TEXT,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- ÍNDICES DE RENDIMIENTO
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_creators_username ON public.creators(username);
CREATE INDEX IF NOT EXISTS idx_creators_user_id ON public.creators(user_id);

CREATE INDEX IF NOT EXISTS idx_events_creator_id ON public.events(creator_id);
CREATE INDEX IF NOT EXISTS idx_events_event_date ON public.events(event_date);

CREATE INDEX IF NOT EXISTS idx_fans_creator_id ON public.fans(creator_id);
CREATE INDEX IF NOT EXISTS idx_fans_confirm_token ON public.fans(confirm_token);
CREATE INDEX IF NOT EXISTS idx_fans_unsubscribe_token ON public.fans(unsubscribe_token);

CREATE INDEX IF NOT EXISTS idx_broadcast_logs_creator_id ON public.broadcast_logs(creator_id);

CREATE INDEX IF NOT EXISTS idx_gallery_items_creator_id ON public.gallery_items(creator_id);
CREATE INDEX IF NOT EXISTS idx_gallery_items_sort_order ON public.gallery_items(creator_id, sort_order);

-- ==============================================================================
-- CONFIGURACIÓN DE SEGURIDAD ROW LEVEL SECURITY (RLS)
-- ==============================================================================

-- 1. Habilitar RLS en todas las tablas
ALTER TABLE public.creators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.broadcast_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gallery_items ENABLE ROW LEVEL SECURITY;

-- 2. Políticas para 'creators'
-- Lectura pública para anon y usuarios autenticados
CREATE POLICY "creators_select_public"
    ON public.creators
    FOR SELECT
    TO public
    USING (true);

-- Inserción de perfil de creador solo por el usuario autenticado propietario
CREATE POLICY "creators_insert_owner"
    ON public.creators
    FOR INSERT
    TO authenticated
    WITH CHECK (user_id = auth.uid());

-- Actualización solo por el creador dueño
CREATE POLICY "creators_update_owner"
    ON public.creators
    FOR UPDATE
    TO authenticated
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- Eliminación solo por el creador dueño
CREATE POLICY "creators_delete_owner"
    ON public.creators
    FOR DELETE
    TO authenticated
    USING (user_id = auth.uid());

-- 3. Políticas para 'events'
-- Lectura pública de eventos
CREATE POLICY "events_select_public"
    ON public.events
    FOR SELECT
    TO public
    USING (true);

-- Escritura (insert, update, delete) solo si el creador pertenece al usuario autenticado
CREATE POLICY "events_insert_owner"
    ON public.events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "events_update_owner"
    ON public.events
    FOR UPDATE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "events_delete_owner"
    ON public.events
    FOR DELETE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- 4. Políticas para 'gallery_items'
-- Lectura pública de ítems de galería
CREATE POLICY "gallery_items_select_public"
    ON public.gallery_items
    FOR SELECT
    TO public
    USING (true);

-- Escritura solo por el creador dueño
CREATE POLICY "gallery_items_insert_owner"
    ON public.gallery_items
    FOR INSERT
    TO authenticated
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "gallery_items_update_owner"
    ON public.gallery_items
    FOR UPDATE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "gallery_items_delete_owner"
    ON public.gallery_items
    FOR DELETE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- 5. Políticas para 'fans'
-- SIN política pública. El registro público se hace mediante Server Action con Service Role.
-- SELECT, UPDATE, DELETE solo para el creador autenticado dueño de los fans
CREATE POLICY "fans_select_owner"
    ON public.fans
    FOR SELECT
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "fans_update_owner"
    ON public.fans
    FOR UPDATE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    )
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "fans_delete_owner"
    ON public.fans
    FOR DELETE
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- 6. Políticas para 'broadcast_logs'
-- SELECT e INSERT solo del creador dueño
CREATE POLICY "broadcast_logs_select_owner"
    ON public.broadcast_logs
    FOR SELECT
    TO authenticated
    USING (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "broadcast_logs_insert_owner"
    ON public.broadcast_logs
    FOR INSERT
    TO authenticated
    WITH CHECK (
        creator_id IN (
            SELECT id FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- ==============================================================================
-- BUCKET DE STORAGE: gallery
-- ==============================================================================
-- Crear bucket público 'gallery' si no existe
INSERT INTO storage.buckets (id, name, public)
VALUES ('gallery', 'gallery', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Políticas de Storage para el bucket 'gallery':
-- Lectura pública para cualquier visitante
CREATE POLICY "gallery_bucket_select_public"
    ON storage.objects
    FOR SELECT
    TO public
    USING (bucket_id = 'gallery');

-- Inserción / subida solo para usuarios autenticados que sean creadores
CREATE POLICY "gallery_bucket_insert_authenticated"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'gallery' AND
        EXISTS (
            SELECT 1 FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- Actualización solo para creadores autenticados
CREATE POLICY "gallery_bucket_update_authenticated"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'gallery' AND
        EXISTS (
            SELECT 1 FROM public.creators WHERE user_id = auth.uid()
        )
    );

-- Eliminación solo para creadores autenticados
CREATE POLICY "gallery_bucket_delete_authenticated"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'gallery' AND
        EXISTS (
            SELECT 1 FROM public.creators WHERE user_id = auth.uid()
        )
    );
