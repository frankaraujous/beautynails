# Arquitectura — Yohani

## Carpetas

```
Yohani/
  docs/
  app/         Astro 7, React 19, Tailwind 4, service worker
  api/         PHP 8, PDO, un archivo por acción en v1/
  database/    schema.sql y seed.sql
```

## Stack

- Front: una sola página. Las pantallas son componentes React.
- API: `php -S 127.0.0.1:8084 -t api`. Vite hace proxy de `/api` y quita ese prefijo.
- Base: MySQL `utf8mb4`, zona `America/Los_Angeles` en PHP y `time_zone = -07:00` en la sesión SQL.
- Fotos en `api/storage/`. La base guarda el nombre del archivo. Esa carpeta no se sube a git.
- Sesión de admin: token en `localStorage`, header `X-App-Token`, tabla `sesiones`.

## Local

1. XAMPP con MySQL en `127.0.0.1`, usuario `root`, contraseña vacía.
2. `npm run db:setup` crea la base `yohani` y carga el SQL.
3. `api/config/db.php` se copia desde `db.sample.php` y no se commitea.

## Servidor

Crear otra base en phpMyAdmin (no reutilizar `yohani` del local si el hosting exige prefijo). En el servidor, `api/config/db.php` usa `localhost`, el nombre de esa base, `TU_USUARIO_MYSQL` y `TU_PASSWORD`. El build de `app/` se publica como sitio estático y la carpeta `api/` queda detrás del mismo dominio en `/api`. Este paso no crea nada en el hosting.
