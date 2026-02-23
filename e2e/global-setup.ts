import { checkEmulatorsRunning, clearEmulatorData, seedTestData } from './helpers/emulator';

async function globalSetup() {
    const running = await checkEmulatorsRunning();
    if (!running) {
        throw new Error(
            'Firebase emulators are not running. Start them with:\n' +
            '  cd onlinemat-config && npx firebase emulators:start --only auth,firestore'
        );
    }

    // Clear any stale data and seed fresh test data
    await clearEmulatorData();
    await seedTestData();
}

export default globalSetup;
