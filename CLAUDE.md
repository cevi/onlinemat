# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Onlinemat is a material/equipment lending management system for Cevi (Swiss youth organization). It's a React TypeScript SPA where departments ("Abteilungen") manage their material inventory, and members can place orders to borrow equipment. The UI is in German.

## Development Commands

```bash
# Prerequisites: Node.js 15.14.0 via nvm, yarn installed globally
nvm use 15.14.0

# Install dependencies
yarn

# Start dev server (http://localhost:3000)
yarn start

# Production build
yarn build

# Run tests
yarn test

# Serve production build locally
yarn serve
```

A `.env` file is required (copy `.env.example` and fill in secrets). Environment variables configure Firebase, Auth0, and Sentry.

## Tech Stack

- **React 17** with TypeScript, bootstrapped with Create React App (react-scripts 4.0.3)
- **Ant Design (antd)** for UI components
- **Firebase** (Firestore) as the backend/database — all domain data flows through real-time Firestore listeners (`onSnapshot`)
- **Auth0** for authentication, which issues a custom Firebase token for Firestore access
- **Redux** (with redux-actions/redux-thunk) — used only for user authentication state, not for domain data
- **CASL** for attribute-based access control (permissions)
- **react-cookie** for cart persistence
- **Sentry** for error tracking
- **SCSS modules** for styling

## Architecture

### Import Paths

`tsconfig.json` sets `baseUrl: "src"`, so imports are absolute from `src/` (e.g., `import { ability } from "config/casl/ability"`).

### Authentication Flow

Auth0 handles user login → issues a custom Firebase token (stored at `user["https://mat.cevi.tools/firebase_token"]`) → `App.tsx` calls `auth().signInWithCustomToken(token)` → Firebase auth state change triggers a Firestore listener on the user document → Redux store and CASL ability rules are updated.

### Data Flow Pattern

Domain data (materials, orders, categories, etc.) does NOT go through Redux. Instead, `AbteilungDetails` component sets up real-time Firestore `onSnapshot` listeners and distributes data via React Contexts:
- `AbteilungenContext` (from `NavigationMenu`) — list of all departments
- `MembersContext`, `CategorysContext`, `MaterialsContext`, `StandorteContext`, `MembersUserDataContext` (from `AbteilungDetails`) — per-department data

### Permission Model (CASL)

Two-tier access control defined in `util/UserPermission.ts`:
- **Staff users** (`user.staff === true`): full CRUD on all entities globally
- **Regular users**: role-based permissions per abteilung, stored in `user.roles[abteilungId]`

Roles (from most to least privileged): `admin` → `matchef` (material chief) → `member` → `guest` → `pending`

Components use `<Can I='action' this={{ __caslSubjectType__: 'Type', abteilungId }}>` to conditionally render based on permissions. Domain types include a `__caslSubjectType__` field for CASL subject detection.

### Firestore Collections

Collection paths are defined as constants in `src/config/firebase/collections.ts`. Top-level collections are `abteilungen` and `users`. Sub-collections under each abteilung: `materials`, `categories`, `members`, `orders`, `standorte`.

### Routing

Routes are defined in `src/routes.tsx` as `AppRoute` objects with metadata (icon, access flags: `public`, `private`, `staffOnly`, `showInMenue`). `NavigationMenu` filters visible routes based on auth state. Private routes use `ProtectedRoute` wrapper with Auth0's `withAuthenticationRequired`.

Key routes: `/abteilungen/:abteilungSlugOrId/:tab/:orderId` — the abteilung detail page is the main working area, with tabs for materials, members, groups, orders, settings, standorte, and categories.

### Business Logic

Utility modules in `src/util/` contain Firestore CRUD operations and business logic (e.g., `MaterialUtil.ts` handles material CRUD, keyword generation for search, availability calculations, batch import via Firestore transactions).

### Deployment

Auto-deployed via GitHub Actions on push to `master`. Builds a Docker container (Node 15 build stage → nginx serving stage) pushed to `registry.cevi.tools`.
