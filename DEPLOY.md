# LineMonitor — Docker Deployment

LineMonitor ships as a **single Docker image**. The Node bridge inside the
container serves everything on one port:

- the built dashboard (React SPA),
- the REST API (`/api/*`) used by the Settings page,
- the live WebSocket feed (`/ws`),
- and the OPC UA client that talks to your plant server (e.g. KEPServerEX).

Inside the container the app listens on **8080**; docker-compose maps that to
host port **5230**, so you browse the app at **http://localhost:5230**.

---

## 1. Prerequisites

- **Docker Engine 20+** with the **Compose plugin** (`docker compose`).
- The Docker host must be able to reach your OPC UA server on the network
  (e.g. `opc.tcp://10.156.116.1:49320`). Outbound access over Docker's default
  bridge network is enough — no special config needed in most setups.

> **Windows + WSL2 (Docker Desktop):** enable WSL integration for your distro
> first — *Docker Desktop → Settings → Resources → WSL Integration → toggle your
> distro on → Apply & Restart*. Then run the commands below from your WSL shell.

Verify Docker is reachable:

```bash
docker version
docker compose version
```

---

## 2. Build & run (recommended: Docker Compose)

From the project root (where `docker-compose.yml` lives):

```bash
docker compose up -d --build
```

- `--build` builds the image (first run, or after code changes).
- `-d` runs it in the background.

Then open **http://localhost:5230**.

To stop it:

```bash
docker compose down
```

`down` keeps your saved configuration (it lives in a named volume, not the
container). To also delete the saved config, add `-v` (see §6).

---

## 3. Build & run (plain Docker, no Compose)

```bash
# build the image
docker build -t linemonitor:latest .

# run it: host 5230 → container 8080, config persisted in a named volume
docker run -d \
  --name linemonitor \
  -p 5230:8080 \
  -v linemonitor-config:/data \
  --restart unless-stopped \
  linemonitor:latest
```

Browse **http://localhost:5230**. Stop/remove with `docker rm -f linemonitor`.

---

## 4. First-time configuration

The board starts empty until you point it at your OPC UA server:

1. Open **http://localhost:5230**.
2. Click the **gear icon** (top-right) → **Settings**.
3. **Step 1 — Connection:** enter the endpoint (e.g.
   `opc.tcp://10.156.116.1:49320`), leave security **None** for an unsecured
   endpoint, set the **Namespace** (KEPServerEX = `2`), then **Test Connection**.
4. **Step 2 — Machine Tags:** map each machine to its status tag (the
   `…_iState` NodeId). Use the discovery/auto-fill to speed this up, review the
   flagged (⚠) ones, then **Save Configuration**.
5. The bridge restarts automatically and the board goes live.

Your settings are saved to the `linemonitor-config` volume and **survive
container restarts, rebuilds, and image updates**.

---

## 5. Managing the container

```bash
docker compose logs -f          # follow logs (bridge connection, tag errors)
docker compose ps               # status
docker compose restart          # restart without rebuilding
docker compose up -d --build    # rebuild + redeploy after code changes
```

Plain-Docker equivalents: `docker logs -f linemonitor`,
`docker restart linemonitor`.

**Updating after code changes:** rebuild and redeploy — `docker compose up -d
--build`. The config volume is untouched, so you don't reconfigure.

---

## 6. Configuration persistence

The OPC UA endpoint + tag map are stored at `/data/config.json` inside the
container, backed by the **`linemonitor-config`** named volume.

```bash
# back up the current config to a file on the host
docker run --rm -v linemonitor-config:/data busybox cat /data/config.json > config.backup.json

# wipe the saved config (start fresh) — removes the volume
docker compose down -v          # compose
# or:  docker volume rm linemonitor-config   (plain docker, container removed first)
```

---

## 7. Common adjustments

**Change the host port** (e.g. use 8090 instead of 5230): edit the mapping in
`docker-compose.yml`:

```yaml
    ports:
      - "8090:8080"     # host:container — only change the left number
```

**OPC UA server only reachable from the host (Linux hosts):** uncomment
`network_mode: host` in `docker-compose.yml` and remove the `ports:` block; the
app is then reachable on the host's `PORT` (8080) directly. *(Host networking is
not supported on Docker Desktop for Windows/Mac — there, outbound bridge
networking already reaches LAN servers, so leave the default.)*

---

## 8. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `docker: command not found` (WSL) | Enable WSL integration in Docker Desktop (§1). |
| `Bind for 0.0.0.0:5230 failed: port is already allocated` | Another process uses 5230 — change the host port (§7) or free it. |
| Board loads but stays "NO DATA" | Not configured yet, or the container can't reach the OPC UA server. Check **Settings → Test Connection** and `docker compose logs -f`. |
| Test Connection fails / times out | Endpoint/port wrong, security mismatch, or the host can't route to the PLC network. Confirm the host itself can reach `opc.tcp://<host>:<port>`. |
| Tags show `BadNodeIdUnknown` | The NodeId doesn't exist on the server — use discovery to pick the correct `…_iState` tag. |
| Config lost after `down` | You ran `docker compose down -v` (the `-v` deletes the volume). Use `down` without `-v`. |

---

## Local development (no Docker)

For iterating on the code with hot reload, skip Docker and run the bridge and
Vite together:

```bash
npm install
npm run dev:all      # bridge on :8080 + Vite dev server (proxies /api and /ws)
```

Vite prints the dev URL (usually http://localhost:5173).
