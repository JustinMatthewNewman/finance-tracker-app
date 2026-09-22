import { connectDataConnectEmulator, getDataConnect } from "firebase/data-connect";
import { connectorConfig } from "@/src/dataconnect-generated";
import "@/lib/firebase"; // ensures the default Firebase app exists before getDataConnect runs
import { resolveEmulatorUseForClient } from "./emulatorGuard";

// Companion to lib/firebase.ts's Auth emulator wiring: same opt-in flag
// points the generated Data Connect hooks at the local emulator instead of
// the live Cloud SQL-backed service. Import this once for its side effect
// before any generated query/mutation hook runs (see app/providers.tsx).
//
// PORT 9499, NOT 9399 — must match firebase.json. See the note in
// lib/firebase.ts on why these are offset from the source template's.
declare global {
  var __dataConnectEmulatorConnected: boolean | undefined;
}

if (process.env.NEXT_PUBLIC_USE_FIREBASE_EMULATOR === "true" && !globalThis.__dataConnectEmulatorConnected) {
  // Same guard as lib/firebase.ts — see lib/emulatorGuard.ts.
  const emulator = resolveEmulatorUseForClient({
    host: "127.0.0.1:9499",
    nodeEnv: process.env.NODE_ENV,
    varName: "NEXT_PUBLIC_USE_FIREBASE_EMULATOR",
  });
  if (emulator.use) {
    const dc = getDataConnect(connectorConfig);
    connectDataConnectEmulator(dc, "127.0.0.1", 9499);
    globalThis.__dataConnectEmulatorConnected = true;
  }
}
