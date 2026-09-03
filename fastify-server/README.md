# Jerry Fitness App — Fastify Server Backend

Production-grade, enterprise backend foundation built with Node.js, Fastify, TypeScript, Prisma ORM (PostgreSQL), Redis, Vitest, Pino, and OpenAPI.

## Architecture
Modular monolith architecture designed for seamless future microservice extraction:

- `src/app/`: Application setup and plugin aggregation
- `src/config/`: Type-safe environment validation
- `src/plugins/`: Fastify core plugin wrappers (cors, helmet, rate-limit, swagger, prisma, redis, sensible, error-handler)
- `src/common/`: Shared error hierarchy, standardized response utilities, middleware, constants, and types
- `src/modules/`: Business modules (`health`, `users`, `auth`) containing controllers, services, repositories, schemas, and routes
- `src/database/`: Prisma service lifecycle and migration support
- `src/cache/`: Redis client and lifecycle management
- `src/observability/`: Pino logging setup
- `src/routes/`: Global v1 route routing

## Quick Start

### Prerequisites
- Node.js >= 20.x
- Docker & Docker Compose (or local PostgreSQL and Redis)

### Installation
```bash
npm install
```

### Running Locally
```bash
npm run dev
```

### Building & Production
```bash
npm run build
npm start
```

### Database Operations
```bash
npm run db:generate
npm run db:migrate
npm run db:seed
```

### Quality Gates & Testing
```bash
npm run lint
npm run typecheck
npm test
```

### API Documentation
Swagger UI documentation is available at `http://localhost:3000/docs` when running the application.
