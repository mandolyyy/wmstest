cd backend  
npm install  
npm start  

This starts the API on **http://localhost:4000** and creates `backend/db/wms.db` automatically on first run (schema is applied from `backend/db/schema.sql`).

### 2. Frontend

In a second terminal:

cd frontend  
npm install  
npm run dev
```

This starts the UI on **http://localhost:5173**. The dev server proxies any request to `/api/*` through to the backend on port 4000 (see `vite.config.js`), so just open http://localhost:5173 in your browser.

To build a production bundle of the frontend:

```bash
npm run build
```

The static files land in `frontend/dist/` — serve them with any static file server, or set up Express to serve them as well if you want a single deployable service.

## How bin allocation works

When an item is received, the backend looks for the **smallest-volume empty bin** whose `max_weight`, `max_length`, `max_width` and `max_height` are all greater than or equal to the item's own weight/dimensions, and assigns it automatically. If nothing fits, the item is left in `inbound` status (unassigned) and a `BIN_UNAVAILABLE` event is logged — you can add more bins in **Storage setting** and re-check later.

## Data model (SQLite tables)

- `zones`, `aisles`, `racks`, `shelves`, `bins` — the storage hierarchy. Each bin stores its own `max_weight`/`max_length`/`max_width`/`max_height` and current occupancy.
- `items` — one row per physical item received, with its weight/dimensions, current status (`inbound` → `stored` → `outbound_requested` → `shipped`) and current bin.
- `outbound_requests` — pre-requests raised against a stored item, with `pending` / `completed` / `cancelled` status.
- `logs` — an append-only audit trail: every inbound, bin assignment, outbound pre-request, completion or cancellation is written here with `item_id`, `action`, `details`, `user_id` and `created_at`. This is what powers the Reporting page.

## Notes / things you may want to extend

- There's no authentication — the "operator" field in the top-right of the UI is just a free-text user ID used for logging, not a login system.
- Bin fit-checking assumes the item's length/width/height line up with the bin's as given (no rotation logic).
- Deleting a zone/aisle/rack/shelf/bin cascades to its children (zones down to shelves) via `ON DELETE CASCADE`; bins can't be deleted while they hold an item.

## Troubleshooting

**"Cannot find module 'express'"** — `npm install` didn't complete in that folder. Re-run `npm install` inside `backend/` (and separately inside `frontend/`) and check for errors in the output.

**"Could not locate the bindings file" / native module errors** — this project no longer depends on any compiled native module for SQLite, so you shouldn't see this. If you do, make sure you're on the latest code (no `better-sqlite3` in `backend/package.json`) and that `node_modules` was reinstalled after pulling the update.

**Server won't start on Windows / `rm` not recognized** — Windows Command Prompt doesn't have `rm`. Use `del` (cmd) or `Remove-Item` (PowerShell) instead, e.g. `del db\wms.db` or `Remove-Item db\wms.db -ErrorAction SilentlyContinue`.

**500 error on any `/api/...` route** — the real error is printed in the terminal running `npm start`, not shown in the browser. Check that terminal for a stack trace; it'll say exactly what failed.
