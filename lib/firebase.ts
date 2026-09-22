import { initializeApp, getApps } from "firebase/app";
import { connectAuthEmulator, getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { resolveEmulatorUseForClient } from "./emulatorGuard";

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!,
};


// Prevent re-init during hot reloads
const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

// Opt-in local dev flag (set NEXT_PUBLIC_USE_FIREBASE_EMULATOR=true in
// .env.local) so `npm run dev` can point at the Auth + Data Connect
// emulators instead of the live project. Guarded against Fast Refresh
// re-running this module and reconnecting an already-started emulator.
//
// PORT 9199, NOT 9099. These must match firebase.json, and they are
// deliberately offset from the Time Tracker Pro template this app was cloned
// from (9099/9399) so both can run at once. Pointing at the default would
// silently attach this app to that project's emulator — same shape of data,
// completely different account.
declare global {
  var __authEmulatorConnected: boolean | undefined;
}

// Guarded the same way as the server (see lib/emulatorGuard.ts). A build
// that reaches real users must never point the browser at 127.0.0.1, and a
// client/server disagreement about emulator mode produces exactly the
// "invalid signature" failure this guard exists to prevent: the browser
// mints an unsigned emulator token that the real backend then rejects.
if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !globalThis.__authEmulatorConnected) {
  const emulator = resolveEmulatorUseForClient({
    host: "127.0.0.1:9199",
    nodeEnv: process.env.NODE_ENV,
    varName: "NEXT_PUBLIC_USE_FIREBASE_EMULATOR",
  });
  if (emulator.use) {
    connectAuthEmulator(auth, "http://127.0.0.1:9199", { disableWarnings: true });
    globalThis.__authEmulatorConnected = true;
  }
}
