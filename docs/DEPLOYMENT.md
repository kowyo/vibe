# Production Deployment Guide

This guide explains how to deploy the app to a VPS behind Traefik, configure environment variables, and verify streaming (WebSocket) works end-to-end.

## Prerequisites

- Docker and Docker Compose installed on the VPS
- A running Traefik instance using the provided files under `traefik-compose/`
- DNS for your domain pointing to the VPS (e.g., `build.kowyo.com`)

## Files used

- `traefik-compose/compose.yaml`: Starts the Traefik proxy
- `traefik-compose/dynamic/build.yml`: Declares routers/services for frontend, API, and WebSocket

## Traefik setup

1. Ensure the external docker network `traefik` exists (Traefik service expects it):

```bash
docker network create traefik || true
```

2. Bring up Traefik with our static and dynamic configs:

```bash
docker compose -f traefik-compose/compose.yaml up -d
```

3. Dynamic routing defined in `traefik-compose/dynamic/build.yml`:

- `build-frontend` → `http://host.docker.internal:3000`
- `build-api` and `build-auth` → `http://host.docker.internal:8000`
- `build-ws` → WebSocket route at `wss://build.kowyo.com/ws/{projectId}`
- `build-ws-alt` → Optional WebSocket route at `wss://build.kowyo.com/api/ws/{projectId}` via a strip-prefix middleware

Note: On many VPS platforms, `host.docker.internal` resolves to the host. If yours does not, replace it with the host LAN IP (e.g., `172.17.0.1`).

## Backend configuration

Backend defaults are defined in `backend/app/config.py`. Confirm:

- `CLAUDE_APP_API_PREFIX=/api` (default)
- `CLAUDE_APP_ALLOWED_ORIGINS=["https://build.kowyo.com", "http://localhost:3000", ...]`

Run backend (example):

```bash
cd backend
uv run uvicorn app.main:app --host 0.0.0.0 --port 8000 --proxy-headers
```

## Frontend configuration

Set the following environment variables for the frontend build:

- `NEXT_PUBLIC_BACKEND_URL=https://build.kowyo.com/api`
- `NEXT_PUBLIC_BACKEND_WS_URL=wss://build.kowyo.com/ws`

`NEXT_PUBLIC_BACKEND_WS_URL` must point to `/ws` (not `/api/ws`). The Traefik config also supports `/api/ws` via a strip-prefix middleware, but the recommended value is `/ws`.

Build and run the frontend (example):

```bash
pnpm install
pnpm build
pnpm start --port 3000 --hostname 0.0.0.0
```

## Verification checklist

1. Health check

```bash
curl -sSf https://build.kowyo.com/api/health
# Expect: {"status":"ok"}
```

2. WebSocket upgrade path

- In a browser, open DevTools → Network → WS
- Start a generation; verify a WebSocket connects to `wss://build.kowyo.com/ws/{projectId}`
- You should see incremental `assistant_message`, `log_appended`, `status_updated` events streaming in

Optional CLI check with `websocat`:

```bash
websocat wss://build.kowyo.com/ws/<projectId>
```

3. End-to-end generation

- From the UI, submit a prompt
- Watch the Status Panel logs update live and the assistant message stream token-by-token or step-by-step

## Troubleshooting

- WebSocket connects but no streaming:
  - Check that `NEXT_PUBLIC_BACKEND_WS_URL` is `wss://build.kowyo.com/ws`
  - Confirm the Traefik router `build-ws` is active and not shadowed by another rule
  - Ensure the backend is reachable from Traefik (`host.docker.internal` vs host IP)

- WebSocket 404 or failed upgrade:
  - Verify path matches `/ws/{projectId}` (or `/api/ws/{projectId}` if using the alt route)
  - Confirm `build.yml` contains the `build-ws` and optional `build-ws-alt` sections

- CORS errors on REST API:
  - Add your domain to `CLAUDE_APP_ALLOWED_ORIGINS`

- Everything returns at once (no incremental updates):
  - Usually caused by the WS path being wrong; the UI can't subscribe to events and only shows final state. Fix `NEXT_PUBLIC_BACKEND_WS_URL` and re-test.

## Notes

- All REST endpoints are under `/api/*`. The WebSocket endpoint is `/ws/{projectId}`.
- The Traefik dynamic config already contains a `strip-api-prefix` middleware so `/api/ws/*` also works if you must keep `/api` in all URLs.

## Environment Variables Examples

### Frontend

```bash
NEXT_PUBLIC_BETTER_AUTH_URL=https://example.com
BETTER_AUTH_SECRET=<a secure random string>
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
NEXT_PUBLIC_BACKEND_URL=https://example.com/api
NEXT_PUBLIC_BACKEND_WS_URL=wss://example.com/ws
```

### Backend

```bash
ANTHROPIC_API_KEY=
ANTHROPIC_BASE_URL=
# ANTHROPIC_DEFAULT_HAIKU_MODEL=kimi-k2-instruct
# ANTHROPIC_DEFAULT_OPUS_MODEL=kimi-k2-instruct
# ANTHROPIC_DEFAULT_SONNET_MODEL=kimi-k2-instruct
# ANTHROPIC_MODEL=kimi-k2-instruct
# CLAUDE_CODE_SUBAGENT_MODEL=kimi-k2-instruct
CLAUDE_APP_BETTER_AUTH_SECRET=<the same as BETTER_AUTH_SECRET>
CLAUDE_APP_BETTER_AUTH_URL=https://example.com
```