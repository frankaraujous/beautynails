# Beauty Nails

Este repositorio guarda el HTML original y dos aplicaciones web instalables (PWA). La rama `main` conserva el código tal como llegó. El trabajo nuevo está en `estructura-pwa`.

## Carpetas

| Carpeta | Qué es |
| --- | --- |
| `Estructura Proyecto Inicial/` | HTML, tutorial y el Astro de arranque. No se modifica para construir las apps. |
| `Yohani/` | Citas de uñas. PWA, API PHP y base `yohani`. |
| `Araujo Landscaping/` | Ruta, estimados e invoices. PWA, API PHP y base `araujo_landscaping`. |

Cada aplicación tiene `docs/`, `app/`, `api/` y `database/`. No hay proyecto Android.

## Puertos locales

| App | Front | API | Base |
| --- | --- | --- | --- |
| Yohani | 4323 | 8084 | `yohani` |
| Araujo Landscaping | 4324 | 8085 | `araujo_landscaping` |

Dentro de cada `app/`: `npm install`, `npm run db:setup`, `npm run dev:api` y `npm run dev`.
