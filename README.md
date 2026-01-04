# CalendRun Backend

Bun.js backend service for CalendRun, deployed to Flowcore Kubernetes.

## Architecture

- **Runtime**: Bun.js
- **Deployment**: Flowcore Kubernetes
- **Database**: PostgreSQL
- **Event Processing**: Flowcore SDK with polling to fetch events from Flowcore datacore
- **API**: REST API endpoints for read operations
- **Webhooks**: Stripe webhook handling

## Prerequisites

- Bun >= 1.2.0
- PostgreSQL database
- Flowcore API key
- Flowcore tenant access

## Getting Started

### Installation

1. **Install dependencies:**
   ```bash
   bun install
   ```

2. **Set up environment variables:**
   - Copy `env.example` to `.env.local`
   - Fill in all required values (see Environment Variables section below)

3. **Start development server:**
   ```bash
   bun run dev
   ```
   
   The API will be available at `http://localhost:18765`

## Environment Variables

See `env.example` for all required environment variables:

- **Server**: `NODE_ENV`, `PORT`
- **Database**: `DATABASE_URL`
- **Flowcore**: `FLOWCORE_TENANT`, `FLOWCORE_DATA_CORE`, `FLOWCORE_API_KEY`
- **API Authentication**: `BACKEND_API_KEY` (optional, for frontend-backend communication)
- **Event Polling**: `POLL_INTERVAL`, `PROCESS_BACKLOG_ON_STARTUP`, `BACKLOG_TIME_BUCKETS`

## Scripts

- `bun run dev` - Start development server
- `bun run build` - Build TypeScript
- `bun run start` - Start production server
- `bun run typecheck` - Run TypeScript type checking
- `bun run migrate:usable-to-flowcore` - Migrate data from Usable to Flowcore
- `bun run migrate:add-user-table` - Add user table migration
- `bun run migrate:ingest-users` - Ingest existing users
- `bun run process:templates` - Process challenge templates

## Flowcore Configuration

The backend uses Flowcore SDK polling to process events. Configuration is in `flowcore.yaml`:

- **Tenant**: `flowcore-saas`
- **Datacore**: `calendrun`
- **Flow Types**: 
  - `run.0` - Run performance events
  - `challenge.0` - Challenge instance events
  - `challenge.template.0` - Challenge template events
  - `club.0` - Club and membership events
  - `subscription.0` - Subscription events (from Stripe)
  - `discount.code.0` - Discount code events
  - `discount.bundle.0` - Discount bundle events
  - `user.0` - User events
  - `user.settings.0` - User settings events

## Database

PostgreSQL database schema is defined in `src/db/schema.sql`. The backend automatically runs migrations on startup.

### Schema

The database includes tables for:
- Users
- Challenge templates
- Challenge instances
- Runs
- Clubs
- Club memberships
- Subscriptions
- Discount codes
- Discount bundles

## Deployment

### Flowcore Kubernetes

The backend is deployed to Flowcore Kubernetes. Deployment configuration is managed in the [`flowcore-io/public-customer-sites-manifests`](https://github.com/flowcore-io/public-customer-sites-manifests) repository.

The `flowcore.deployment.json` file references:
- **Tag Path**: `flowcore-microservices.deployments.calendrunBackend.deployment.tag`
- **Repository**: `flowcore-io/public-customer-sites-manifests`

### GitHub Actions Deployment

Deployment is automated via GitHub Actions. The workflow (`.github/workflows/build.yml`) is triggered when a GitHub release is published and performs the following steps:

1. **Extract Information** (`extract_info` job):
   - Extracts the version from the release tag (removes 'v' prefix if present)
   - Reads the package name from `package.json`
   - Reads deployment configuration from `flowcore.deployment.json`

2. **Build and Push Docker Image** (`build_docker` job):
   - Authenticates with AWS using OIDC (IAM role: `ECRGithubManager`)
   - Logs into Amazon ECR (Elastic Container Registry)
   - Creates the ECR repository if it doesn't exist
   - Builds the Docker image using the `Dockerfile`
   - Tags the image with both the version tag and `latest`
   - Pushes both tags to ECR

3. **Update Deployment Manifest** (`deploy_manifest` job):
   - Checks out the deployment repository (`flowcore-io/public-customer-sites-manifests`)
   - Uses `yq` to update the image tag in `configuration/azure-eu.yaml`
   - Commits and pushes the updated manifest, triggering the actual Kubernetes deployment

**Required GitHub Secrets:**
- `NPM_TOKEN` - For installing private npm packages during Docker build
- `FLOWCORE_MACHINE_GITHUB_TOKEN` - For pushing to the deployment repository

**To deploy:**
1. Create a new GitHub release with a version tag (e.g., `v1.2.3`)
2. The GitHub Actions workflow will automatically build and deploy

### Kubernetes Secrets

Create the required Kubernetes secret using the script in `k8s/create-secret.sh`:

```bash
./k8s/create-secret.sh
```

This creates the `calendrun-backend-credentials` secret in the `public-sites` namespace.

## Project Structure

```
calendrun-backend/
├── src/
│   ├── contracts/        # Zod schemas for event contracts
│   ├── db/               # Database pool, queries, and schema
│   ├── handlers/         # Event handlers for each flow type
│   ├── middleware/       # API middleware (API key auth)
│   ├── routes/           # REST API routes
│   └── services/         # Event processing services
├── scripts/              # Migration and utility scripts
├── k8s/                  # Kubernetes deployment files
├── Dockerfile            # Docker build configuration
└── flowcore.yaml         # Flowcore configuration
```

## API Endpoints

The backend provides REST API endpoints for reading data:

- `GET /health` - Health check endpoint
- `GET /api/challenges` - Get challenge instances
- `GET /api/challenges/:id` - Get specific challenge instance
- `GET /api/templates` - Get challenge templates
- `GET /api/runs` - Get runs
- `GET /api/clubs` - Get clubs
- `GET /api/clubs/:id` - Get specific club
- `GET /api/subscriptions` - Get subscriptions
- `GET /api/discount-codes` - Get discount codes
- `GET /api/discount-bundles` - Get discount bundles

All write operations go through Flowcore event ingestion (handled by the frontend).

## Development Status

✅ **Completed:**
- Bun.js service setup
- Flowcore SDK integration with event polling
- PostgreSQL database schema and migrations
- REST API endpoints for read operations
- Event handlers for all flow types
- Stripe webhook handling
- Kubernetes deployment configuration

## Related Repositories

- **Frontend**: [`flowcore-io/calendrun-frontend`](https://github.com/flowcore-io/calendrun-frontend) - Next.js frontend application

