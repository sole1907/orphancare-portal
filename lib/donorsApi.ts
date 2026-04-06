// lib/donorsApi.ts
import { BACKEND_ENDPOINTS } from "./config";
import { auth } from "./firebase";
import { DonorsListRequest, DonorsListResponse } from "@/types/donor";

export async function fetchDonorsList(
  request: DonorsListRequest
): Promise<DonorsListResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error("Not authenticated");

  const token = await user.getIdToken();

  const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getDonors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(request),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch donors: ${errorText}`);
  }

  const json = await res.json();
  return json.data;
}
