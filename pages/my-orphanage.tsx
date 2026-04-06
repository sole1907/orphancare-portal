import { useEffect, useState } from "react";
import { collection, query, where, getDocs } from "firebase/firestore";
import { useAuthState } from "react-firebase-hooks/auth";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Orphanage } from "@/types/orphanage";
import { auth, db, storage } from "@/lib/firebase";
import Image from "next/image";
import { UserCircleIcon } from "@heroicons/react/24/solid";
import PDFThumbnail from "@/components/PDFThumbnail";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, updateDoc } from "firebase/firestore";

export default function MyOrphanagePage() {
  const [user] = useAuthState(auth);
  const [orphanage, setOrphanage] = useState<Orphanage | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const fetchOrphanage = async () => {
      if (!user) return;
      const token = await user.getIdTokenResult();
      const orphanageId = token.claims.orphanageId;
      const q = query(
        collection(db, "orphanages"),
        where("__name__", "==", orphanageId)
      );
      const snapshot = await getDocs(q);
      if (!snapshot.empty) {
        setOrphanage({
          id: snapshot.docs[0].id,
          ...(snapshot.docs[0].data() as Omit<Orphanage, "id">),
        });
      }
    };
    fetchOrphanage();
  }, [user]);

  const handleLogoUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (!event.target.files?.length || !orphanage) return;

    const file = event.target.files[0];
    const storageRef = ref(
      storage,
      `orphanageLogos/${orphanage.id}/${file.name}`
    );

    // Upload file
    try {
      setUploading(true);
      await uploadBytes(storageRef, file);

      // Get URL
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore doc
      await updateDoc(doc(db, "orphanages", orphanage.id), {
        logoUrl: downloadURL,
      });

      // Update local state so UI refreshes immediately
      setOrphanage({ ...orphanage, logoUrl: downloadURL });
    } catch (err) {
      console.error("Upload failed:", err);
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin"]}>
      <div className="min-h-screen bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">My Orphanage</h2>
            {orphanage ? (
              <div className="bg-white rounded-lg shadow-lg max-w-3xl overflow-hidden">
                {/* Header with logo + status */}
                <div className="flex items-center bg-blue-50 p-6">
                  {uploading ? (
                    <div className="w-20 h-20 flex items-center justify-center rounded-full border-2 border-blue-200 bg-gray-100">
                      <svg
                        className="animate-spin h-6 w-6 text-blue-400"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        ></circle>
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        ></path>
                      </svg>
                    </div>
                  ) : orphanage.logoUrl ? (
                    <div className="relative w-20 h-20">
                      <Image
                        src={orphanage.logoUrl}
                        alt="Orphanage Logo"
                        fill
                        className="rounded-full border-2 border-blue-200 object-contain"
                      />
                    </div>
                  ) : (
                    <UserCircleIcon className="w-20 h-20 text-blue-300" />
                  )}
                  <div className="ml-4">
                    <h3 className="text-2xl font-bold text-blue-900">
                      {orphanage.name}
                    </h3>
                    <span
                      className={`inline-block mt-2 px-3 py-1 text-sm rounded-full ${
                        orphanage.status === "Active"
                          ? "bg-green-100 text-green-700"
                          : "bg-yellow-100 text-yellow-800"
                      }`}
                    >
                      {orphanage.status}
                    </span>
                  </div>
                  <label className="ml-auto text-sm text-blue-600 hover:underline cursor-pointer">
                    Edit Logo
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleLogoUpload}
                    />
                  </label>
                </div>

                {/* Details */}
                <div className="p-6 space-y-3 text-gray-700">
                  <p>
                    <strong>Contact Name:</strong> {orphanage.contactName}
                  </p>
                  <p>
                    <strong>Email:</strong> {orphanage.email}
                  </p>
                  <p>
                    <strong>Phone:</strong> {orphanage.phone}
                  </p>
                  <p>
                    <strong>Address:</strong> {orphanage.address}
                  </p>
                  <p>
                    <strong>Registration #:</strong>{" "}
                    {orphanage.registrationNumber}
                  </p>

                  {/* Metrics */}
                  <p>
                    <strong>Children supported:</strong>{" "}
                    {orphanage.childrenCount ?? "—"}
                  </p>
                  <p>
                    <strong>Last update:</strong>{" "}
                    {orphanage.lastUpdate
                      ? new Date(
                          orphanage.lastUpdate.seconds * 1000
                        ).toLocaleDateString()
                      : "—"}
                  </p>
                  <p>
                    <strong>Funding progress:</strong>{" "}
                    {orphanage.fundingProgress
                      ? `${orphanage.fundingProgress}%`
                      : "—"}
                  </p>

                  {/* Registration document preview */}
                  {orphanage.registrationDocUrl && (
                    <div className="mt-4">
                      <strong>Registration Document:</strong>
                      <div className="mt-2">
                        {orphanage.registrationDocMimeType ===
                        "application/pdf" ? (
                          <div className="text-center">
                            <PDFThumbnail
                              url={orphanage.registrationDocUrl}
                              scale={0.2}
                              className="inline-block border rounded p-1"
                            />
                            <a
                              href={orphanage.registrationDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm mt-2 block"
                            >
                              View full PDF
                            </a>
                          </div>
                        ) : (
                          <div className="text-center">
                            <Image
                              src={orphanage.registrationDocUrl}
                              alt="Registration Document"
                              width={200}
                              height={150}
                              className="object-contain rounded shadow inline-block"
                            />
                            <a
                              href={orphanage.registrationDocUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 underline text-sm mt-2 block"
                            >
                              View full image
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <p>Loading orphanage info...</p>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
