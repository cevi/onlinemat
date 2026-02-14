# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Onlinemat is a material/equipment lending management system for Cevi (Swiss youth organization). It's a React TypeScript SPA where departments ("Abteilungen") manage their material inventory, and members can place orders to borrow equipment. The UI is in German.

## Development Commands

```bash
# Prerequisites: Node.js 24 LTS via nvm, yarn installed globally
nvm use 24

# Install dependencies
yarn

# Start dev server (http://localhost:3000)
yarn dev

# Production build
yarn build

# Preview production build
yarn preview

# Run tests
yarn test
```

A `.env` file is required (copy `.env.example` and fill in secrets). Environment variables use the `VITE_` prefix (e.g. `VITE_FIREBASE_API_KEY`).

## Tech Stack

- **React 18** with TypeScript 5, built with **Vite**
- **Ant Design (antd) 5** for UI components (CSS-in-JS, no global CSS import)
- **Firebase 10** (modular API) as the backend — all domain data flows through real-time Firestore listeners (`onSnapshot`)
- **Auth0** (`@auth0/auth0-react` v2) for authentication, which issues a custom Firebase token for Firestore access
- **Redux** (with redux-actions/redux-thunk) — used only for user authentication state, not for domain data
- **CASL** for attribute-based access control (permissions)
- **dayjs** for date handling (with `de-ch` locale, `isSameOrBefore` and `localizedFormat` plugins)
- **react-cookie** for cart persistence
- **Sentry** v8 for error tracking
- **SCSS modules** for styling

## Architecture

### Import Paths

`tsconfig.json` sets `baseUrl: "src"`, so imports are absolute from `src/` (e.g., `import { ability } from "config/casl/ability"`). Vite resolves these via `vite-tsconfig-paths`.

### Authentication Flow

Auth0 handles user login → issues a custom Firebase token (stored at `user["https://mat.cevi.tools/firebase_token"]`) → `App.tsx` calls `signInWithCustomToken(auth, token)` → Firebase auth state change triggers a Firestore listener on the user document → Redux store and CASL ability rules are updated.

### Data Flow Pattern

Domain data (materials, orders, categories, etc.) does NOT go through Redux. Instead, `AbteilungDetails` component sets up real-time Firestore `onSnapshot` listeners and distributes data via React Contexts:
- `AbteilungenContext` (from `NavigationMenu`) — list of all departments
- `MembersContext`, `CategorysContext`, `MaterialsContext`, `StandorteContext`, `MembersUserDataContext` (from `AbteilungDetails`) — per-department data

### Firebase Modular API

All Firebase calls use the modular (tree-shakeable) API:
```ts
import { collection, doc, onSnapshot, updateDoc, deleteDoc } from 'firebase/firestore'
import { db } from 'config/firebase/firebase'
```
Collection path constants are in `src/config/firebase/collections.ts`.

### Permission Model (CASL)

Two-tier access control defined in `util/UserPermission.ts`:
- **Staff users** (`user.staff === true`): full CRUD on all entities globally
- **Regular users**: role-based permissions per abteilung, stored in `user.roles[abteilungId]`

Roles (from most to least privileged): `admin` → `matchef` (material chief) → `member` → `guest` → `pending`

Components use `<Can I='action' this={{ __caslSubjectType__: 'Type', abteilungId }}>` to conditionally render based on permissions.

### Routing

Routes are defined in `src/routes.tsx` as `AppRoute` objects with metadata (icon, access flags: `public`, `private`, `staffOnly`, `showInMenue`). `NavigationMenu` filters visible routes based on auth state. Private routes use `ProtectedRoute` wrapper with Auth0's `withAuthenticationRequired`.

### Deployment

Auto-deployed via GitHub Actions on push to `master`. Builds a Docker container (Node 24 build stage → nginx serving stage) pushed to `registry.cevi.tools`.
