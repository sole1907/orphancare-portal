import { useState, useEffect, useRef, useCallback } from "react";
import { collection, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Child } from "@/types/child";
import { db, storage, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "next/image";
import { getIdTokenResult } from "firebase/auth";
import { BACKEND_ENDPOINTS } from "@/lib/config";

interface ChildWithOrphanage extends Child {
  orphanageName?: string;
}

export default function ChildrenPage() {
  const [user] = useAuthState(auth);
  const [list, setList] = useState<ChildWithOrphanage[]>([]);
  const [form, setForm] = useState<Partial<Child>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [allHobbies, setAllHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchClaims = async () => {
      if (user) {
        const tokenResult = await getIdTokenResult(user);
        setClaims(tokenResult.claims);
      }
    };
    fetchClaims();
  }, [user]);

  useEffect(() => {
    const fetchHobbies = async () => {
      const snapshot = await getDocs(collection(db, "hobbies"));
      setAllHobbies(snapshot.docs.map((doc) => doc.data().name));
    };
    fetchHobbies();
  }, []);

  const isSuperAdmin = claims?.["superAdmin"] === true;
  const orphanageId = claims?.["orphanageId"] as string | undefined;

  // Fetch children from API
  const fetchChildrenFromApi = useCallback(
    async (cursor?: string | null, reset = false) => {
      if (!user) return;
      if (loading) return;

      setLoading(true);

      try {
        const token = await user.getIdToken();
        const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/getChildren`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            cursor: reset ? null : cursor,
            pageSize: 10,
          }),
        });

        if (!res.ok) {
          throw new Error("Failed to fetch children");
        }

        const json = await res.json();
        const data = json.data;

        if (reset) {
          setList(data.children);
        } else {
          setList((prev) => [...prev, ...data.children]);
        }
        setNextCursor(data.nextCursor);
        setHasMore(data.hasMore);
      } catch (error) {
        console.error("Error fetching children:", error);
      } finally {
        setLoading(false);
      }
    },
    [user, loading],
  );

  // Initial load
  useEffect(() => {
    if (user && claims !== null) {
      fetchChildrenFromApi(null, true);
    }
  }, [user, claims]);

  // Load more children
  const loadMore = () => {
    if (hasMore && nextCursor && !loading) {
      fetchChildrenFromApi(nextCursor, false);
    }
  };

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const storageRef = ref(storage, `children/${orphanageId}/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    setUploading(false);
    return url;
  };

  const saveChild = async () => {
    const newErrors: { [key: string]: boolean } = {
      name: !form.name,
      gender: !form.gender,
      birthday: !form.birthday,
      story: !form.story,
      photoUrl: !form.photoUrl,
    };

    setErrors(newErrors);

    if (Object.values(newErrors).some((v) => v)) {
      return;
    }

    if (!user) return;

    setSaving(true);

    try {
      const token = await user.getIdToken();
      const res = await fetch(`${BACKEND_ENDPOINTS.apiBaseUrl}/saveChild`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: editingId || undefined,
          name: form.name,
          gender: form.gender,
          birthday: form.birthday,
          story: form.story,
          photoUrl: form.photoUrl,
          hobbies: form.hobbies || [],
        }),
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(`Failed to save child: ${errorText}`);
      }

      setForm({});
      setEditingId(null);
      // Refresh the list
      fetchChildrenFromApi(null, true);
    } catch (error) {
      console.error("Error saving child:", error);
      alert("Failed to save child. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const addHobby = (hobby: string) => {
    const currentHobbies = form.hobbies || [];
    if (!currentHobbies.includes(hobby)) {
      setForm({ ...form, hobbies: [...currentHobbies, hobby] });
    }
    setHobbyInput("");
  };

  const removeHobby = (hobby: string) => {
    setForm({
      ...form,
      hobbies: form.hobbies?.filter((h) => h !== hobby),
    });
  };

  const calculateAge = (birthday: string) => {
    const birthDate = new Date(birthday);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const formatDate = (dateString: string) => {
    const d = new Date(dateString);

    const day = d.getDate();
    const month = d.toLocaleString("default", { month: "long" });
    const year = d.getFullYear();

    // Helper to add ordinal suffix
    const getOrdinal = (n: number) => {
      const suffixes = ["th", "st", "nd", "rd"];
      const v = n % 100;
      return suffixes[(v - 20) % 10] || suffixes[v] || suffixes[0];
    };

    return `${day}${getOrdinal(day)} of ${month}, ${year}`;
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Children</h2>

            {/* Form */}
            {!isSuperAdmin && (
              <div className="max-w-4xl bg-white rounded shadow p-6 mb-8 space-y-4">
                {Object.keys(errors).length > 0 && (
                  <p className="text-red-500 text-sm mb-4">
                    Please fill in all required fields marked with *
                  </p>
                )}
                <input
                  placeholder="Name *"
                  value={form.name || ""}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={`border rounded px-3 py-2 w-full ${
                    errors.name ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <select
                  value={form.gender || ""}
                  onChange={(e) => setForm({ ...form, gender: e.target.value })}
                  className={`border rounded px-3 py-2 w-full ${
                    errors.gender ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Gender *</option>
                  <option>Male</option>
                  <option>Female</option>
                </select>
                <input
                  type="date"
                  value={form.birthday || ""}
                  onChange={(e) =>
                    setForm({ ...form, birthday: e.target.value })
                  }
                  className={`border rounded px-3 py-2 w-full ${
                    errors.birthday ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Birthday *"
                />
                <textarea
                  placeholder="Story *"
                  value={form.story || ""}
                  onChange={(e) => setForm({ ...form, story: e.target.value })}
                  className={`border rounded px-3 py-2 w-full ${
                    errors.story ? "border-red-500" : "border-gray-300"
                  }`}
                />
                <div className="space-y-2">
                  {/* Input */}
                  <input
                    placeholder="Add hobbies"
                    value={hobbyInput}
                    onChange={(e) => setHobbyInput(e.target.value)}
                    className="border rounded px-3 py-2 w-full border-gray-300"
                  />

                  {/* Suggestions */}
                  {hobbyInput && (
                    <ul className="border rounded bg-white shadow max-h-40 overflow-y-auto">
                      {allHobbies
                        .filter((h) =>
                          h.toLowerCase().includes(hobbyInput.toLowerCase()),
                        )
                        .slice(0, 5)
                        .map((h) => (
                          <li
                            key={h}
                            className="px-3 py-1 cursor-pointer hover:bg-gray-100"
                            onClick={() => addHobby(h)}
                          >
                            {h}
                          </li>
                        ))}
                    </ul>
                  )}

                  {/* Selected tags */}
                  <div className="flex flex-wrap gap-2">
                    {form.hobbies?.map((hobby) => (
                      <span
                        key={hobby}
                        className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full flex items-center gap-1"
                      >
                        {hobby}
                        <button
                          onClick={() => removeHobby(hobby)}
                          className="text-red-500 hover:text-red-700"
                        >
                          ✕
                        </button>
                      </span>
                    ))}
                  </div>
                </div>
                <div
                  onDrop={async (e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (!file?.type.startsWith("image/")) {
                      setErrors({ ...errors, photoUrl: true });
                      return;
                    }
                    const url = await handleFileUpload(file);
                    setForm({ ...form, photoUrl: url });
                  }}
                  onDragOver={(e) => e.preventDefault()}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border rounded px-4 py-6 mb-4 text-center cursor-pointer ${
                    errors.photoUrl
                      ? "bg-red-50 border-red-500 text-red-600"
                      : "bg-gray-100 border-gray-300 hover:bg-gray-200"
                  }`}
                >
                  <p className="text-sm">
                    Drag and drop child photo here, or{" "}
                    <span className="underline">click to upload</span> *
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file?.type.startsWith("image/")) {
                        setErrors({ ...errors, photoUrl: true });
                        return;
                      }
                      const url = await handleFileUpload(file);
                      setForm({ ...form, photoUrl: url });
                    }}
                    className="hidden"
                  />
                </div>

                {/* Preview */}
                {form.photoUrl && (
                  <div className="mb-4">
                    <Image
                      src={form.photoUrl}
                      alt="Child preview"
                      width={128}
                      height={128}
                      className="rounded shadow object-cover"
                    />
                  </div>
                )}

                {uploading && (
                  <p className="text-sm text-blue-600">Uploading photo…</p>
                )}
                <div className="pt-4">
                  <button
                    onClick={saveChild}
                    disabled={uploading || saving}
                    className="bg-primary text-white px-4 py-2 rounded w-full hover:bg-sky-400 transition disabled:opacity-50"
                  >
                    {saving
                      ? "Saving..."
                      : editingId
                        ? "Update Child"
                        : "Add Child"}
                  </button>
                </div>
              </div>
            )}

            {/* Loading indicator */}
            {loading && list.length === 0 && (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            )}

            {/* List */}
            <ul className="space-y-6">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="bg-white rounded-lg shadow-sm hover:shadow-md transition border border-gray-100 p-5 flex items-start gap-5"
                >
                  {c.photoUrl && (
                    <Image
                      src={c.photoUrl}
                      alt={c.name}
                      width={80}
                      height={80}
                      className="rounded-full object-cover aspect-square border border-gray-300"
                    />
                  )}
                  <div className="flex-1 space-y-2">
                    <h4 className="text-lg font-semibold text-gray-800">
                      {c.name}
                    </h4>

                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Age:</span>{" "}
                      {calculateAge(c.birthday)} year old {c.gender}
                    </p>

                    <p className="text-sm text-gray-700">
                      <span className="font-medium">Birthday:</span>{" "}
                      {formatDate(c.birthday)}
                    </p>

                    <div className="text-sm text-gray-700 space-y-2 mt-2">
                      <p>
                        <span className="font-medium">Story:</span>
                      </p>
                      <p className="whitespace-pre-line">{c.story}</p>
                    </div>

                    {c.hobbies && (
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Hobbies:</span>{" "}
                        {c.hobbies.join(", ")}
                      </p>
                    )}

                    {isSuperAdmin && (
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Orphanage:</span>{" "}
                        {c.orphanageName}
                      </p>
                    )}
                  </div>

                  {!isSuperAdmin && (
                    <button
                      className="text-blue-600 text-sm hover:underline whitespace-nowrap"
                      onClick={() => {
                        setEditingId(c.id);
                        setForm(c);
                      }}
                    >
                      Edit
                    </button>
                  )}
                </li>
              ))}
            </ul>

            {hasMore && (
              <button
                onClick={loadMore}
                disabled={loading}
                className="mt-4 px-4 py-2 bg-primary text-white rounded hover:bg-sky-400 disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
