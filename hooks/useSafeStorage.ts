import { storage } from "../lib/firebase";
import { FirebaseStorage } from "firebase/storage";

export function useSafeStorage(): FirebaseStorage {
  if (!storage) {
    throw new Error(
      "Firebase Storage is not initialized. Check SSR guards or Firebase config."
    );
  }
  return storage;
}
