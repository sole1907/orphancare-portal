// lib/donationsApi.ts
import { BACKEND_ENDPOINTS } from "./config";
import { auth } from "./firebase";
import { DonationsListRequest, DonationsListResponse } from "@/types/donation";

export async function fetchDonationsList(
  request: DonationsListRequest
): Promise<DonationsListResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getDonations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch donations: ${errorText}`);
  }

  const json = await res.json();
  return json.data;
}
