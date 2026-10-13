# PetCare Domicilio

Plataforma interactiva para la gestión y prestación de servicios de bienestar para mascotas a domicilio.
Simula la experiencia completa de los tres actores: **Propietario**, **Veterinario / Profesional** y **Administrador**.

## Cómo ejecutarla

No requiere instalación ni compilación. Abre **`index.html`** con doble clic (Chrome, Edge o Firefox).

> Necesita conexión a internet la primera vez para cargar React, Tailwind CSS y la fuente Inter desde CDN.

Si prefieres servirla localmente:

```bash
python -m http.server 5173
```

y entra a `http://localhost:5173`.

## Cuentas de demostración

| Rol | Correo | Contraseña |
|---|---|---|
| Propietaria | `laura@demo.co` | `demo1234` |
| Veterinaria | `camila@petcare.co` | `demo1234` |
| Administradora | `admin@petcare.co` | `demo1234` |

También puedes **cambiar de rol al instante** con el selector del encabezado, sin recargar la página.
El menú de cuenta permite *Restablecer datos demo* y *Cerrar sesión* (pantalla de login / registro).

## Recorrido sugerido

1. **Propietario → Agendar**: elige servicio, mascota, día y franja. La cita se asigna automáticamente al mejor profesional.
2. **Cambia a Veterinario**: la cita aparece en su agenda. Pulsa *Salir en camino* → *Iniciar atención* → *Registrar tratamiento*.
3. **Vuelve a Propietario**: el estado avanzó en tiempo real y el historial clínico tiene el nuevo registro.
4. **Administrador → Rutas**: elige a la Dra. Camila (mañana), pulsa *Optimizar ruta*, arrastra paradas y guarda.

## Requerimientos cubiertos

| Requerimiento | Dónde |
|---|---|
| Login / registro y perfil con dirección predeterminada | Pantalla de acceso · *Mi perfil* |
| RF-02 Registro de mascotas | *Mis mascotas* (especie, raza, edad, peso, historial, cuidados especiales) |
| RF-03 Catálogo de planes y servicios | *Planes y servicios* (6 categorías, tarifas y condiciones) |
| RF-04 Agendamiento | *Agendar cita* (asistente de 4 pasos con disponibilidad real) |
| Historial clínico y estado en vivo | *Mis citas* y expediente de cada mascota |
| RF-01 / RF-06 Agenda y disponibilidad | Veterinario → *Mi agenda* y *Disponibilidad* |
| RF-05 Registro de tratamientos | Formulario clínico (signos vitales, diagnóstico, procedimientos, medicamentos) |
| Panel de métricas | Administrador → *Panel* |
| RF-06 Personal y asignación | Administrador → *Personal* y *Asignación* (tablero con arrastrar y soltar) |
| RF-07 Logística de rutas | Administrador → *Rutas* (mapa, arrastrar, optimizador con franjas horarias) |

## Arquitectura

```
index.html              Entrada y carga ordenada de scripts
vercel.json             Cabeceras de seguridad para Vercel
assets/styles.css       Tokens, cristal, animaciones, sliders, mapa
src/core/               utils · iconos SVG · lógica de negocio · store + acciones + router
src/data/               catálogo maestro · datos semilla relativos a la fecha actual
src/ui/                 primitivas (estilo shadcn), overlays, gráficos, componentes compartidos
src/modules/            auth · owner-* · vet · admin-*
src/app.js              Shell: encabezado, selector de rol, navegación, rutas
```

- **Estado**: store único con persistencia en `localStorage` y sincronización entre pestañas (evento `storage`).
- **Datos demo vivos**: las fechas de la semilla se desplazan con el calendario, así la agenda de "hoy" siempre tiene contenido.
- **Asignación inteligente**: puntúa zona de cobertura, carga del día y calificación; respeta habilidades, disponibilidad y cupo por franja.
- **Optimizador de rutas**: permutaciones exactas hasta 8 paradas (2-opt si hay más), minimiza distancia y penaliza llegadas fuera de franja.

## Publicar en GitHub y Vercel

Es un sitio 100 % estático: **no tiene paso de build**, por lo que Vercel lo sirve tal cual.

### 1. Subir a GitHub

**Opción A, sin instalar nada (web):**
1. En GitHub: *New repository* → nombre `petcare-domicilio` → *Create repository*.
2. En el repositorio vacío elige *uploading an existing file*.
3. Arrastra **el contenido** de la carpeta (`index.html`, `assets/`, `src/`, `vercel.json`, `.gitignore`, `.vercelignore`, `README.md`) y pulsa *Commit changes*.

**Opción B, con Git:**

```bash
git init
git add .
git commit -m "PetCare Domicilio: versión inicial"
git branch -M main
git remote add origin https://github.com/<tu-usuario>/petcare-domicilio.git
git push -u origin main
```

### 2. Desplegar en Vercel

1. En [vercel.com/new](https://vercel.com/new) → *Import Git Repository* → elige `petcare-domicilio`.
2. Configuración (Vercel la detecta sola):
   - **Framework Preset:** `Other`
   - **Build Command:** *(vacío)*
   - **Output Directory:** *(vacío / raíz)*
3. *Deploy*. Cada `git push` a `main` publica una nueva versión automáticamente.

Vía CLI, desde esta carpeta: `npx vercel` (vista previa) y `npx vercel --prod` (producción).

### Notas de producción

- `vercel.json` agrega cabeceras de seguridad (`nosniff`, `SAMEORIGIN`, `Referrer-Policy`, `Permissions-Policy`).
- La app usa rutas con `#` (`/#/owner/home`), así que no necesita reglas de reescritura.
- Los datos viven en el `localStorage` de cada navegador: no hay backend ni base de datos. Las contraseñas del registro son solo de demostración.
- React, htm, Tailwind y la fuente Inter se cargan desde CDN. Tailwind Play CDN muestra un aviso en consola ("should not be used in production"); es inofensivo. Para eliminarlo, compila el CSS con Tailwind CLI y reemplaza el `<script>` del CDN por una hoja de estilos local.

## Diseño y accesibilidad

- Azul marino `#0D223F`, dorado `#D4B06A`, tarjetas translúcidas, tipografía Inter.
- Navegación por teclado, foco visible, diálogos con trampa de foco y `Esc`, regiones `aria-live` para avisos, tablas con encabezados `scope`, alternativa en tabla para gráficos y `prefers-reduced-motion`.
- Responsive: barra lateral en escritorio, barra inferior en móvil.
