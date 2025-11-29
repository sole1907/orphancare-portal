import { useState, useEffect, useRef } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  doc,
  query,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Child } from "@/types/child";
import { db, storage, auth } from "@/lib/firebase";
import { useAuthState } from "react-firebase-hooks/auth";
import Image from "next/image";
import { getIdTokenResult } from "firebase/auth";

export default function ChildrenPage() {
  const [user] = useAuthState(auth);
  const [list, setList] = useState<Child[]>([]);
  const [form, setForm] = useState<Partial<Child>>({});
  const [editingId, setEditingId] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [claims, setClaims] = useState<Record<string, unknown> | null>(null);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [allHobbies, setAllHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");

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

  const fetchChildren = async () => {
    const q = isSuperAdmin
      ? query(collection(db, "children"))
      : query(
          collection(db, "children"),
          where("orphanageId", "==", orphanageId)
        );

    const snapshot = await getDocs(q);
    setList(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Child, "id">),
      }))
    );
  };

  useEffect(() => {
    if (!claims) return;
    const run = async () => {
      await fetchChildren();
    };
    run();
  }, [claims]);

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

    if (editingId) {
      await updateDoc(doc(db, "children", editingId), {
        ...form,
        updatedAt: serverTimestamp(),
      });
    } else {
      await addDoc(collection(db, "children"), {
        ...form,
        orphanageId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    }

    setForm({});
    setEditingId(null);
    fetchChildren();
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

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Children</h2>

            {/* Form */}
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
                onChange={(e) => setForm({ ...form, birthday: e.target.value })}
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
                        h.toLowerCase().includes(hobbyInput.toLowerCase())
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
                  if (e.dataTransfer.files?.[0]) {
                    const url = await handleFileUpload(e.dataTransfer.files[0]);
                    setForm({ ...form, photoUrl: url });
                  }
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
                    if (file) {
                      const url = await handleFileUpload(file);
                      setForm({ ...form, photoUrl: url });
                    }
                  }}
                  className="hidden"
                />
              </div>
              {uploading && (
                <p className="text-sm text-blue-600">Uploading photo…</p>
              )}

              <div className="pt-4">
                <button
                  onClick={saveChild}
                  disabled={uploading}
                  className="bg-primary text-white px-4 py-2 rounded w-full hover:bg-sky-400 transition disabled:opacity-50"
                >
                  {editingId ? "Update Child" : "Add Child"}
                </button>
              </div>
            </div>

            {/* List */}
            <ul className="space-y-4">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="bg-white rounded shadow p-4 flex items-center gap-4"
                >
                  {c.photoUrl && (
                    <Image
                      src={c.photoUrl}
                      alt={c.name}
                      width={64}
                      height={64}
                      className="rounded-full object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <h4 className="font-semibold">{c.name}</h4>
                    <p className="text-sm text-gray-600">
                      {calculateAge(c.birthday)} years old {c.gender}
                    </p>
                    <p className="text-sm text-gray-600">
                      Birthday: {new Date(c.birthday).toLocaleDateString()}
                    </p>
                    <p className="text-sm text-gray-700 mt-1">{c.story}</p>
                    {c.hobbies && (
                      <p className="text-sm text-gray-600 mt-1">
                        Hobbies: {c.hobbies.join(", ")}
                      </p>
                    )}
                    {isSuperAdmin && (
                      <p className="text-xs text-gray-500">
                        Orphanage: {c.orphanageName}
                      </p>
                    )}
                  </div>
                  <button
                    className="text-blue-600 text-sm hover:underline"
                    onClick={() => {
                      setEditingId(c.id);
                      setForm(c);
                    }}
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
