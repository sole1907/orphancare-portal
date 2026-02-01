import * as functions from "firebase-functions";
import * as admin from "firebase-admin";

interface DonorsRequest {
  page?: number;
  pageSize?: number;
  search?: string;
}

interface RecurringPlanInfo {
  planCode: string;
  amount: number;
  interval: "daily" | "monthly" | "quarterly" | "yearly";
  nextChargeAt: string;
}

interface DonorListItem {
  donorUid: string;
  name: string;
  email: string;
  totalAmount: number;
  donationCount: number;
  lastDonationAt: string | null;
  recurringPlan: RecurringPlanInfo | null;
}

interface DonorsListResponse {
  donors: DonorListItem[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export const getDonors = functions.region("europe-west1").https.onRequest(
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

      const body = req.body as DonorsRequest;
      const page = body.page ?? 1;
      const pageSize = body.pageSize ?? 10;
      const search = body.search?.toLowerCase() ?? "";

      const db = admin.firestore();
      let donorsList: DonorListItem[] = [];

      if (isSuperAdmin) {
        // Super Admin: Get all donors from /donors collection
        const donorsSnapshot = await db.collection("donors").get();

        for (const doc of donorsSnapshot.docs) {
          const donorData = doc.data();
          const donorUid = doc.id;
          const name = donorData.name ?? "";
          const email = donorData.email ?? "";

          // Apply search filter
          if (search && !name.toLowerCase().includes(search) && !email.toLowerCase().includes(search)) {
            continue;
          }

          // Get donation stats
          const donationsSnapshot = await db
            .collection("donations")
            .where("donorUid", "==", donorUid)
            .get();

          let totalAmount = 0;
          let donationCount = 0;
          let lastDonationAt: string | null = null;

          donationsSnapshot.docs.forEach((donationDoc) => {
            const donation = donationDoc.data();
            if (donation.status === "success") {
              totalAmount += donation.amount ?? 0;
              donationCount++;
              const createdAt = donation.createdAt?.toDate?.()?.toISOString?.();
              if (createdAt && (!lastDonationAt || createdAt > lastDonationAt)) {
                lastDonationAt = createdAt;
              }
            }
          });

          // Get active recurring plan
          const recurringPlansSnapshot = await db
            .collection("recurringPlans")
            .where("donorUid", "==", donorUid)
            .where("status", "==", "active")
            .limit(1)
            .get();

          let recurringPlan: RecurringPlanInfo | null = null;
          if (!recurringPlansSnapshot.empty) {
            const planData = recurringPlansSnapshot.docs[0].data();
            recurringPlan = {
              planCode: planData.planCode ?? "",
              amount: planData.amount ?? 0,
              interval: planData.interval ?? "monthly",
              nextChargeAt: planData.nextChargeAt?.toDate?.()?.toISOString?.() ?? "",
            };
          }

          donorsList.push({
            donorUid,
            name,
            email,
            totalAmount,
            donationCount,
            lastDonationAt,
            recurringPlan,
          });
        }
      } else if (isOrphanageAdmin && orphanageId) {
        // Orphanage Admin: Aggregate donors from donations to this orphanage
        const donationsSnapshot = await db
          .collection("donations")
          .where("orphanageId", "==", orphanageId)
          .get();

        const donorMap = new Map<string, {
          totalAmount: number;
          donationCount: number;
          lastDonationAt: string | null;
        }>();

        donationsSnapshot.docs.forEach((doc) => {
          const donation = doc.data();
          if (donation.status === "success" && donation.donorUid) {
            const donorUid = donation.donorUid;
            const existing = donorMap.get(donorUid) ?? {
              totalAmount: 0,
              donationCount: 0,
              lastDonationAt: null,
            };
            existing.totalAmount += donation.amount ?? 0;
            existing.donationCount++;
            const createdAt = donation.createdAt?.toDate?.()?.toISOString?.();
            if (createdAt && (!existing.lastDonationAt || createdAt > existing.lastDonationAt)) {
              existing.lastDonationAt = createdAt;
            }
            donorMap.set(donorUid, existing);
          }
        });

        // Get donor details for each unique donor
        for (const [donorUid, stats] of donorMap) {
          const donorDoc = await db.collection("donors").doc(donorUid).get();
          const donorData = donorDoc.data() ?? {};
          const name = donorData.name ?? "";
          const email = donorData.email ?? "";

          // Apply search filter
          if (search && !name.toLowerCase().includes(search) && !email.toLowerCase().includes(search)) {
            continue;
          }

          // Get active recurring plan for this orphanage
          const recurringPlansSnapshot = await db
            .collection("recurringPlans")
            .where("donorUid", "==", donorUid)
            .where("orphanageId", "==", orphanageId)
            .where("status", "==", "active")
            .limit(1)
            .get();

          let recurringPlan: RecurringPlanInfo | null = null;
          if (!recurringPlansSnapshot.empty) {
            const planData = recurringPlansSnapshot.docs[0].data();
            recurringPlan = {
              planCode: planData.planCode ?? "",
              amount: planData.amount ?? 0,
              interval: planData.interval ?? "monthly",
              nextChargeAt: planData.nextChargeAt?.toDate?.()?.toISOString?.() ?? "",
            };
          }

          donorsList.push({
            donorUid,
            name,
            email,
            totalAmount: stats.totalAmount,
            donationCount: stats.donationCount,
            lastDonationAt: stats.lastDonationAt,
            recurringPlan,
          });
        }
      }

      // Sort by totalAmount descending
      donorsList.sort((a, b) => b.totalAmount - a.totalAmount);

      // Apply pagination
      const total = donorsList.length;
      const totalPages = Math.ceil(total / pageSize);
      const startIndex = (page - 1) * pageSize;
      const paginatedDonors = donorsList.slice(startIndex, startIndex + pageSize);

      const response: DonorsListResponse = {
        donors: paginatedDonors,
        total,
        page,
        pageSize,
        totalPages,
      };

      res.status(200).json({ data: response });
    } catch (error) {
      console.error("Error in getDonors:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  }
);
