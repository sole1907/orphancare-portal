import { useState, useEffect, useRef, useCallback } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  getDoc,
  serverTimestamp,
  onSnapshot,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Child } from "@/types/child";
import { Update } from "@/types/update";
import { db, storage, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import { getIdTokenResult } from "firebase/auth";
import Image from "next/image";
import { BACKEND_ENDPOINTS } from "@/lib/config";

export default function UpdatesPage() {
  const [user] = useAuthState(auth);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [childId, setChildId] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Data
  const [children, setChildren] = useState<Child[]>([]);
  const [updates, setUpdates] = useState<Update[]>([]);
  const [orphanages, setOrphanages] = useState<{ id: string; name: string }[]>(
    []
  );
  const [selectedOrphanageFilter, setSelectedOrphanageFilter] = useState("");

  // Child search state
  const [childSearchQuery, setChildSearchQuery] = useState("");
  const [showChildDropdown, setShowChildDropdown] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const childSearchRef = useRef<HTMLDivElement>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Fetch claims
  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        const tokenResult = await getIdTokenResult(user);
        setClaims(tokenResult.claims);
      }
    };
    fetchClaims();
  }, [user]);

  const isSuperAdmin = claims?.["superAdmin"] === true;
  const isOrphanageAdmin = claims?.["orphanageAdmin"] === true;
  const orphanageId = claims?.["orphanageId"] as string | undefined;

  // Fetch orphanage info for the current admin
  const [currentOrphanage, setCurrentOrphanage] = useState<{
    name: string;
    logoUrl?: string;
  } | null>(null);

  useEffect(() => {
    const fetchOrphanage = async () => {
      if (orphanageId) {
        const orphanageDoc = await getDoc(doc(db, "orphanages", orphanageId));
        if (orphanageDoc.exists()) {
          setCurrentOrphanage({
            name: orphanageDoc.data().name || "",
            logoUrl: orphanageDoc.data().logoUrl,
          });
        }
      }
    };
    fetchOrphanage();
  }, [orphanageId]);

  // Fetch children from API (handles decryption server-side)
  const fetchChildrenFromApi = useCallback(async () => {
    if (!user || (!orphanageId && !isSuperAdmin)) return;

    setLoadingChildren(true);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getChildren`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cursor: null,
          pageSize: 500, // Fetch all children for search
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to fetch children");
      }

      const json = await res.json();
      setChildren(json.data.children);
    } catch (error) {
      console.error("Error fetching children:", error);
    } finally {
      setLoadingChildren(false);
    }
  }, [user, orphanageId, isSuperAdmin]);

  useEffect(() => {
    if (user && claims !== null) {
      fetchChildrenFromApi();
    }
  }, [user, claims, fetchChildrenFromApi]);

  // Filter children based on search query
  const filteredChildren = children.filter((child) =>
    child.name?.toLowerCase().includes(childSearchQuery.toLowerCase())
  );

  // Get selected child name for display
  const selectedChild = children.find((c) => c.id === childId);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        childSearchRef.current &&
        !childSearchRef.current.contains(event.target as Node)
      ) {
        setShowChildDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle child selection
  const handleSelectChild = (child: Child | null) => {
    if (child) {
      setChildId(child.id);
      setChildSearchQuery(child.name || "");
    } else {
      setChildId("");
      setChildSearchQuery("");
    }
    setShowChildDropdown(false);
  };

  // Fetch orphanages list for super admin filter
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchOrphanages = async () => {
      const snapshot = await getDocs(collection(db, "orphanages"));
      setOrphanages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
        }))
      );
    };
    fetchOrphanages();
  }, [isSuperAdmin]);

  // Fetch updates with real-time listener
  useEffect(() => {
    if (!orphanageId && !isSuperAdmin) return;

    let q;
    if (isSuperAdmin) {
      q = selectedOrphanageFilter
        ? query(
            collection(db, "updates"),
            where("orphanageId", "==", selectedOrphanageFilter),
            orderBy("createdAt", "desc")
          )
        : query(collection(db, "updates"), orderBy("createdAt", "desc"));
    } else {
      q = query(
        collection(db, "updates"),
        where("orphanageId", "==", orphanageId),
        orderBy("createdAt", "desc")
      );
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUpdates(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          ...(doc.data() as Omit<Update, "id">),
        }))
      );
    });

    return unsubscribe;
  }, [orphanageId, isSuperAdmin, selectedOrphanageFilter]);

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (!orphanageId) return "";
    setUploading(true);
    const timestamp = Date.now();
    const storageRef = ref(
      storage,
      `updateImages/${orphanageId}/${timestamp}_${file.name}`
    );
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setUploading(false);
    return url;
  };

  // Submit update
  const submitUpdate = async () => {
    if (!title.trim() || !body.trim()) {
      alert("Please fill in title and body");
      return;
    }
    if (!orphanageId || !currentOrphanage) {
      alert("Orphanage information not available");
      return;
    }

    setSubmitting(true);

    // Get child info if selected
    let childName: string | undefined;
    let childPhotoUrl: string | undefined;
    if (childId) {
      const selectedChild = children.find((c) => c.id === childId);
      if (selectedChild) {
        childName = selectedChild.name;
        childPhotoUrl = selectedChild.photoUrl;
      }
    }

    const updateData = {
      title,
      body,
      childId: childId || null,
      childName: childName || null,
      childPhotoUrl: childPhotoUrl || null,
      imageUrl: imageUrl || null,
      orphanageId,
      orphanageName: currentOrphanage.name,
      orphanageLogoUrl: currentOrphanage.logoUrl || null,
      updatedAt: serverTimestamp(),
    };

    try {
      if (editingId) {
        await updateDoc(doc(db, "updates", editingId), updateData);
      } else {
        await addDoc(collection(db, "updates"), {
          ...updateData,
          createdAt: serverTimestamp(),
        });
      }

      // Reset form
      setTitle("");
      setBody("");
      setChildId("");
      setChildSearchQuery("");
      setImageUrl("");
      setEditingId(null);
    } catch (error) {
      console.error("Error saving update:", error);
      alert("Failed to save update");
    } finally {
      setSubmitting(false);
    }
  };

  // Delete update
  const handleDelete = async (updateId: string) => {
    if (!confirm("Are you sure you want to delete this update?")) return;

    try {
      await deleteDoc(doc(db, "updates", updateId));
    } catch (error) {
      console.error("Error deleting update:", error);
      alert("Failed to delete update");
    }
  };

  // Edit update
  const handleEdit = (update: Update) => {
    setTitle(update.title);
    setBody(update.body);
    setChildId(update.childId || "");
    // Set the search query to show the child's name when editing
    if (update.childId) {
      const child = children.find((c) => c.id === update.childId);
      setChildSearchQuery(child?.name || update.childName || "");
    } else {
      setChildSearchQuery("");
    }
    setImageUrl(update.imageUrl || "");
    setEditingId(update.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Cancel edit
  const cancelEdit = () => {
    setTitle("");
    setBody("");
    setChildId("");
    setChildSearchQuery("");
    setImageUrl("");
    setEditingId(null);
  };

  // Format date
  const formatDate = (date: Update["createdAt"]) => {
    if (!date) return "";
    const d = date instanceof Date ? date : date.toDate();
    return d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin", "superAdmin"]}>
      <div className="min-h-screen bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">
              {isSuperAdmin ? "Manage Updates" : "Post Updates"}
            </h2>

            {/* Create/Edit Form - Only for orphanage admins */}
            {isOrphanageAdmin && (
              <div className="bg-white rounded shadow p-6 max-w-2xl mb-8">
                <h3 className="text-lg font-semibold mb-4">
                  {editingId ? "Edit Update" : "Create New Update"}
                </h3>

                <input
                  className="border border-gray-300 rounded px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="Title *"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                />

                <textarea
                  className="border border-gray-300 rounded px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                  rows={4}
                  placeholder="Body *"
                  value={body}
                  onChange={(e) => setBody(e.target.value)}
                />

                {/* Child Search Field */}
                <div ref={childSearchRef} className="relative mb-4">
                  <div className="flex gap-2">
                    <div className="flex-1 relative">
                      <input
                        type="text"
                        className="border border-gray-300 rounded px-4 py-2 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                        placeholder={
                          loadingChildren
                            ? "Loading children..."
                            : "Search for a child (optional)"
                        }
                        value={childSearchQuery}
                        onChange={(e) => {
                          setChildSearchQuery(e.target.value);
                          setShowChildDropdown(true);
                          if (e.target.value === "") {
                            setChildId("");
                          }
                        }}
                        onFocus={() => setShowChildDropdown(true)}
                        disabled={loadingChildren}
                      />
                      {selectedChild && (
                        <button
                          type="button"
                          onClick={() => handleSelectChild(null)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Selected child indicator */}
                  {selectedChild && (
                    <div className="mt-2 flex items-center gap-2 text-sm text-green-700 bg-green-50 px-3 py-2 rounded">
                      {selectedChild.photoUrl && (
                        <Image
                          src={selectedChild.photoUrl}
                          alt={selectedChild.name || "Child"}
                          width={24}
                          height={24}
                          className="rounded-full object-cover"
                        />
                      )}
                      <span>Selected: {selectedChild.name}</span>
                    </div>
                  )}

                  {/* Dropdown results */}
                  {showChildDropdown && childSearchQuery && (
                    <ul className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-y-auto">
                      {filteredChildren.length === 0 ? (
                        <li className="px-4 py-2 text-gray-500">
                          No children found
                        </li>
                      ) : (
                        filteredChildren.slice(0, 20).map((child) => (
                          <li
                            key={child.id}
                            onClick={() => handleSelectChild(child)}
                            className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                          >
                            {child.photoUrl && (
                              <Image
                                src={child.photoUrl}
                                alt={child.name || "Child"}
                                width={32}
                                height={32}
                                className="rounded-full object-cover"
                              />
                            )}
                            <span>{child.name}</span>
                          </li>
                        ))
                      )}
                      {filteredChildren.length > 20 && (
                        <li className="px-4 py-2 text-gray-500 text-sm">
                          Type more to narrow results...
                        </li>
                      )}
                    </ul>
                  )}

                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty for a general update not specific to any child
                  </p>
                </div>

                {/* Image Upload */}
                <div
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file?.type.startsWith("image/")) {
                      alert("Please upload an image file");
                      return;
                    }
                    const url = await handleFileUpload(file);
                    setImageUrl(url);
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className="border border-gray-300 rounded px-4 py-6 mb-4 text-center cursor-pointer bg-gray-50 hover:bg-gray-100"
                >
                  <p className="text-sm text-gray-600">
                    {uploading
                      ? "Uploading..."
                      : "Drag and drop image here, or click to upload (optional)"}
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file?.type.startsWith("image/")) {
                        alert("Please upload an image file");
                        return;
                      }
                      const url = await handleFileUpload(file);
                      setImageUrl(url);
                    }}
                    className="hidden"
                  />
                </div>

                {/* Image Preview */}
                {imageUrl && (
                  <div className="mb-4 relative inline-block">
                    <Image
                      src={imageUrl}
                      alt="Update preview"
                      width={200}
                      height={150}
                      className="rounded shadow object-cover"
                    />
                    <button
                      onClick={() => setImageUrl("")}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 text-sm hover:bg-red-600"
                    >
                      ✕
                    </button>
                  </div>
                )}

                <div className="flex gap-2">
                  <button
                    className="bg-primary text-white px-4 py-2 rounded hover:bg-sky-500 transition disabled:opacity-50"
                    onClick={submitUpdate}
                    disabled={submitting || uploading}
                  >
                    {submitting
                      ? "Saving..."
                      : editingId
                      ? "Update"
                      : "Post Update"}
                  </button>
                  {editingId && (
                    <button
                      className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                      onClick={cancelEdit}
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Filter for Super Admin */}
            {isSuperAdmin && (
              <div className="mb-6">
                <select
                  className="border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                  value={selectedOrphanageFilter}
                  onChange={(e) => setSelectedOrphanageFilter(e.target.value)}
                >
                  <option value="">All Orphanages</option>
                  {orphanages.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Updates List */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold">
                {isSuperAdmin ? "All Updates" : "Your Updates"}
              </h3>

              {updates.length === 0 ? (
                <p className="text-gray-500">No updates yet.</p>
              ) : (
                <ul className="space-y-4">
                  {updates.map((update) => (
                    <li
                      key={update.id}
                      className="bg-white rounded-lg shadow p-5 border border-gray-100"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          {/* Header */}
                          <div className="flex items-center gap-3 mb-2">
                            {update.orphanageLogoUrl ? (
                              <Image
                                src={update.orphanageLogoUrl}
                                alt={update.orphanageName}
                                width={40}
                                height={40}
                                className="rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center text-gray-500">
                                🏠
                              </div>
                            )}
                            <div>
                              <p className="font-semibold">
                                {update.orphanageName}
                              </p>
                              <p className="text-xs text-gray-500">
                                {formatDate(update.createdAt)}
                              </p>
                            </div>
                          </div>

                          {/* Content */}
                          <h4 className="text-lg font-semibold mb-1">
                            {update.title}
                          </h4>
                          <p className="text-gray-700 whitespace-pre-line mb-3">
                            {update.body}
                          </p>

                          {/* Image */}
                          {update.imageUrl && (
                            <div className="mb-3">
                              <Image
                                src={update.imageUrl}
                                alt="Update image"
                                width={400}
                                height={300}
                                className="rounded-lg object-cover"
                              />
                            </div>
                          )}

                          {/* Child badge */}
                          {update.childId && update.childName && (
                            <div className="flex items-center gap-2 text-sm text-blue-600 bg-blue-50 px-3 py-1 rounded-full inline-flex">
                              {update.childPhotoUrl && (
                                <Image
                                  src={update.childPhotoUrl}
                                  alt={update.childName}
                                  width={24}
                                  height={24}
                                  className="rounded-full object-cover"
                                />
                              )}
                              <span>About: {update.childName}</span>
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 ml-4">
                          {/* Edit - only for orphanage admin's own updates */}
                          {isOrphanageAdmin &&
                            update.orphanageId === orphanageId && (
                              <button
                                onClick={() => handleEdit(update)}
                                className="text-blue-600 text-sm hover:underline"
                              >
                                Edit
                              </button>
                            )}
                          {/* Delete - orphanage admin for own, super admin for any */}
                          {(isSuperAdmin ||
                            (isOrphanageAdmin &&
                              update.orphanageId === orphanageId)) && (
                            <button
                              onClick={() => handleDelete(update.id)}
                              className="text-red-600 text-sm hover:underline"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
