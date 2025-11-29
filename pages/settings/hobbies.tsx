import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Hobby } from "@/types/hobby";

export default function HobbiesPage() {
  const [list, setList] = useState<Hobby[]>([]);
  const [name, setName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchHobbies = async () => {
    const snapshot = await getDocs(collection(db, "hobbies"));
    setList(
      snapshot.docs.map((doc) => ({
        ...(doc.data() as Omit<Hobby, "id">),
        id: doc.id,
      }))
    );
  };

  useEffect(() => {
    const run = async () => {
      await fetchHobbies();
    };
    run();
  }, []);

  const saveHobby = async () => {
    if (!name.trim()) {
      setError("Please enter a hobby name.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "hobbies", editingId), {
          name,
          updatedAt: serverTimestamp(),
        });
      } else {
        const exists = list.some(
          (h) => h.name.toLowerCase() === name.toLowerCase()
        );
        if (exists) {
          setError("This hobby already exists.");
          setSaving(false);
          return;
        }
        await addDoc(collection(db, "hobbies"), {
          name,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      setName("");
      setEditingId(null);
      setError("");
      await fetchHobbies();
    } finally {
      setSaving(false);
    }
  };

  const deleteHobby = async (id: string) => {
    await deleteDoc(doc(db, "hobbies", id));
    fetchHobbies();
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Manage Hobbies</h2>

            {/* Form */}
            <div className="max-w-lg bg-white rounded shadow p-6 mb-8 space-y-4">
              <input
                placeholder="Hobby name *"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`border rounded px-3 py-2 w-full ${
                  error ? "border-red-500" : "border-gray-300"
                }`}
              />
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <button
                onClick={saveHobby}
                disabled={saving}
                className="bg-primary text-white px-4 py-2 rounded w-full hover:bg-sky-400 transition disabled:opacity-50"
              >
                {editingId ? "Update Hobby" : "Add Hobby"}
              </button>
            </div>

            {/* List */}
            <ul className="space-y-2 max-w-lg">
              {list.map((h) => (
                <li
                  key={h.id}
                  className="bg-white rounded shadow px-4 py-3 flex justify-between items-center"
                >
                  <span className="font-medium">{h.name}</span>
                  <div className="space-x-3">
                    <button
                      className="text-blue-600 text-sm hover:underline"
                      onClick={() => {
                        setEditingId(h.id);
                        setName(h.name);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 text-sm hover:underline"
                      onClick={() => deleteHobby(h.id)}
                    >
                      Delete
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
