import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

export { getDonors } from "./getDonors";
export { getDonations } from "./getDonations";
