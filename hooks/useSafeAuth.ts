import { auth } from "../lib/firebase";
import { Auth } from "firebase/auth";

export function useSafeAuth(): Auth {
  if (!auth) {
    throw new Error("Firebase Auth is not initialized. Check SSR guards.");
  }
  return auth;
}
