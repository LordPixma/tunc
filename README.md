# Tunc

Tunc is a serverless multimedia event platform built entirely on the Cloudflare developer ecosystem. It allows communities to co‑create timelines (“capsules”), attach media and messages, and lock content until a specified reveal date. Each timeline is isolated in its own Durable Object for consistent state with global access.

## Architecture

* **Cloudflare Workers** – Hosts the REST API and handles incoming requests.
* **Durable Objects** – One object per timeline to manage ordering and locking of items.
* **D1 (SQL)** – Stores timeline metadata and provides relational queries. See `schema.sql` for table definitions.
* **R2** – Stores large media files (images, video). Items reference R2 object keys.
* **Queues** – Used for asynchronous tasks like processing media or sending notifications.
* **Pages** – Serves the front‑end generated from the MagicPatterns design.

## Setup

1. Install Wrangler v3+ and Node.js.
2. Clone this repository and install dependencies.
3. Configure environment variables by creating a `.env` file:

   ```bash
   API_TOKEN="replace-with-strong-secret"
   ```

   This worker also expects a D1 database binding named `DB` configured in `wrangler.toml`.
   Store secrets in Cloudflare with `wrangler secret put API_TOKEN` and never commit them to version control.
4. Create a D1 database for your environment:

   ```bash
   wrangler d1 create tunc-db
   ```

5. Apply migrations to the database:

   ```bash
   wrangler d1 migrations apply tunc-db
   # or load the schema directly
   wrangler d1 execute tunc-db --file schema.sql
   ```

6. Run the UI during development:

   ```bash
   cd ui
   npm install
   npm run dev
   ```

7. Deploy the Worker:

   ```bash
   wrangler deploy
   ```

## API Endpoints

All endpoints require an `Authorization: Bearer <API_TOKEN>` header.

| Method | Endpoint | Parameters | Status codes | Example response |
|--------|----------|------------|--------------|------------------|
| POST | `/capsule` | Body: `{ "name": string }` | `201`, `400`, `401`, `500` | `{"id":"550e8400-e29b-41d4-a716-446655440000"}` |
| POST | `/capsule/:id/item` | Path: `id` (UUID)<br>Body: `{ "message": string, "openingDate"?: "YYYY-MM-DD", "attachments"?: string[] }` | `201`, `400`, `401`, `500` | `{"id":"...","message":"Hello","attachments":[],"created_at":"2025-01-01T00:00:00.000Z"}` |
| GET | `/capsule/:id` | Path: `id` (UUID) | `200`, `400`, `401`, `500` | `[ {"id":"...","message":"..."} ]` |
| POST | `/upload/:capsuleId` | Path: `capsuleId` (UUID)<br>Body: binary or multipart `file` | `201`, `400`, `401`, `413`, `415`, `500` | `{"url":"https://<bucket>.r2.dev/<capsuleId>/<uuid>"}` |

See `src/index.ts` and `src/timeline.ts` for implementation details.

## Authentication & Security

* **Authentication** – Every request must include `Authorization: Bearer <API_TOKEN>`. Generate a strong token and store it with `wrangler secret put`.
* **Security headers** – The Worker sets permissive CORS headers for development. For production you should add headers such as `Content-Security-Policy`, `X-Content-Type-Options`, `Referrer-Policy`, and `Strict-Transport-Security` to harden responses.
* **Environment secrets** – Do not commit `.env` files. Use Wrangler secrets for `API_TOKEN` and any future keys (e.g. webhook URLs or third‑party credentials).

## Front‑end

The UI has been designed in MagicPatterns and can be exported directly to the `/ui` directory of this repo. Use the “Sync to GitHub” option in MagicPatterns to push the generated React code. The design includes pages for event creation, timeline browsing, capsule management and discovery.

## Local development

To test your Worker and Durable Objects locally:

```bash
wrangler dev
```

Wrangler will spin up a local Worker environment and in‑memory Durable Objects. You can interact with the API using curl or a REST client. Use the D1 console to inspect your SQL database.

## License

Tunc is provided as‑is. See `LICENSE` for details.
