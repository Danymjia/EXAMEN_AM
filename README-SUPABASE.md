# Guía de Configuración de Supabase

## 📋 Instrucciones para configurar la base de datos

### Paso 1: Crear las Tablas
1. Ve a tu proyecto en Supabase Dashboard: https://supabase.com/dashboard
2. Navega a **SQL Editor** (Editor SQL)
3. Abre el archivo `supabase-schema.sql`
4. Copia todo el contenido del archivo
5. Pega el contenido en el SQL Editor de Supabase
6. Haz clic en **RUN** (Ejecutar) o presiona `Ctrl + Enter`

### Paso 2: Configurar Storage para Imágenes
1. En el mismo SQL Editor, abre el archivo `supabase-storage.sql`
2. Copia todo el contenido
3. Pégalo en el SQL Editor
4. Ejecuta el script

**Alternativa (si prefieres usar la UI):**
1. Ve a **Storage** en el menú lateral
2. Haz clic en **New bucket**
3. Nombre: `planes-imagenes`
4. Marca como **Public bucket**
5. Límite de archivo: `5242880` (5MB)
6. Tipos MIME permitidos: `image/jpeg, image/jpg, image/png`
7. Luego ejecuta solo las políticas del archivo `supabase-storage.sql`

### Paso 3: Crear un Usuario Asesor (Opcional)
Para crear un usuario con rol de asesor:

```sql
-- Primero regístrate normalmente en la app
-- Luego ejecuta esto en SQL Editor reemplazando USER_ID con el ID del usuario:

UPDATE public.perfiles 
SET rol = 'asesor_comercial' 
WHERE id = 'USER_ID_AQUI';

-- O crear directamente (requiere conocer el email del usuario):
-- UPDATE public.perfiles 
-- SET rol = 'asesor_comercial' 
-- WHERE id IN (
--     SELECT id FROM auth.users WHERE email = 'asesor@ejemplo.com'
-- );
```

### Paso 4: Verificar la Configuración

#### Verificar que las tablas se crearon:
```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

Deberías ver:
- `contrataciones`
- `mensajes_chat`
- `perfiles`
- `planes_moviles`

#### Verificar que RLS está activado:
```sql
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

Todas las tablas deben tener `rowsecurity = true`

#### Verificar políticas:
```sql
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE schemaname = 'public'
ORDER BY tablename, policyname;
```

### Paso 5: Verificar los Planes Iniciales
```sql
SELECT nombre_comercial, precio, activo 
FROM public.planes_moviles;
```

Deberías ver 3 planes:
- SMART 5GB ($15.99)
- PREMIUM 15GB ($29.99)
- ILIMITADO TOTAL ($45.99)

## 🔐 Roles y Permisos

### Usuario Invitado (No autenticado)
- ✅ Puede ver planes activos (solo lectura)
- ❌ No puede contratar
- ❌ No puede crear/editar planes

### Usuario Registrado
- ✅ Puede ver planes activos
- ✅ Puede contratar planes
- ✅ Puede ver sus propias contrataciones
- ✅ Puede enviar mensajes en sus contrataciones
- ❌ No puede crear/editar planes

### Asesor Comercial
- ✅ Acceso completo a planes (CRUD)
- ✅ Puede subir imágenes de planes
- ✅ Puede ver todas las contrataciones
- ✅ Puede aprobar/rechazar contrataciones
- ✅ Puede enviar mensajes en cualquier contratación

## 📁 Estructura de Tablas

### `perfiles`
- Almacena información adicional de usuarios
- Se crea automáticamente al registrarse
- Campos: `nombres_completos`, `telefono`, `rol`

### `planes_moviles`
- Catálogo de planes móviles
- Solo asesores pueden crear/editar/eliminar
- Todos pueden leer los activos

### `contrataciones`
- Registro de contrataciones de planes
- Usuarios pueden crear contrataciones
- Asesores pueden aprobar/rechazar

### `mensajes_chat`
- Mensajes entre usuarios y asesores
- Vinculados a contrataciones

## 🖼️ Storage

- **Bucket:** `planes-imagenes`
- **Público:** Sí (todos pueden ver)
- **Límite:** 5MB por archivo
- **Formatos:** JPG, JPEG, PNG
- **Políticas:** Solo asesores pueden subir/editar/eliminar

## 🚨 Solución de Problemas

### Error: "permission denied for table"
- Verifica que RLS está activado
- Verifica que las políticas están creadas
- Verifica que el usuario tiene el rol correcto

### Error: "bucket not found"
- Asegúrate de que el bucket `planes-imagenes` existe
- Verifica que ejecutaste el script de storage

### Los planes no se muestran
- Verifica que los planes tienen `activo = true`
- Verifica que RLS permite lectura pública
- Revisa la consola del navegador para errores

## 📝 Notas Importantes

1. **Seguridad:** RLS está habilitado en todas las tablas
2. **Automático:** Los perfiles se crean automáticamente al registrarse
3. **Triggers:** `updated_at` se actualiza automáticamente
4. **Datos iniciales:** Se insertan 3 planes de ejemplo al ejecutar el schema

