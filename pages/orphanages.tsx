import { useState, useEffect, useCallback, useRef } from "react";
import { db, storage } from "../lib/firebase";
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
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import Image from "next/image";
import {
  Orphanage,
  OrphanageForm,
  OrphanageFormField,
} from "../types/orphanage";
import { BACKEND_ENDPOINTS } from "../lib/config";

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

  const fetchOrphanages = useCallback(async () => {
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
  }, [lastDoc]);

  useEffect(() => {
    void (async () => {
      await fetchOrphanages();
    })();
  }, [fetchOrphanages]);

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

    window.localStorage.setItem("emailForSignIn", form.email);

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
                    <div className="relative w-full max-w-[300px] h-auto">
                      <Image
                        src={form.registrationDocUrl}
                        alt="Registration Document"
                        fill
                        className="object-contain rounded shadow"
                        style={{ maxHeight: "8rem" }}
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

            <ul className="space-y-2">
              {list.map((o) => (
                <li
                  key={o.id}
                  className="bg-white rounded shadow px-4 py-3 border"
                >
                  <div className="font-semibold">{o.name}</div>
                  <div className="text-sm text-gray-600">{o.email}</div>
                  <div className="text-sm text-gray-500">{o.status}</div>
                  {o.registrationDocUrl && (
                    <div className="mt-2">
                      {o.registrationDocUrl.endsWith(".pdf") ? (
                        <iframe
                          src={o.registrationDocUrl}
                          title="PDF Preview"
                          className="w-full h-48 border rounded"
                        />
                      ) : (
                        <Image
                          src={o.registrationDocUrl}
                          alt="Document"
                          fill
                          className="object-contain"
                          style={{ maxHeight: "12rem" }}
                        />
                      )}
                    </div>
                  )}
                  <button
                    className="text-blue-600 text-sm mt-2"
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
                </li>
              ))}
            </ul>

            {hasMore && (
              <button
                className="mt-6 bg-gray-200 px-4 py-2 rounded hover:bg-gray-300 transition"
                onClick={fetchOrphanages}
              >
                Load More
              </button>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
