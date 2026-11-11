# Yohani

PWA para que una clienta reserve una hora con la manicurista Yohani y para que ella confirme, cobre y vea ingresos.

```
Yohani/
  docs/       visión, pantallas y datos
  app/        Astro + React + Tailwind, puerto 4323
  api/        PHP, puerto 8084
  database/   MySQL `yohani`
```

Arranque local, desde `app/`:

1. `npm install`
2. `npm run db:setup`
3. `npm run dev:api`
4. `npm run dev`

La contraseña de administración está en la base, no en el JavaScript. El prototipo HTML sigue en `docs/prototipo/`.
