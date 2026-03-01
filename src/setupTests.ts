import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

// Mock Firebase Auth to prevent "auth/invalid-api-key" errors in CI
// where no .env with valid Firebase credentials exists.
// getAuth() validates the API key at init time; all other Firebase
// services (Firestore, Functions) accept undefined config silently.
vi.mock('firebase/auth', () => ({
  getAuth: vi.fn(() => ({})),
  connectAuthEmulator: vi.fn(),
}));
