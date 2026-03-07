/**
 * MSW request handlers for testing.
 *
 * Add mock handlers for Firebase callable functions, external APIs, etc.
 * These handlers intercept network requests during tests so that
 * components can be tested without real backend calls.
 */
import { http, HttpResponse } from 'msw';

export const handlers = [
  // Example: Mock a Firebase callable function
  // http.post('*/createOrder', () => {
  //   return HttpResponse.json({ result: { id: 'test-order', pending: false } });
  // }),
];
