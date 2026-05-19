# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Fan Favour is a full-stack content/subscription platform. Users browse and subscribe to models, purchase content, chat in real-time, and manage subscriptions. The app has two separate codebases: a Next.js frontend (`client/`) and an Express.js backend (`server/`).

## Development Commands

### Client (Next.js frontend)
```bash
cd client
yarn install          # Install dependencies (Yarn 4.9 with PnP)
yarn dev              # Dev server on port 3001 (Turbopack)
yarn build            # Production build
yarn lint             # ESLint
```

### Server (Express.js backend)
```bash
cd server
npm install           # Install dependencies
npm run dev           # Dev server on port 4000 (nodemon)
```

### Prerequisites
- MongoDB running locally on default port (27017)
- Redis running locally
- Both `client/.env` and `server/.env` must be configured

## Architecture

### Client (`client/`)

**Framework**: Next.js 16 with App Router, React 19, JavaScript (no TypeScript).

**Path alias**: `@/*` maps to `./src/*` (configured in `jsconfig.json`).

**Key directories**:
- `src/app/` — Next.js App Router pages and components
- `src/app/action/` — API call functions (axios-based, organized by domain: auth, chat, payment, etc.)
- `src/app/Layout/` — Shared layout components (modals, wrappers)
- `src/app/form/` — Reusable form components
- `src/components/ui/` — shadcn/ui components (New York style, Lucide icons)
- `store/` — Redux Toolkit store with 17 slices in `store/slices/`

**State management**: Redux Toolkit. The store wraps the entire app via `ReduxProvider` in `layout.js`. Key slices: `authSlice` (user session/roles), `chatSlice` (messaging state), `modelSlice` (model listings), `socketSlice` (WebSocket connection).

**Styling**: Tailwind CSS v4 + shadcn/ui + styled-components. Theme color is `#1a0033` (dark purple). Component config in `components.json`.

**App initialization flow** (`layout.js`):
1. `ReduxProvider` wraps entire app
2. `ClientRoot` sets up client-side context
3. `GlobalWrapper` provides global state
4. `AuthInitializer` fetches user session on mount
5. `Navbar` + page content rendered inside `Suspense`

**API calls**: All in `src/app/action/` — use axios with Bearer token from localStorage. Base URL from `NEXT_PUBLIC_API_BASE_URL` env var.

### Server (`server/`)

**Framework**: Express.js 5 with ES Modules (`"type": "module"`).

**Key directories**:
- `routes/` — Route definitions (mounted under `/v1/`)
- `controller/` — Route handlers
- `middleware/` — Auth middleware, request context
- `sockets/` — Socket.io event handlers
- `redis/` — Redis client configuration
- `validation/` — Joi validation schemas
- `helper/` — Business logic helpers
- `logger/` — Winston with daily rotating log files

**API structure**: All routes under `/v1/` prefix. Key route groups: auth, chat, payment, crypto, subscription, blog, sso, message, model.

**External integrations**: Services API (universal login system), SendGrid (email), Sentry (error tracking), CCBill (payments).

### Authentication

Multi-tier auth system:
1. Login request goes to backend → backend validates against external "Services" API
2. Backend returns JWT (SSO token prefixed with `ff_`)
3. Client stores token in localStorage, sets in axios Authorization header
4. `AuthInitializer` component restores session on page load
5. Role-based access: admin, model, content_manager, support, sub_admin

### Real-time Communication

Socket.io connects from client (`socket.io-client`) to server. Connection managed via `socketSlice` in Redux. Socket handlers in `server/sockets/SocketManager.js`. Redis used for pub/sub messaging between services.
