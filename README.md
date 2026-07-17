# LineMonitor

A wall-display **packaging-line andon board** for the DFOS · Dressing Halal
plant. It shows every machine's live state (Running / Idle / Waiting / Blocked /
Stopped / No Data) pulled from an OPC UA server (KEPServerEX) via a small Node
bridge.

## Architecture

```
Browser (React SPA)  ──/api, /ws──►  Node bridge (Express + ws + node-opcua)  ──opc.tcp──►  KEPServerEX / PLC
```

- **Frontend** — React + Vite dashboard (`src/`).
- **Bridge** — `server/`: serves the built SPA, exposes the Settings REST API,
  subscribes to the configured OPC UA tags, and streams status changes to the
  board over WebSocket. Config (endpoint + per-machine tags) is set in the
  in-app **Settings** page and persisted to `server/config.json`
  (`/data/config.json` in Docker).

## Run with Docker (deployment)

```bash
docker compose up -d --build
```

Then open **http://localhost:5230** and configure the OPC UA connection in
**Settings** (gear icon, top-right).

Full build/run/manage/troubleshoot instructions: **[DEPLOY.md](DEPLOY.md)**.

## Local development

```bash
npm install
npm run dev:all      # bridge on :8080 + Vite dev server (hot reload)
```

| Script | What it does |
|---|---|
| `npm run dev:all` | Bridge + Vite together (recommended for dev) |
| `npm run dev` | Vite dev server only (proxies `/api` + `/ws` to :8080) |
| `npm run server` | Bridge only (`node server/index.js`) |
| `npm run build` | Production build of the SPA into `dist/` |
| `npm run lint` | Oxlint |
