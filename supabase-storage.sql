-- ============================================
-- CONFIGURACIÓN DE STORAGE PARA IMÁGENES
-- ============================================

-- 1. CREAR BUCKET PARA IMÁGENES DE PLANES
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'planes-imagenes',
    'planes-imagenes',
    true, -- Público para que todos puedan ver las imágenes
    5242880, -- 5MB límite
    ARRAY['image/jpeg', 'image/jpg', 'image/png']
)
ON CONFLICT (id) DO NOTHING;

-- 2. POLÍTICAS DE STORAGE PARA EL BUCKET planes-imagenes
-- ============================================
-- Eliminar políticas existentes si ya existen
DROP POLICY IF EXISTS "Todos pueden ver imágenes de planes" ON storage.objects;
DROP POLICY IF EXISTS "Solo asesores pueden subir imágenes de planes" ON storage.objects;
DROP POLICY IF EXISTS "Solo asesores pueden actualizar imágenes de planes" ON storage.objects;
DROP POLICY IF EXISTS "Solo asesores pueden eliminar imágenes de planes" ON storage.objects;

-- Todos pueden ver las imágenes (lectura pública)
CREATE POLICY "Todos pueden ver imágenes de planes"
ON storage.objects
FOR SELECT
USING (bucket_id = 'planes-imagenes');

-- Solo asesores pueden subir imágenes
CREATE POLICY "Solo asesores pueden subir imágenes de planes"
ON storage.objects
FOR INSERT
WITH CHECK (
    bucket_id = 'planes-imagenes' AND
    public.is_asesor()
);

-- Solo asesores pueden actualizar imágenes
CREATE POLICY "Solo asesores pueden actualizar imágenes de planes"
ON storage.objects
FOR UPDATE
USING (
    bucket_id = 'planes-imagenes' AND
    public.is_asesor()
);

-- Solo asesores pueden eliminar imágenes
CREATE POLICY "Solo asesores pueden eliminar imágenes de planes"
ON storage.objects
FOR DELETE
USING (
    bucket_id = 'planes-imagenes' AND
    public.is_asesor()
);

-- ============================================
-- FIN DE CONFIGURACIÓN DE STORAGE
-- ============================================

