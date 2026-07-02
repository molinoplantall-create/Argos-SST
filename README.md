# ARGOS SST

Aplicación para realizar inspecciones de Seguridad y Salud en el Trabajo (SST) en operaciones mineras/industriales en Perú. Cumplimiento Ley 29783.

## Stack
Next.js 16 · React 19 · TypeScript · Supabase · Tailwind 4 · @react-pdf/renderer

## Módulos
- Inspecciones mensuales (con análisis IA de fotos vía GPT-4o)
- Entrega de EPP a trabajadores
- Inspección de EPP
- Hallazgos con severidad A/B/C
- Inspección de almacenes
- Documentos SST
- Administración de usuarios y roles (multi-tenant con `client_id`)

## Setup local

```bash
npm install
cp .env.example .env.local  # y completar las variables
npm run dev
```

## Variables de entorno requeridas
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (solo server-side, nunca `NEXT_PUBLIC_*`)
- `AI_API_KEY` (OpenAI o compatible)
- `AI_API_URL` (default: `https://api.openai.com/v1/chat/completions`)

## Despliegue
Vercel (recomendado). Configurar las env vars en Project Settings.
