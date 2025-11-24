# Examen MA - Aplicación de Gestión de Planes

## Descripción

Aplicación móvil desarrollada con Ionic/Angular para la gestión de planes telefonicos, con funcionalidades de chat y perfiles de usuario.

## Características Principales

- Autenticación de usuarios (login/registro)
- Perfiles de usuario con diferentes roles (usuario normal y asesor comercial)
- Sistema de chat integrado
- Gestión de planes de telefonicos
- Visualización de planes para invitados

## Tecnologías Utilizadas

- **Frontend**:

  - Angular 20
  - Ionic 8
  - TypeScript
  - Capacitor para empaquetado móvil

- **Backend**:
  - Supabase (según archivos de esquema encontrados)

## Estructura del Proyecto

```
src/
├── app/
│   ├── advisor/         # Módulo de asesor comercial
│   ├── chat/            # Componentes de chat
│   ├── guards/          # Guards de autenticación
│   ├── home/            # Página principal
│   ├── login/           # Página de inicio de sesión
│   ├── mis-planes/      # Gestión de planes del usuario
│   ├── perfil/          # Perfil de usuario
│   ├── register/        # Registro de usuarios
│   ├── services/        # Servicios de la aplicación
│   ├── tabs/            # Navegación por pestañas
│   └── welcome/         # Página de bienvenida
├── assets/              # Recursos estáticos
└── environments/        # Configuraciones de entorno
```

## Configuración del Entorno

El proyecto incluye configuraciones para diferentes entornos (development, production) con soporte para variables de entorno.

## Instalación

1. Clonar el repositorio
2. Instalar dependencias: `npm install`
3. Iniciar servidor de desarrollo: `npm start`

## Scripts Disponibles

- `npm start`: Inicia el servidor de desarrollo
- `npm run build`: Compila la aplicación para producción
- `npm test`: Ejecuta las pruebas unitarias
- `npm run lint`: Ejecuta el linter

## Notas Adicionales

- La aplicación está configurada para ser empaquetada como aplicación móvil usando Capacitor
- Incluye configuración para Android
- Utiliza ESLint para el análisis estático de código
