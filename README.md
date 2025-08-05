# Tunc

Tunc is a serverless multimedia event platform built entirely on the Cloudflare developer ecosystem. It allows communities to co‑create timelines (“capsules”), attach media and messages, and lock content until a specified reveal date. Each timeline is isolated in its own Durable Object for consistent state with global access.

## Architecture

* **Cloudflare Workers** – Hosts the REST API and handles incoming requests.
* **Durable Objects** – One object per timeline to manage ordering and locking of items.
* **D1 (SQL)** – Stores timeline metadata and provides relational queries. See `schema.sql` for table definitions.
* **R2** – Stores large media files (images, video). Items reference R2 object keys.
* **Queues** – Used for asynchronous tasks like processing media or sending notifications.
* **Pages** – Serves the front‑end generated from the MagicPatterns design.

## Getting started

1. Install Wrangler v3+ and Node.js.
2. Clone this repository and install dependencies (if any front‑end code is added).
3. Create a D1 database for your environment:

   ```bash
   wrangler d1 create tunc-db
   ```

4. Set the `database_id` in `wrangler.toml` under the `[[d1_databases]]` section. The `binding` should remain `DB` so the Worker can access `env.DB`.
5. Apply the SQL schema to your database:

   ```bash
   wrangler d1 execute tunc-db --file schema.sql
   ```

6. Build and deploy:

```bash
# deploy the API to Workers
wrangler deploy

# build the front‑end into `public`
cd ui
npm run build:public
```

## API Routes

The Worker exposes a small REST API:

| Method & path            | Description                                 |
|--------------------------|---------------------------------------------|
| `POST /capsule`          | Create a new timeline. Body: `{ "name": "Event Name" }`. Returns `{ id }`. |
| `POST /capsule/:id/item` | Add an item to a timeline. Delegates to the Durable Object. Body: `{ "message": "...", "openingDate": "YYYY-MM-DD" }`. |
| `GET /capsule/:id`       | Retrieve the full timeline (list of items). |

See `src/index.ts` and `src/timeline.ts` for implementation details.

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
