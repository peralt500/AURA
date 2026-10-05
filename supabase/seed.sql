-- ==============================================================================
-- SCRIPT DE SEED / DATOS INICIALES PARA EL CREADOR / ARTISTA
-- Archivo: supabase/seed.sql
-- ==============================================================================
--
-- INSTRUCCIONES DE USO:
-- 1. Inicia sesión en tu aplicación web a través de /login con tu correo para
--    crear tu usuario en Supabase Auth (`auth.users`).
-- 2. Ve al SQL Editor de tu panel de Supabase o ejecuta este script localmente.
-- 3. Si ya conoces tu correo electrónico de artista, el siguiente script
--    buscará automáticamente tu `user_id` en `auth.users` y creará o actualizará
--    tu perfil de creador en la tabla `creators`.
--
-- Alternativamente, puedes reemplazar 'artista@ejemplo.com' con tu email real.
-- ==============================================================================

DO $$
DECLARE
    v_artist_email TEXT := 'bigthemo500@gmail.com'; -- Reemplazar con el correo con el que iniciaste sesión
    v_user_id UUID;
    v_creator_id UUID;
BEGIN
    -- 1. Obtener el UUID del usuario desde auth.users (si ya inició sesión)
    SELECT id INTO v_user_id
    FROM auth.users
    WHERE email = v_artist_email
    LIMIT 1;

    -- Si aún no existe el usuario en auth.users, v_user_id quedará como NULL temporalmente
    -- y se podrá vincular posteriormente mediante:
    -- UPDATE public.creators SET user_id = '<tu-auth-uuid>' WHERE username = 'lunavalente';

    -- 2. Insertar o actualizar el perfil principal del artista
    INSERT INTO public.creators (
        id,
        user_id,
        username,
        display_name,
        bio,
        avatar_url,
        social_links
    )
    VALUES (
        'a0000000-0000-0000-0000-000000000001'::uuid,
        v_user_id,
        'lunavalente',
        'Luna Valente',
        'Cantautora & productora indie pop. Creando melodías que conectan almas. Nueva gira "Ecos de Luz" 2026.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
        '{
            "instagram": "https://instagram.com/lunavalente",
            "tiktok": "https://tiktok.com/@lunavalente",
            "youtube": "https://youtube.com/@lunavalente",
            "facebook": "https://facebook.com/lunavalenteoficial",
            "shop": "https://tienda.lunavalente.com"
        }'::jsonb
    )
    ON CONFLICT (username) DO UPDATE
    SET
        user_id = COALESCE(EXCLUDED.user_id, public.creators.user_id),
        display_name = EXCLUDED.display_name,
        bio = EXCLUDED.bio,
        avatar_url = EXCLUDED.avatar_url,
        social_links = EXCLUDED.social_links
    RETURNING id INTO v_creator_id;

    -- Si v_creator_id no fue devuelto por ON CONFLICT DO UPDATE
    IF v_creator_id IS NULL THEN
        SELECT id INTO v_creator_id FROM public.creators WHERE username = 'lunavalente';
    END IF;

    -- 3. Insertar eventos de ejemplo para la agenda
    INSERT INTO public.events (creator_id, title, event_date, location, ticket_url)
    VALUES
        (
            v_creator_id,
            'Gira Ecos de Luz - Noche de Estreno',
            now() + interval '12 days',
            'Teatro Metropolitan, Ciudad de México',
            'https://boletos.ejemplo.com/ecos-cdmx'
        ),
        (
            v_creator_id,
            'Festival Acústico Bajo las Estrellas',
            now() + interval '25 days',
            'Parque Fundidora, Monterrey',
            'https://boletos.ejemplo.com/festival-mty'
        ),
        (
            v_creator_id,
            'Concierto Íntimo & Meet and Greet',
            now() + interval '40 days',
            'Teatro Diana, Guadalajara',
            'https://boletos.ejemplo.com/intimo-gdl'
        )
    ON CONFLICT DO NOTHING;

    -- 4. Insertar fotografías iniciales de la galería
    INSERT INTO public.gallery_items (creator_id, image_url, caption, sort_order)
    VALUES
        (
            v_creator_id,
            'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?auto=format&fit=crop&w=800&q=80',
            'En vivo en el Festival Primavera',
            1
        ),
        (
            v_creator_id,
            'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?auto=format&fit=crop&w=800&q=80',
            'Grabación acústica del nuevo álbum',
            2
        ),
        (
            v_creator_id,
            'https://images.unsplash.com/photo-1465847899084-d164df4dedc6?auto=format&fit=crop&w=800&q=80',
            'Backstage con el equipo en Madrid',
            3
        ),
        (
            v_creator_id,
            'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=800&q=80',
            'Sesión de composición nocturna',
            4
        )
    ON CONFLICT DO NOTHING;

    -- 5. Insertar fans de ejemplo para pruebas de filtrado y difusión
    INSERT INTO public.fans (creator_id, email, confirmed_at, unsubscribed_at)
    VALUES
        (
            v_creator_id,
            'fan.activo1@ejemplo.com',
            now() - interval '5 days',
            NULL
        ),
        (
            v_creator_id,
            'fan.activo2@ejemplo.com',
            now() - interval '2 days',
            NULL
        ),
        (
            v_creator_id,
            'fan.pendiente@ejemplo.com',
            NULL, -- Pendiente de doble confirmación
            NULL
        ),
        (
            v_creator_id,
            'fan.baja@ejemplo.com',
            now() - interval '10 days',
            now() - interval '1 day' -- Se dio de baja
        )
    ON CONFLICT (creator_id, email) DO NOTHING;

    RAISE NOTICE 'Seed ejecutado exitosamente para el creador con ID % (user_id: %)', v_creator_id, v_user_id;
END $$;
