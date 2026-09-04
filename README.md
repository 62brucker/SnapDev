# SnapDev

SnapDev relays an iPhone screenshot over the local network to a browser in near real time:

`iOS Shortcut → binary HTTP upload → local Fastify agent → WebSocket → browser Blob URL`

The MVP has no database, cloud upload, filesystem image writes, Base64 conversion, accounts, or screenshot persistence.

## Requirements

- Node.js 20+
- pnpm 10+
- iPhone and computer on the same Wi-Fi

## Run locally

```bash
pnpm install
pnpm dev
```

Open `http://localhost:3000` for the public landing page and `http://localhost:3000/dashboard` for the live relay dashboard. The agent listens on `0.0.0.0:4177`. Use the displayed QR code and follow [shortcut/README.md](shortcut/README.md) to configure the iOS Shortcut.

If port or origin settings differ:

```bash
HOST=0.0.0.0 PORT=4177 WEB_ORIGIN=http://localhost:3000 pnpm --filter @snapdev/agent dev
NEXT_PUBLIC_AGENT_URL=http://localhost:4177 pnpm --filter @snapdev/web dev
```

Find the computer's LAN address with `ipconfig getifaddr en0` on macOS or `ipconfig` on Windows. Do not hardcode it in source.

## API

- `GET /api/health`
- `POST /api/sessions`
- `POST /api/capture` with a Bearer token, `image/png` or `image/jpeg`, and raw binary bytes
- `GET /ws?sessionId=...` (WebSocket upgrade)

Uploads are limited to 20 MB by default. Logs contain capture ID, byte size, MIME type, relay time, and delivery count—never screenshot content or tokens.

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

The browser keeps at most 10 captures in React memory, revokes object URLs when captures are removed, and loses all screenshots when the tab reloads or closes.
