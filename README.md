# ThreadAI

Real-time team chat for B2B workspaces. Channels, threads, reactions, and AI assistance in one place.

ThreadAI is a Slack-style collaboration app: multi-tenant workspaces, live presence, rich-text messaging, and AI that rewrites drafts and summarizes threads.

> Early preview (`0.1.0`). The product is usable locally; marketing pages and production realtime hosting are still incomplete.

## Features

- **Workspaces** — Multi-tenant organizations via Kinde. Switch orgs, create workspaces, invite members.
- **Channels** — Named channels per workspace, unique by `(workspaceId, name)`.
- **Messaging** — TipTap rich-text composer, image attachments, author-only edits, cursor pagination.
- **Threads** — Replies nested under a parent message (one level).
- **Reactions** — Emoji toggle, unique per user and message.
- **Realtime** — Presence and live message/reaction updates over Cloudflare Durable Objects.
- **AI** — Compose assistant (rewrite a draft as Markdown) and thread summaries.
- **Security** — Kinde session auth, Arcjet bot/WAF/rate-limit/PII protection.

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Next.js 16 (App Router), React 19, TypeScript |
| UI | Tailwind CSS 4, shadcn/ui, Radix, TipTap |
| API | oRPC at `/rpc`, TanStack Query |
| Database | PostgreSQL + Prisma 7 |
| Auth / billing | Kinde Auth + Kinde Management API |
| AI | Vercel AI SDK + OpenRouter |
| Uploads | UploadThing |
| Realtime | PartyServer / PartySocket on Cloudflare Durable Objects |
| Security | Arcjet |

Workspaces and memberships live in **Kinde** (organizations). Channels, messages, and reactions live in **Postgres**.

## Architecture

```
Browser
  ├─ Next.js UI  ──oRPC──►  /rpc  ──► Prisma (Postgres)
  │                         └──► Kinde Management API
  └─ PartySocket ──────────► Wrangler worker (Durable Object `Chat`)
```

- `workspaceId` in the URL is the Kinde `org_code`.
- Presence room: `workspace-{workspaceId}`
- Channel room: `channel-{channelId}`
- Thread room: `thread-{threadId}`

The Next app currently connects to the realtime worker at `http://localhost:8787`. Change that host before deploying.

## Prerequisites

- Node.js 20+
- [pnpm](https://pnpm.io)
- PostgreSQL
- [Kinde](https://kinde.com) application (Auth + Management API)
- [OpenRouter](https://openrouter.ai) API key
- [UploadThing](https://uploadthing.com) token
- [Arcjet](https://arcjet.com) key
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) (included as a dev dependency)

## Getting started

```bash
git clone https://github.com/tdgarciaa/ThreadAI.git
cd ThreadAI
pnpm install
cp .env.example .env
```

Fill in `.env` (see [Environment variables](#environment-variables)). Then:

```bash
pnpm exec prisma generate
pnpm exec prisma db push
```

Run the Next.js app (port **3002**):

```bash
pnpm dev
```

In a second terminal, run the realtime worker (port **8787**):

```bash
pnpm exec wrangler dev
```

Open [http://localhost:3002](http://localhost:3002).

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Next.js dev server on port 3002 |
| `pnpm build` | Production build |
| `pnpm start` | Start the production server |
| `pnpm lint` | ESLint |

Prisma and Wrangler are not wired as npm scripts; use `pnpm exec prisma …` and `pnpm exec wrangler …`.

## Environment variables

Copy `.env.example` and set:

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | PostgreSQL connection string |
| `KINDE_CLIENT_ID` | Kinde Auth application |
| `KINDE_CLIENT_SECRET` | Kinde Auth application |
| `KINDE_ISSUER_URL` | Kinde issuer |
| `KINDE_SITE_URL` | App origin (`http://localhost:3002` locally) |
| `KINDE_POST_LOGIN_REDIRECT_URL` | After login (`/workspace`) |
| `KINDE_POST_LOGOUT_REDIRECT_URL` | After logout |
| `KINDE_DOMAIN` | Kinde Management API domain |
| `KINDE_MANAGEMENT_CLIENT_ID` | Management API M2M client |
| `KINDE_MANAGEMENT_CLIENT_SECRET` | Management API M2M secret |
| `ARCJET_KEY` | Arcjet |
| `LLM_API_KEY` | OpenRouter |
| `UPLOADTHING_TOKEN` | UploadThing |

Never commit `.env`. `.env.example` is safe to commit.

### Kinde notes

- Register creates an organization (`My workspace`) and attaches Kinde’s `organization_plans` pricing table.
- Configure allowed callback / logout URLs for `http://localhost:3002`.
- The Management API client needs permission to create organizations, list users, and invite members.

## Project structure

```
app/
  (marketing)/          Public landing page
  (dashboard)/workspace Authenticated chat UI
  router/               oRPC procedures
  rpc/                  HTTP handler for /rpc
  api/auth/             Kinde Auth catch-all
  api/uploadthing/      UploadThing
  middlewares/          Auth, workspace, Arcjet
components/             UI, TipTap editor, AI elements
lib/                    Prisma, oRPC clients, Arcjet, Query
providers/              Channel / thread realtime
hooks/                  Presence, uploads
prisma/schema.prisma    Channel, Message, MessageReaction
realtime/index.ts       Cloudflare Durable Object chat server
schemas/                Zod schemas
```

## Data model

Postgres (Prisma) stores:

- **Channel** — `name`, `workspaceId`, `createdById`; unique `(workspaceId, name)`
- **Message** — rich-text `content`, optional `imageUrl`, denormalized author fields, optional `threadId` (parent message)
- **MessageReaction** — `emoji` + user fields; unique `(messageId, userId, emoji)`

Users, workspaces, roles, and billing are not in Postgres. They are Kinde organizations and users.

## API (oRPC)

All procedures are served from `/rpc`:

| Procedure | Role |
| --- | --- |
| `workspace.list` / `workspace.create` | List and create orgs |
| `workspace.member.list` / `workspace.member.invite` | Members and invites |
| `channel.create` / `channel.list` / `channel.get` | Channels |
| `message.create` / `message.list` / `message.update` | Messages |
| `message.reaction.toggle` | Reactions |
| `message.thread.list` | Thread replies |
| `ai.compose.generate` | Rewrite a draft |
| `ai.thread.summary.generate` | Summarize a thread |

Writes are rate-limited more tightly than reads. AI endpoints also deny PII and use a lower request cap.

## App routes

| Path | Description |
| --- | --- |
| `/` | Marketing landing |
| `/workspace` | Redirects into the current org |
| `/workspace/[workspaceId]` | Channel list or empty state |
| `/workspace/[workspaceId]/channel/[channelId]` | Channel chat + optional thread sidebar |
| `/api/auth/[kindeAuth]` | Kinde Auth |
| `/api/uploadthing` | Image uploads |
| `/rpc/*` | oRPC |

## Deployment

Two services:

1. **Next.js app** — Node host such as Vercel. Set the env vars above. Allow the production origin in Kinde and UploadThing.
2. **Realtime worker** — `wrangler.jsonc` worker `threadai-chat-realtime` (`realtime/index.ts`, Durable Object class `Chat`). Deploy with Wrangler to Cloudflare.

Until the PartySocket `host` in the presence and realtime providers points at the deployed worker, live updates only work against local Wrangler (`localhost:8787`).

Next.js image config already allows UploadThing, Vercel avatars, GitHub, and Google avatar hosts.

## Status

This is an early codebase. Expect unfinished marketing links, a stub workspace index page, and a hardcoded local realtime host. Contributions and issues: [github.com/tdgarciaa/ThreadAI](https://github.com/tdgarciaa/ThreadAI).
