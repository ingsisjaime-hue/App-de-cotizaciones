# App de Cotizaciones — SOLUINGENIUS

Aplicación web para generar cotizaciones con modalidad **IVA** o **AIU**, con inicio de sesión, base de datos compartida (Supabase) y roles y permisos personalizables por módulo.

## Funcionalidades

- **Autenticación**: inicio de sesión con correo y contraseña (Supabase Auth). Sin registro público — los usuarios los crea un administrador.
- **Roles y permisos granulares**: cada rol define, por módulo (Clientes, Cotizaciones, Empresa, Usuarios), qué puede ver, crear, editar o eliminar. Los permisos se aplican tanto en la interfaz como en la base de datos (Row Level Security), y son editables desde la app (panel "Usuarios y roles", visible para quien tenga permiso de ver usuarios).
- **Administración de usuarios**: un administrador puede crear usuarios nuevos, cambiarles el rol y activarlos/desactivarlos, todo desde la app.
- Consecutivo automático de cotización (formato año-número, ej. 2026-0223), asignado atómicamente en la base de datos solo al guardar. La secuencia numérica es continua y global (no reinicia al cambiar de año); solo el año que se muestra en el número cambia según la fecha.
- Datos de la empresa y logo, compartidos entre todos los usuarios.
- Directorio de clientes compartido: crear, buscar, editar y eliminar, con selección rápida para la cotización.
- Modalidad **Con IVA** o **Con AIU** (IVA calculado sobre la utilidad).
- Tabla de ítems con unidades de medida predefinidas y cálculo automático de totales.
- Condiciones de pago (forma y plazo), observaciones y cierre con firma del gerente.
- Búsqueda de cotizaciones guardadas por nombre/NIT del cliente y rango de fechas.
- Impresión / exportación a PDF desde el navegador.

## Arquitectura

- **Frontend**: `index.html`, una sola página (HTML/CSS/JS, sin build ni dependencias), que habla directamente con Supabase (Auth + base de datos Postgres vía REST) usando la clave pública (`anon`/`publishable`). El acceso a los datos está controlado por Row Level Security en Postgres según el rol del usuario, no solo por la interfaz.
- **Backend**: una única función serverless en `api/create-user.js` (Vercel), usada exclusivamente para crear cuentas de usuario nuevas — esa es la única operación que requiere la clave secreta (`service_role`) de Supabase, la cual **nunca** se expone al navegador ni se guarda en este repositorio.
- **Base de datos**: Supabase (Postgres). Tablas: `roles`, `profiles`, `company_settings`, `clients`, `quotes`, `quote_counters`, más funciones `has_perm`, `current_permissions` y `next_quote_number` usadas por las políticas de seguridad y el consecutivo.

## Despliegue en Vercel

1. Importar este repositorio en Vercel.
2. Framework preset: **Other**.
3. En **Environment Variables**, agregar (solo estas — son necesarias únicamente para la función `api/create-user.js`):
   - `SUPABASE_URL` = URL del proyecto de Supabase (`https://xxxxxxxx.supabase.co`)
   - `SUPABASE_SERVICE_ROLE_KEY` = clave secreta del proyecto (Project Settings → API) — **nunca la subas al repositorio**
   - `SUPABASE_ANON_KEY` = clave pública/`anon` del proyecto
4. Deploy. No requiere comando de build ni carpeta de salida especiales.

## Notas de seguridad

- La clave pública de Supabase queda embebida en `index.html` a propósito — está diseñada para usarse en el navegador. La seguridad real la da Row Level Security en la base de datos, no el secreto de esa clave.
- La clave secreta (`service_role`) solo vive como variable de entorno del servidor en Vercel, y solo la usa `api/create-user.js` para crear cuentas nuevas tras verificar que quien lo pide tiene permiso de administrar usuarios.
