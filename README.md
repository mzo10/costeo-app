# Costeo

App de costeo de recetas, ventas por plataforma de delivery y rentabilidad para negocios de comida rápida.

## Correr local
```
npm install
npm run dev
```

## Desplegar en Vercel
1. Subí esta carpeta a un repo de GitHub.
2. Andá a vercel.com → "Add New Project" → importá el repo.
3. Vercel detecta Vite automáticamente (build: `npm run build`, output: `dist`). Deploy.

## Nota sobre datos
Ahora mismo los datos se guardan en `localStorage` del navegador (ver `src/main.jsx`).
Eso significa: funciona perfecto para probar y trabajar solo, pero el código+PIN de
negocio NO sincroniza entre dispositivos todavía — cada navegador tiene su propia copia.
Para que el equipo comparta datos reales desde distintos dispositivos hay que conectar
un backend (recomendado: Supabase, ya usado en sinpe-check).
