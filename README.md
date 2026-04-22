# Snorquel.cls

Base inicial con el stack pedido:

- Frontend: React 19 + Vite + TypeScript
- Routing: TanStack Router
- Data fetching: TanStack Query
- Backend: Bun
- DB: PostgreSQL
- ORM/schema: Drizzle ORM + Drizzle Kit
- Parsing de archivos: xlsx
- Contenedores: Docker Compose
- Lint/format: Biome

La home actual ya esta orientada a e-commerce de snorkels 4x4 de aluminio matte black, con landing, catalogo, carrito visible y tiempos de entrega.

## Puertos

- Frontend: `http://localhost:5124`
- API: `http://localhost:3001`
- PostgreSQL: `localhost:5433`

## Levantar el entorno

```bash
docker compose up db api web
```

## Variables base

Usa [.env.example](/Users/Matt/conductor/workspaces/Snorquel-v1/santo-domingo/.env.example:1) como referencia:

- `DATABASE_URL`
- `API_PORT`
- `PORT`
- `VITE_API_PROXY`

## Produccion y Railway

El repo ya quedo bastante mas preparado para subir servicios por separado:

- API Bun lista para usar `PORT` y `DATABASE_URL`
- `Dockerfile.api` para levantar backend
- `Dockerfile.web` para construir frontend y servirlo en preview
- Postgres modelado con Drizzle en `db/schema.ts`
- SQL init scripts en `docker/postgres/init/`

Comandos utiles:

```bash
bun run start:api
bun run preview:web
```

Si lo subes a Railway, la separacion razonable es:

- servicio `db`: PostgreSQL gestionado por Railway
- servicio `api`: usando `Dockerfile.api`
- servicio `web`: usando `Dockerfile.web`

Pendiente si quieres dejarlo realmente productivo:

- migraciones Drizzle aplicadas contra Railway en vez de solo init scripts locales
- catalogo/productos persistidos en Postgres en vez de mock del endpoint `/api/storefront`
- checkout/pedidos reales

## Estructura principal

- `src/`: frontend React
- `server/`: API en Bun
- `db/schema.ts`: esquema Drizzle
- `docker/postgres/init/`: scripts SQL de inicialización
- `src/assets/`: ilustraciones SVG del storefront

## Endpoints base

- `GET /api/health`
- `GET /api/dashboard`
- `GET /api/contacts`
- `GET /api/imports`
- `GET /api/imports/template`
