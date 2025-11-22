import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  limit,
  startAfter,
  serverTimestamp,
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import {
  Orphanage,
  OrphanageForm,
  OrphanageFormField,
} from "@/types/orphanage";
import { BACKEND_ENDPOINTS } from "@/lib/config";
import { db, storage } from "@/lib/firebase";
import { PhoneIcon, EnvelopeIcon } from "@heroicons/react/24/solid";

export default function OrphanagesPage() {
  const MAX_FILE_SIZE_MB = 5;
  const ALLOWED_TYPES = [
    "image/jpeg",
    "image/png",
    "image/gif",
    "application/pdf",
  ];

  const [form, setForm] = useState<OrphanageForm>({
    name: "",
    contactName: "",
    email: "",
    phone: "",
    address: "",
    registrationNumber: "",
    registrationDocUrl: "",
  });

  const [errors, setErrors] = useState<
    Partial<Record<OrphanageFormField, boolean>>
  >({});
  const [list, setList] = useState<Orphanage[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [uploading, setUploading] = useState(false);

  const fields: OrphanageFormField[] = [
    "name",
    "contactName",
    "email",
    "phone",
    "address",
    "registrationNumber",
  ];

  const friendlyPlaceholders: Record<OrphanageFormField, string> = {
    name: "Orphanage Name",
    contactName: "Contact Name",
    email: "Contact Email",
    phone: "Phone Number",
    address: "Address",
    registrationNumber: "Registration Number",
    registrationDocUrl: "Registration Document URL",
  };

  const fetchOrphanages = async () => {
    const baseQuery = query(collection(db, "orphanages"), limit(10));
    const paginatedQuery = lastDoc
      ? query(baseQuery, startAfter(lastDoc))
      : baseQuery;

    const snapshot = await getDocs(paginatedQuery);
    const docs = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as Omit<Orphanage, "id">),
    }));
    setList((prev) => [...prev, ...docs]);
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] || null);
    setHasMore(snapshot.docs.length === 10);
  };

  useEffect(() => {
    fetchOrphanages();
  }, []);

  const validateForm = () => {
    const newErrors: Partial<Record<OrphanageFormField, boolean>> = {};
    fields.forEach((field) => {
      if (!form[field].trim()) newErrors[field] = true;
    });
    if (!form.registrationDocUrl.trim()) {
      newErrors.registrationDocUrl = true;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const newOrphanage: Omit<Orphanage, "id"> = {
      ...form,
      createdAt: serverTimestamp(),
      status: "Pending",
    };

    const ref = await addDoc(collection(db, "orphanages"), newOrphanage);
    setForm({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      registrationNumber: "",
      registrationDocUrl: "",
    });
    setList([]);
    setLastDoc(null);
    fetchOrphanages();

    // window.localStorage.setItem("emailForSignIn", form.email);

    await fetch(BACKEND_ENDPOINTS.inviteOrphanageAdmin, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, orphanageId: ref.id }),
    });
  };

  const handleUpdate = async () => {
    if (!editingId || !validateForm()) return;
    await updateDoc(doc(db, "orphanages", editingId), form);
    setEditingId(null);
    setForm({
      name: "",
      contactName: "",
      email: "",
      phone: "",
      address: "",
      registrationNumber: "",
      registrationDocUrl: "",
    });
    setList([]);
    setLastDoc(null);
    fetchOrphanages();
  };

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFileUpload(file);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleFileUpload = async (file: File) => {
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Only image or PDF files are allowed.");
      return;
    }

    if (file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      alert("File size must be under 5MB.");
      return;
    }

    setUploading(true);
    try {
      const storageRef = ref(
        storage,
        `registrationDocs/${Date.now()}_${file.name}`
      );
      await uploadBytes(storageRef, file);
      const url = await getDownloadURL(storageRef);
      setForm((prev) => ({ ...prev, registrationDocUrl: url }));
    } catch (err) {
      console.error(err);
      alert("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Orphanages</h2>

            <div className="bg-white rounded shadow p-6 mb-8 max-w-3xl">
              <h3 className="text-lg font-semibold mb-4">
                {editingId ? "Edit Orphanage" : "Add Orphanage"}
              </h3>

              {Object.keys(errors).length > 0 && (
                <p className="text-red-500 text-sm mb-4">
                  Please fill in all required fields marked with *
                </p>
              )}

              {fields.map((field) => (
                <div key={field}>
                  <input
                    className={`border ${
                      errors[field] ? "border-red-500" : "border-gray-300"
                    } rounded px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 ${
                      errors[field]
                        ? "focus:ring-red-500"
                        : "focus:ring-primary"
                    }`}
                    placeholder={`${friendlyPlaceholders[field]} *`}
                    value={form[field]}
                    onChange={(e) =>
                      setForm({ ...form, [field]: e.target.value })
                    }
                  />
                  {field === "registrationNumber" && (
                    <div
                      onDrop={handleDrop}
                      onDragOver={handleDragOver}
                      onClick={() => fileInputRef.current?.click()}
                      className={`border rounded px-4 py-6 mb-4 text-center cursor-pointer ${
                        errors.registrationDocUrl
                          ? "bg-red-50 border-red-500 text-red-600"
                          : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      <p className="text-sm">
                        Drag and drop registration document here, or{" "}
                        <span className="underline">click to upload</span> *
                      </p>
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        ref={fileInputRef}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleFileUpload(file);
                        }}
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              ))}

              {uploading && (
                <p className="text-sm text-gray-500 mb-2">
                  Uploading document…
                </p>
              )}

              {form.registrationDocUrl && (
                <div className="preview-container mb-4 flex justify-center">
                  {form.registrationDocUrl.endsWith(".pdf") ? (
                    <iframe
                      src={form.registrationDocUrl}
                      title="PDF Preview"
                      className="w-full max-w-[600px] h-64 border rounded"
                    />
                  ) : (
                    <div className="relative w-full max-w-[300px] h-32">
                      <Image
                        src={form.registrationDocUrl}
                        alt="Registration Document"
                        fill
                        className="object-contain rounded shadow"
                      />
                    </div>
                  )}
                </div>
              )}

              <div className="mt-4">
                <button
                  className="bg-primary text-white px-4 py-2 rounded w-full sm:w-auto"
                  onClick={editingId ? handleUpdate : handleSubmit}
                  disabled={uploading}
                >
                  {editingId ? "Update" : "Add"}
                </button>
              </div>
            </div>

            {/* Orphanage List */}
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {list.map((o) => (
                <div
                  key={o.id}
                  className="bg-white rounded shadow p-6 flex flex-col xl:flex-row items-start"
                >
                  {/* Left side: donor info + metrics */}
                  <div className="flex-1 pr-6">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-xl font-semibold mb-2">{o.name}</h4>{" "}
                      <span
                        className={`inline-block px-2 py-1 text-xs rounded ${
                          o.status === "Pending"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {o.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-1">{o.address}</p>
                    <div className="flex items-center gap-6 text-sm text-gray-600 mt-2">
                      <a
                        href={`tel:${o.phone}`}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <PhoneIcon className="h-4 w-4 text-gray-400" />
                        {o.phone}
                      </a>
                      <a
                        href={`mailto:${o.email}`}
                        className="flex items-center gap-1 hover:underline"
                      >
                        <EnvelopeIcon className="h-4 w-4 text-gray-400" />
                        {o.email}
                      </a>
                    </div>
                    {/* Metrics */}
                    <div className="mt-3 space-y-1 text-sm text-gray-700">
                      <p>Children supported: {o.childrenCount ?? "—"}</p>
                      <p>
                        Last update:{" "}
                        {o.lastUpdate
                          ? new Date(
                              o.lastUpdate.seconds * 1000
                            ).toLocaleDateString()
                          : "—"}
                      </p>
                      <p>
                        Funding progress:{" "}
                        {o.fundingProgress ? `${o.fundingProgress}%` : "—"}
                      </p>
                    </div>
                    {/* Admin controls */}
                    <div className="mt-4">
                      <button
                        className="text-primary hover:underline text-sm"
                        onClick={() => {
                          setEditingId(o.id);
                          setForm({
                            name: o.name,
                            contactName: o.contactName,
                            email: o.email,
                            phone: o.phone,
                            address: o.address,
                            registrationNumber: o.registrationNumber,
                            registrationDocUrl: o.registrationDocUrl || "",
                          });
                        }}
                      >
                        Edit
                      </button>
                    </div>
                  </div>

                  {/* Right side: thumbnail */}
                  {o.registrationDocUrl && (
                    <div className="w-64 h-40 flex-shrink-0">
                      {o.registrationDocUrl.endsWith(".pdf") ? (
                        <iframe
                          src={o.registrationDocUrl}
                          title="PDF Preview"
                          className="w-full h-full border rounded"
                        />
                      ) : (
                        <div className="relative w-full h-full">
                          <Image
                            src={o.registrationDocUrl}
                            alt="Registration Document"
                            fill
                            className="object-cover rounded shadow"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* Load More */}
            {hasMore && (
              <div className="flex justify-center mt-6">
                <button
                  onClick={fetchOrphanages}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Load More
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
