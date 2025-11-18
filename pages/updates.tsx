import { useState, useEffect } from "react";
import { collection, addDoc, getDocs } from "firebase/firestore";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { Child } from "@/types/child";
import { db } from "@/lib/firebase";

export default function UpdatesPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [childId, setChildId] = useState("");
  const [children, setChildren] = useState<Child[]>([]);

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, "children"));
    setChildren(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Child, "id">),
      }))
    );
  };

  const submitUpdate = async () => {
    if (!title.trim() || !body.trim()) return;
    await addDoc(collection(db, "updates"), {
      title,
      body,
      childId: childId || null,
      timestamp: new Date(),
    });
    setTitle("");
    setBody("");
    setChildId("");
  };

  useEffect(() => {
    void (async () => {
      await fetchChildren();
    })();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin", "superAdmin"]}>
      <div className="min-h-screen bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">Create Update</h2>

            <div className="bg-white rounded shadow p-6 max-w-2xl">
              <input
                className="border border-gray-300 rounded px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
              <textarea
                className="border border-gray-300 rounded px-4 py-2 mb-4 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                rows={4}
                placeholder="Body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
              />
              <select
                className="border border-gray-300 rounded px-4 py-2 mb-6 w-full focus:outline-none focus:ring-2 focus:ring-primary"
                value={childId}
                onChange={(e) => setChildId(e.target.value)}
              >
                <option value="">Select Child (optional)</option>
                {children.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:bg-sky-500 transition"
                onClick={submitUpdate}
              >
                Submit Update
              </button>
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
