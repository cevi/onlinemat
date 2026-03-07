import { clearEmulatorData } from './helpers/emulator';

async function globalTeardown() {
    await clearEmulatorData().catch(() => {
        // Emulators may already be stopped; ignore errors
    });
}

export default globalTeardown;
