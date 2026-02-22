/**
 * MSW server for use in Vitest tests.
 *
 * Import and start this server in test setup or individual test files:
 *
 *   import { server } from 'mocks/server';
 *   beforeAll(() => server.listen());
 *   afterEach(() => server.resetHandlers());
 *   afterAll(() => server.close());
 */
import { setupServer } from 'msw/node';
import { handlers } from './handlers';

export const server = setupServer(...handlers);
