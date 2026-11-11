# Arquitectura — Araujo’s Landscaping

## Carpetas

```
Araujo Landscaping/
  docs/
  app/         Astro 7, React 19, Tailwind 4, service worker
  api/         PHP 8, PDO
  database/    schema.sql y seed.sql
```

## Stack

- Una página. Ruta, Estimados y Oficina son pantallas React.
- API en `127.0.0.1:8085`. El front llama a `/api` y Vite quita el prefijo.
- Base `araujo_landscaping`, `utf8mb4`. PHP usa `America/Los_Angeles`.
- Fotos de visitas y firmas en `api/storage/` (no se commitean).
- Oficina: token `X-App-Token` contra `sesiones`.
- Códigos de empleado y contraseña de oficina viven en la base.

## Local

XAMPP, `127.0.0.1`, `root`, contraseña vacía. Desde `app/`: `npm run db:setup`, `npm run dev:api`, `npm run dev` (puerto 4324).

## Servidor

Crear la base en phpMyAdmin del hosting. Copiar `api/config/db.sample.php` a `db.php` con `localhost`, el nombre real de la base, `TU_USUARIO_MYSQL` y `TU_PASSWORD`. No commitear `db.php`. Este paso no crea la base remota.
