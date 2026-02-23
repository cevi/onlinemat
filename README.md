# Onlinemat

## Getting started

### First installation

1. Install [node.js version management](https://github.com/coreybutler/nvm-windows)
2. Execute `nvm install 24`
3. Execute `nvm use 24`
4. Execute `npm i yarn -g` --> Installs yarn globally.
5. Execute `yarn` --> Installs all dependencies.

### Start the application

1. Execute: `yarn dev` --> Runs the app in the development mode.
2. Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

The page will reload if you make edits.

Happy Coding!

### Run tests

**Framework**: [Vitest](https://vitest.dev/) (configured in `vite.config.ts`)

```bash
yarn test             # watch mode
yarn test:run         # single run (CI-friendly)
yarn test:coverage    # single run with coverage report (output: ./coverage)
```

Tests live in `__tests__/` directories next to the source they test:

```
src/util/__tests__/CartUtil.test.ts          — cart cookie operations
src/util/__tests__/MaterialUtil.test.ts      — keyword generation, availability calculations
src/util/__tests__/UserPermission.test.ts    — CASL permission rules for all roles
src/util/__tests__/OrderUtil.test.ts         — order weight calculations
src/config/casl/__tests__/ability.integration.test.ts  — multi-abteilung role scoping
src/hooks/__tests__/useFirestoreCollection.test.ts     — Firestore snapshot hook
```

### Run E2E tests

**Framework**: [Playwright](https://playwright.dev/) (config: `playwright.config.ts`, tests: `e2e/`)

E2E tests run against the Firebase emulator for Firestore and Auth data, with Auth0 mocked at the network level.

#### Prerequisites

1. Install Playwright browsers (first time only):
   ```bash
   npx playwright install chromium
   ```

2. Start the Firebase emulators (in a separate terminal):
   ```bash
   cd ../onlinemat-config
   npx firebase emulators:start --only auth,firestore
   ```
   This starts the Auth emulator on port 9099 and Firestore emulator on port 8080. You can view the emulator UI at http://localhost:4000.

#### Running the tests

```bash
yarn test:e2e           # run all E2E tests
yarn test:e2e:headed    # run with visible browser window
yarn test:e2e:ui        # interactive Playwright UI (useful for debugging)
```

You can also run a specific test file:
```bash
npx playwright test e2e/smoke.spec.ts
```

After a test run, view the HTML report with:
```bash
npx playwright show-report
```

#### How it works

- The Playwright config (`playwright.config.ts`) auto-starts the Vite dev server with emulator environment variables
- `global-setup.ts` checks that the Firebase emulators are running and seeds test data (users, departments, materials)
- Auth0 is mocked via Playwright route interception and localStorage injection — no real Auth0 calls are made
- Tests run serially (single worker) since they share the emulator state

### CI/CD

Tests run automatically on push/PR to `dev` and `master` via GitHub Actions. Deployments are gated — tests must pass before the Docker build proceeds.

### FAQ

**The Application won't start**
Don't forget to create the `.env` file with all the keys and values in it.
Copy the `.env.example` file to `.env` and add the missing secrets.
Note: environment variables use the `VITE_` prefix (e.g. `VITE_FIREBASE_API_KEY`).
To get the `.env` values for the dev instance, please contact onlinemat@cevi.tools

**Where is the backend?**
For the backend we use Firebase. It's a NoSQL database provided by Google.

**How do I deploy the application?**
The application is auto deployed using a GitHub Action.
The action is triggered when a new commit is pushed to the `master` branch. It builds the docker container(s) and pushes
them to the [Private Container Registry](registry.cevi.tools). The container is then deployed to
the [Swarm Cluster](swarm.cevi.tools). All configs are stored in
the [Cevi Tools Infrastructure registry](https://github.com/cevi/cevi-tools-infrastructure).
