import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

type DonationStatus = "pending" | "success" | "failed";

interface DonationsRequest {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: DonationStatus | "all";
  startDate?: string;
  endDate?: string;
}

interface DonationListItem {
  donationId: string;
  donorName: string;
  donorEmail: string;
  orphanageName?: string;
  amount: number;
  netAmount: number;
  tipAmount: number;
  paystackFee: number;
  status: DonationStatus;
  recurring: boolean;
  createdAt: string;
}

interface DonationsListResponse {
  donations: DonationListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getDonations = functions.region("europe-west1").https.onRequest(
  async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({ error: "Method not allowed" });
      return;
    }

    // Verify authentication
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      res.status(401).json({ error: "Unauthorized" });
      return;
    }

    const idToken = authHeader.split("Bearer ")[1];

    try {
      const decodedToken = await admin.auth().verifyIdToken(idToken);
      const claims = decodedToken;
      const isSuperAdmin = claims.superAdmin === true;
      const isOrphanageAdmin = claims.orphanageAdmin === true;
      const orphanageId = claims.orphanageId as string | undefined;

      if (!isSuperAdmin && !isOrphanageAdmin) {
        res.status(403).json({ error: "Access denied" });
        return;
      }

      const body = req.body as DonationsRequest;
      const page = body.page ?? 1;
      const pageSize = body.pageSize ?? 10;
      const search = body.search?.toLowerCase() ?? "";
      const statusFilter = body.status ?? "all";
      const startDate = body.startDate ? new Date(body.startDate) : null;
      const endDate = body.endDate ? new Date(body.endDate) : null;

      const db = admin.firestore();
      let donationsQuery: admin.firestore.Query = db.collection("donations");

      // Filter by orphanageId for orphanage admins
      if (isOrphanageAdmin && orphanageId) {
        donationsQuery = donationsQuery.where("orphanageId", "==", orphanageId);
      }

      const donationsSnapshot = await donationsQuery.get();

      // Cache for donor and orphanage data to reduce reads
      const donorCache = new Map<string, { name: string; email: string }>();
      const orphanageCache = new Map<string, string>();

      const donationsList: DonationListItem[] = [];

      for (const doc of donationsSnapshot.docs) {
        const donation = doc.data();
        const donationId = doc.id;

        // Apply status filter
        const donationStatus = donation.status as DonationStatus;
        if (statusFilter !== "all" && donationStatus !== statusFilter) {
          continue;
        }

        // Apply date range filter
        const createdAt = donation.createdAt?.toDate?.();
        if (createdAt) {
          if (startDate && createdAt < startDate) {
            continue;
          }
          if (endDate) {
            const endOfDay = new Date(endDate);
            endOfDay.setHours(23, 59, 59, 999);
            if (createdAt > endOfDay) {
              continue;
            }
          }
        }

        // Get donor info
        const donorUid = donation.donorUid as string;
        let donorName = "";
        let donorEmail = "";

        if (donorUid) {
          if (donorCache.has(donorUid)) {
            const cached = donorCache.get(donorUid)!;
            donorName = cached.name;
            donorEmail = cached.email;
          } else {
            const donorDoc = await db.collection("donors").doc(donorUid).get();
            const donorData = donorDoc.data();
            donorName = donorData?.name ?? "";
            donorEmail = donorData?.email ?? "";
            donorCache.set(donorUid, { name: donorName, email: donorEmail });
          }
        }

        // Apply search filter
        if (search && !donorName.toLowerCase().includes(search) && !donorEmail.toLowerCase().includes(search)) {
          continue;
        }

        // Get orphanage name for super admin
        let orphanageName: string | undefined;
        if (isSuperAdmin && donation.orphanageId) {
          const donationOrphanageId = donation.orphanageId as string;
          if (orphanageCache.has(donationOrphanageId)) {
            orphanageName = orphanageCache.get(donationOrphanageId);
          } else {
            const orphanageDoc = await db.collection("orphanages").doc(donationOrphanageId).get();
            const orphanageData = orphanageDoc.data();
            orphanageName = orphanageData?.name ?? "";
            orphanageCache.set(donationOrphanageId, orphanageName!);
          }
        }

        const amount = donation.amount ?? 0;
        const tipAmount = donation.tipAmount ?? 0;
        const paystackFee = donation.paystackFee ?? 0;
        const netAmount = donation.netAmount ?? (amount - tipAmount - paystackFee);

        donationsList.push({
          donationId,
          donorName,
          donorEmail,
          orphanageName,
          amount,
          netAmount,
          tipAmount,
          paystackFee,
          status: donationStatus,
          recurring: donation.recurring ?? false,
          createdAt: createdAt?.toISOString?.() ?? "",
        });
      }

      // Sort by createdAt descending (most recent first)
      donationsList.sort((a, b) => {
        if (!a.createdAt) return 1;
        if (!b.createdAt) return -1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });

      // Apply pagination
      const total = donationsList.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedDonations = donationsList.slice(startIndex, startIndex + pageSize);

      const response: DonationsListResponse = {
        donations: paginatedDonations,
        total,
        page,
        pageSize,
        totalPages,
      };

      res.status(200).json({ data: response });
    } catch (error) {
      console.error("Error in getDonations:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
