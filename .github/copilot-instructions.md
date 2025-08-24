# Tunc - Cloudflare Workers Time Capsule Platform

Tunc is a serverless time capsule platform built on Cloudflare Workers with a React UI. It uses D1 database, R2 storage, Durable Objects, and Queues to create a full-stack application for creating and managing time capsules.

Always reference these instructions first and fallback to search or bash commands only when you encounter unexpected information that does not match the info here.

## Working Effectively

### Bootstrap and Build Process
NEVER CANCEL any build or long-running command. Set appropriate timeouts and wait for completion.

- Install Node.js dependencies:
  ```bash
  npm install                    # Takes ~1 second, NEVER CANCEL
  cd ui && npm install          # Takes ~20 seconds, NEVER CANCEL
  ```

- Run all tests:
  ```bash
  npm test                      # Takes ~1 second, runs both worker and UI tests, NEVER CANCEL
  ```

- Build the UI for production:
  ```bash
  cd ui && npm run build        # Takes ~4 seconds, NEVER CANCEL, set timeout to 30+ seconds
  ```

- Install Wrangler (if not available):
  ```bash
  npm install -g wrangler       # Takes ~15-30 seconds, NEVER CANCEL
  ```

### Development Environment

- Start the Worker development server:
  ```bash
  wrangler dev --local          # Starts on http://localhost:8787, NEVER CANCEL
  ```

- Start the UI development server (separate terminal):
  ```bash
  cd ui && npm run dev          # Starts on http://localhost:5173, takes ~1 second, NEVER CANCEL
  ```

- Required environment variables (create `.env` file):
  ```bash
  API_TOKEN="your-strong-secret-token"
  SLACK_WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"
  VITE_API_BASE_URL="http://localhost:8787"
  JWT_SECRET="your-jwt-secret-key"
  ```

  **CRITICAL**: Never commit `.env` files. Use `wrangler secret put API_TOKEN` and `wrangler secret put SLACK_WEBHOOK_URL` for production.

### Validation and Testing

- Lint the UI code:
  ```bash
  cd ui && npm run lint         # Takes ~2 seconds, may show TypeScript version warnings (safe to ignore)
  ```

- **MANUAL VALIDATION REQUIREMENT**: After any changes, ALWAYS test the full API workflow:
  1. Create a JWT token for testing (use the createJWT function from src/index.ts)
  2. Test capsule creation: `POST /capsule` with JWT Bearer token
  3. Test file upload: `POST /upload/:capsuleId` with JWT Bearer token
  4. Test timeline access via Durable Object endpoints
  5. Verify CORS headers are present in all responses
  6. Check that both development servers (worker and UI) start successfully

- **VALIDATION SCENARIOS**: Always test these user scenarios after making changes:
  1. **Basic API Flow**: Create capsule → Upload file → Add timeline item → Retrieve timeline
  2. **Authentication**: Test with valid JWT, invalid JWT, and missing authorization
  3. **UI Development**: Verify UI loads at http://localhost:5173 and can communicate with worker API
  4. **Build Process**: Ensure `npm test` passes and `npm run build` (in ui/) completes successfully

### Build and Deploy Commands

- Type-check TypeScript (may have non-critical errors):
  ```bash
  npx tsc --noEmit              # Takes ~2 seconds, some errors are expected and don't prevent runtime
  ```

- Deploy to staging (requires Cloudflare credentials):
  ```bash
  wrangler deploy --env staging # Takes ~30 seconds, NEVER CANCEL, set timeout to 60+ seconds
  ```

- Deploy to production (requires Cloudflare credentials):
  ```bash
  wrangler deploy --env production # Takes ~30 seconds, NEVER CANCEL, set timeout to 60+ seconds
  ```

## Authentication & Security

- **JWT Authentication**: All API endpoints require `Authorization: Bearer <JWT_TOKEN>` headers
- **Token Creation**: Use `createJWT({ sub: 'user', role: 'admin' }, JWT_SECRET)` to create valid tokens
- **API_TOKEN vs JWT_SECRET**: 
  - `JWT_SECRET`: Used to sign/verify JWT tokens for API authentication
  - `API_TOKEN`: Used by Durable Objects and legacy endpoints
  - Both are required for full functionality

## Common Tasks and File Locations

### Key Project Structure
```
/home/runner/work/tunc/tunc/
├── src/                    # Cloudflare Worker source
│   ├── index.ts           # Main worker entry point, handles /capsule and /upload
│   ├── timeline.ts        # Durable Object for timeline management
│   └── notify.ts          # Queue consumer for Slack notifications
├── ui/                    # React frontend (Magic Patterns generated)
│   ├── src/               # React components and pages
│   ├── package.json       # UI dependencies and scripts
│   └── dist/              # Built UI assets (after npm run build)
├── test/                  # Vitest tests for worker logic
├── migrations/            # D1 database migrations
├── schema.sql             # Database schema definition
├── wrangler.toml          # Cloudflare Workers configuration
└── package.json           # Root dependencies and test scripts
```

### Frequently Referenced Files
- **Main API Logic**: `src/index.ts` - handles capsule creation and file uploads
- **Timeline Management**: `src/timeline.ts` - Durable Object for timeline operations
- **Database Schema**: `schema.sql` and `migrations/0001_init.sql`
- **Worker Configuration**: `wrangler.toml` - defines D1, R2, Queues, and Durable Objects
- **CI/CD Pipeline**: `.github/workflows/test.yml` - automated testing and deployment

### Common File Operations
- When modifying `src/index.ts`, always check `src/timeline.ts` for related timeline operations
- When changing API contracts, verify test files in `test/worker.test.ts` need updates
- UI changes require rebuilding with `npm run build` in the ui/ directory
- Database changes require new migration files in `migrations/`

## Database and Storage

- **D1 Database**: SQLite-compatible, configured in `wrangler.toml`
  - Local development: in-memory database
  - Initialize with: `wrangler d1 migrations apply tunc-db` or `wrangler d1 execute tunc-db --file schema.sql`
- **R2 Storage**: Object storage for file uploads
  - Local development: uses local filesystem simulation
- **Durable Objects**: TimelineDO for consistent timeline operations
- **Queues**: Notification system with dead letter queue for failed Slack messages

## Troubleshooting

### Common Issues and Solutions
1. **"TimelineDO not exported"**: Ensure `TimelineDO` is exported in `src/index.ts`
2. **"401 Unauthorized"**: Create valid JWT with `JWT_SECRET`, not raw `API_TOKEN`
3. **"DB error"**: Local D1 database may not be initialized - this is normal for local development
4. **TypeScript errors**: Some compilation errors are expected and don't prevent runtime functionality
5. **UI build warnings**: TypeScript version compatibility warnings in linting are safe to ignore
6. **Network errors**: `getaddrinfo ENOTFOUND workers.cloudflare.com` warnings are normal in local development

### Performance Expectations
- **Root npm install**: ~1 second (when node_modules exists)
- **UI npm install**: ~20 seconds (fresh install)
- **UI build**: ~4 seconds
- **Test execution**: ~1 second
- **Wrangler dev startup**: ~10 seconds
- **UI dev server startup**: ~1 second

### CI/CD Integration
- **GitHub Actions**: `.github/workflows/test.yml` runs tests and deploys on push
- **Branch Strategy**: `main` → production, `staging` → staging environment
- **Required Secrets**: `CLOUDFLARE_API_TOKEN`, `API_TOKEN`, `SLACK_WEBHOOK`
- **Test Requirements**: All tests must pass before deployment
- Always run `npm test` and `npm run lint` (in ui/) before committing

## Working with the Codebase

### Making Changes Safely
1. Always run existing tests first: `npm test`
2. Start development servers to test changes: `wrangler dev --local` and `cd ui && npm run dev`
3. Test API endpoints with proper JWT authentication
4. Verify UI can communicate with worker API
5. Run linting: `cd ui && npm run lint`
6. Re-run tests after changes: `npm test`
7. Test build process: `cd ui && npm run build`

### Key Development Files to Monitor
- **Worker Logic**: Changes to `src/index.ts` require testing with `wrangler dev`
- **Database Operations**: Changes to `src/timeline.ts` affect Durable Object behavior
- **API Contracts**: Always verify test coverage in `test/worker.test.ts`
- **UI Components**: Changes in `ui/src/` require rebuild for production
- **Configuration**: Changes to `wrangler.toml` affect Worker bindings and deployment

### Environment Setup Checklist
- [ ] Node.js 20+ installed
- [ ] Wrangler 4+ installed globally
- [ ] Dependencies installed: `npm install` (root) and `npm install` (ui/)
- [ ] Environment variables configured in `.env` file
- [ ] Both development servers can start successfully
- [ ] API authentication tested with valid JWT tokens
- [ ] UI can load and communicate with worker API