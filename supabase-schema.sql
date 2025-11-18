-- ============================================
-- SCHEMA COMPLETO PARA PLANES MÓVILES TIGO
-- ============================================

-- 1. TABLA DE PERFILES DE USUARIO
-- ============================================
CREATE TABLE IF NOT EXISTS public.perfiles (
    id UUID REFERENCES auth.users (id) ON DELETE CASCADE PRIMARY KEY,
    nombres_completos TEXT,
    telefono TEXT,
    rol TEXT NOT NULL DEFAULT 'usuario_registrado' CHECK (
        rol IN (
            'usuario_registrado',
            'asesor_comercial'
        )
    ),
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Comentarios en la tabla
COMMENT ON
TABLE public.perfiles IS 'Perfiles de usuarios con información adicional';

COMMENT ON COLUMN public.perfiles.rol IS 'Rol del usuario: usuario_registrado o asesor_comercial';

-- 2. TABLA DE PLANES MÓVILES
-- ============================================
CREATE TABLE IF NOT EXISTS public.planes_moviles (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    nombre_comercial TEXT NOT NULL,
    precio DECIMAL(10, 2) NOT NULL,
    segmento TEXT,
    publico_objetivo TEXT,
    datos_moviles TEXT NOT NULL,
    minutos_voz TEXT NOT NULL,
    sms TEXT,
    velocidad_4g TEXT,
    velocidad_5g TEXT,
    redes_sociales TEXT,
    whatsapp TEXT,
    llamadas_internacionales TEXT,
    roaming TEXT,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    imagen_url TEXT,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        created_by UUID REFERENCES auth.users (id)
);

-- Índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_planes_activo ON public.planes_moviles (activo);

CREATE INDEX IF NOT EXISTS idx_planes_precio ON public.planes_moviles (precio);

CREATE INDEX IF NOT EXISTS idx_planes_created_by ON public.planes_moviles (created_by);

-- Comentarios
COMMENT ON
TABLE public.planes_moviles IS 'Catálogo de planes móviles de Tigo Ecuador';

-- 3. TABLA DE CONTRATACIONES
-- ============================================
CREATE TABLE IF NOT EXISTS public.contrataciones (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    usuario_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES public.planes_moviles (id) ON DELETE RESTRICT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente' CHECK (
        estado IN (
            'pendiente',
            'aprobada',
            'rechazada',
            'cancelada'
        )
    ),
    fecha_contratacion TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        fecha_aprobacion TIMESTAMP
    WITH
        TIME ZONE,
        aprobado_por UUID REFERENCES auth.users (id),
        observaciones TEXT,
        created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_contrataciones_usuario ON public.contrataciones (usuario_id);

CREATE INDEX IF NOT EXISTS idx_contrataciones_plan ON public.contrataciones (plan_id);

CREATE INDEX IF NOT EXISTS idx_contrataciones_estado ON public.contrataciones (estado);

-- Comentarios
COMMENT ON
TABLE public.contrataciones IS 'Registro de contrataciones de planes por usuarios';

-- 4. TABLA DE MENSAJES DE CHAT
-- ============================================
CREATE TABLE IF NOT EXISTS public.mensajes_chat (
    id UUID DEFAULT gen_random_uuid () PRIMARY KEY,
    contratacion_id UUID REFERENCES public.contrataciones (id) ON DELETE CASCADE NOT NULL,
    usuario_id UUID REFERENCES auth.users (id) ON DELETE CASCADE NOT NULL,
    asesor_id UUID REFERENCES auth.users (id),
    mensaje TEXT NOT NULL,
    leido BOOLEAN DEFAULT false,
    created_at TIMESTAMP
    WITH
        TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_mensajes_contratacion ON public.mensajes_chat (contratacion_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_usuario ON public.mensajes_chat (usuario_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_created_at ON public.mensajes_chat (created_at DESC);

-- Comentarios
COMMENT ON
TABLE public.mensajes_chat IS 'Mensajes de chat entre usuarios y asesores';

-- 5. FUNCIÓN PARA ACTUALIZAR updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Eliminar triggers si ya existen antes de crearlos
DROP TRIGGER IF EXISTS update_perfiles_updated_at ON public.perfiles;

DROP TRIGGER IF EXISTS update_planes_updated_at ON public.planes_moviles;

DROP TRIGGER IF EXISTS update_contrataciones_updated_at ON public.contrataciones;

-- Triggers para actualizar updated_at automáticamente
CREATE TRIGGER update_perfiles_updated_at
    BEFORE UPDATE ON public.perfiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_planes_updated_at
    BEFORE UPDATE ON public.planes_moviles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER update_contrataciones_updated_at
    BEFORE UPDATE ON public.contrataciones
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 6. FUNCIÓN PARA CREAR PERFIL AUTOMÁTICAMENTE
-- ============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.perfiles (id, rol)
    VALUES (NEW.id, 'usuario_registrado')
    ON CONFLICT (id) DO NOTHING;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Función helper para verificar si un usuario es asesor (evita recursión en RLS)
CREATE OR REPLACE FUNCTION public.is_asesor()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.perfiles
        WHERE id = auth.uid() AND rol = 'asesor_comercial'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Eliminar el trigger si ya existe antes de crearlo
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Trigger para crear perfil cuando se crea un usuario
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 7. ENABLE ROW LEVEL SECURITY (RLS)
-- ============================================
ALTER TABLE public.perfiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.planes_moviles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.contrataciones ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.mensajes_chat ENABLE ROW LEVEL SECURITY;

-- 8. POLÍTICAS RLS PARA PERFILES
-- ============================================
-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Usuarios pueden ver su propio perfil" ON public.perfiles;

DROP POLICY IF EXISTS "Usuarios pueden actualizar su propio perfil" ON public.perfiles;

DROP POLICY IF EXISTS "Asesores pueden ver todos los perfiles" ON public.perfiles;

DROP POLICY IF EXISTS "Permitir inserción automática de perfil" ON public.perfiles;

-- Permitir inserción automática de perfil al registrarse (para el trigger)
-- Esta política permite que el trigger cree el perfil automáticamente
CREATE POLICY "Permitir inserción automática de perfil" ON public.perfiles FOR
INSERT
WITH
    CHECK (auth.uid () = id);

-- Los usuarios pueden ver su propio perfil
CREATE POLICY "Usuarios pueden ver su propio perfil" ON public.perfiles FOR
SELECT USING (auth.uid () = id);

-- Los usuarios pueden actualizar su propio perfil
CREATE POLICY "Usuarios pueden actualizar su propio perfil" ON public.perfiles FOR
UPDATE USING (auth.uid () = id);

-- Asesores pueden ver todos los perfiles
-- Usamos la función helper para evitar recursión infinita
CREATE POLICY "Asesores pueden ver todos los perfiles" ON public.perfiles FOR
SELECT USING (public.is_asesor ());

-- 9. POLÍTICAS RLS PARA PLANES MÓVILES
-- ============================================
-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Todos pueden ver planes activos" ON public.planes_moviles;

DROP POLICY IF EXISTS "Solo asesores pueden crear planes" ON public.planes_moviles;

DROP POLICY IF EXISTS "Solo asesores pueden actualizar planes" ON public.planes_moviles;

DROP POLICY IF EXISTS "Solo asesores pueden eliminar planes" ON public.planes_moviles;

-- Todos pueden ver planes activos (lectura pública)
CREATE POLICY "Todos pueden ver planes activos" ON public.planes_moviles FOR
SELECT USING (activo = true);

-- Solo asesores pueden insertar planes
CREATE POLICY "Solo asesores pueden crear planes" ON public.planes_moviles FOR
INSERT
WITH
    CHECK (public.is_asesor ());

-- Solo asesores pueden actualizar planes
CREATE POLICY "Solo asesores pueden actualizar planes" ON public.planes_moviles FOR
UPDATE USING (public.is_asesor ());

-- Solo asesores pueden eliminar planes
CREATE POLICY "Solo asesores pueden eliminar planes" ON public.planes_moviles FOR DELETE USING (public.is_asesor ());

-- 10. POLÍTICAS RLS PARA CONTRATACIONES
-- ============================================
-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus contrataciones" ON public.contrataciones;

DROP POLICY IF EXISTS "Usuarios registrados pueden contratar planes" ON public.contrataciones;

DROP POLICY IF EXISTS "Asesores pueden ver todas las contrataciones" ON public.contrataciones;

DROP POLICY IF EXISTS "Asesores pueden actualizar contrataciones" ON public.contrataciones;

-- Usuarios pueden ver sus propias contrataciones
CREATE POLICY "Usuarios pueden ver sus contrataciones" ON public.contrataciones FOR
SELECT USING (usuario_id = auth.uid ());

-- Usuarios registrados pueden crear contrataciones
CREATE POLICY "Usuarios registrados pueden contratar planes" ON public.contrataciones FOR
INSERT
WITH
    CHECK (usuario_id = auth.uid ());

-- Asesores pueden ver todas las contrataciones
CREATE POLICY "Asesores pueden ver todas las contrataciones" ON public.contrataciones FOR
SELECT USING (public.is_asesor ());

-- Asesores pueden actualizar contrataciones (aprobar/rechazar)
CREATE POLICY "Asesores pueden actualizar contrataciones" ON public.contrataciones FOR
UPDATE USING (public.is_asesor ());

-- 11. POLÍTICAS RLS PARA MENSAJES DE CHAT
-- ============================================
-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Usuarios pueden ver mensajes de sus contrataciones" ON public.mensajes_chat;

DROP POLICY IF EXISTS "Usuarios pueden enviar mensajes en sus contrataciones" ON public.mensajes_chat;

DROP POLICY IF EXISTS "Asesores pueden enviar mensajes" ON public.mensajes_chat;

DROP POLICY IF EXISTS "Usuarios pueden actualizar mensajes" ON public.mensajes_chat;

-- Usuarios pueden ver mensajes de sus contrataciones
CREATE POLICY "Usuarios pueden ver mensajes de sus contrataciones" ON public.mensajes_chat FOR
SELECT USING (
        EXISTS (
            SELECT 1
            FROM public.contrataciones
            WHERE
                id = contratacion_id
                AND usuario_id = auth.uid ()
        )
        OR public.is_asesor ()
    );

-- Usuarios pueden crear mensajes en sus contrataciones
CREATE POLICY "Usuarios pueden enviar mensajes en sus contrataciones" ON public.mensajes_chat FOR
INSERT
WITH
    CHECK (
        usuario_id = auth.uid ()
        AND EXISTS (
            SELECT 1
            FROM public.contrataciones
            WHERE
                id = contratacion_id
                AND usuario_id = auth.uid ()
        )
    );

-- Asesores pueden crear mensajes en cualquier contratación
CREATE POLICY "Asesores pueden enviar mensajes" ON public.mensajes_chat FOR
INSERT
WITH
    CHECK (public.is_asesor ());

-- Usuarios y asesores pueden marcar mensajes como leídos
CREATE POLICY "Usuarios pueden actualizar mensajes" ON public.mensajes_chat FOR
UPDATE USING (
    usuario_id = auth.uid ()
    OR public.is_asesor ()
);

-- 12. DATOS INICIALES - PLANES MÓVILES
-- ============================================
-- Nota: Estos planes se insertan como ejemplo. Un asesor puede editarlos después.

INSERT INTO
    public.planes_moviles (
        nombre_comercial,
        precio,
        segmento,
        publico_objetivo,
        datos_moviles,
        minutos_voz,
        sms,
        velocidad_4g,
        velocidad_5g,
        redes_sociales,
        whatsapp,
        llamadas_internacionales,
        roaming,
        descripcion,
        activo
    )
VALUES (
        'SMART 5GB',
        15.99,
        'Básico / Entrada',
        'Usuarios casuales, estudiantes, adultos mayores',
        '5 GB mensuales (4G LTE)',
        '100 minutos nacionales',
        'Ilimitados a nivel nacional',
        'Hasta 50 Mbps',
        NULL,
        'Consumo normal (descontable)',
        'Incluido en los 5GB',
        '$0.15/min',
        'No incluido',
        'Plan ideal para usuarios ocasionales que buscan conectividad básica a un precio accesible.',
        true
    ),
    (
        'PREMIUM 15GB',
        29.99,
        'Medio / Estándar',
        'Profesionales, usuarios activos de redes sociales',
        '15 GB mensuales (4G LTE)',
        '300 minutos nacionales',
        'Ilimitados a nivel nacional',
        'Hasta 100 Mbps',
        NULL,
        'Facebook, Instagram, TikTok GRATIS (ilimitado)',
        'Ilimitado (no consume datos)',
        '$0.10/min',
        '500 MB incluidos (Sudamérica)',
        'Plan perfecto para quienes necesitan más datos y usan activamente las redes sociales.',
        true
    ),
    (
        'ILIMITADO TOTAL',
        45.99,
        'Premium / Alto',
        'Power users, gamers, streamers, empresarios',
        'ILIMITADOS (4G LTE con velocidad completa)',
        'ILIMITADOS nacionales',
        'Ilimitados a nivel nacional',
        'Hasta 150 Mbps (sin throttling)',
        'Hasta 300 Mbps (zonas disponibles)',
        'Todas ilimitadas',
        'Ilimitado',
        '100 minutos incluidos',
        '5 GB incluidos (todo América)',
        'El plan definitivo para quienes necesitan conectividad sin límites ni restricciones.',
        true
    ) ON CONFLICT DO NOTHING;

-- ============================================
-- FIN DEL SCHEMA
-- ============================================