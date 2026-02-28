// lib/donationsApi.ts
import { BACKEND_ENDPOINTS } from "./config";
import { auth } from "./firebase";
import { DonationsListRequest, DonationsListResponse, DonationListItem } from "@/types/donation";

interface ApiDonationItem {
  donationId: string;
  donorName: string;
  donorEmail: string;
  orphanageName?: string;
  amount: number;
  netAmount: number;
  tipAmount: number;
  paystackFee: number;
  status: "pending" | "success" | "failed";
  recurring: boolean;
  createdAt: string;
  childId?: string;
  childName?: string;
  childPhoto?: string;
  childGender?: string;
  childStory?: string;
}

function transformDonation(item: ApiDonationItem): DonationListItem {
  const donation: DonationListItem = {
    donationId: item.donationId,
    donorName: item.donorName,
    donorEmail: item.donorEmail,
    orphanageName: item.orphanageName,
    amount: item.amount,
    netAmount: item.netAmount,
    tipAmount: item.tipAmount,
    paystackFee: item.paystackFee,
    status: item.status,
    recurring: item.recurring,
    createdAt: item.createdAt,
  };

  if (item.childId && item.childName) {
    donation.child = {
      childId: item.childId,
      childName: item.childName,
      photoUrl: item.childPhoto,
      gender: item.childGender,
      story: item.childStory,
    };
  }

  return donation;
}

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
  const data = json.data;

  return {
    donations: data.donations.map(transformDonation),
    total: data.total,
    page: data.page,
    pageSize: data.pageSize,
    totalPages: data.totalPages,
  };
}
