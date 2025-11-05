import { useState, useEffect } from "react";
import { db } from "../lib/firebase";
import { collection, addDoc, getDocs } from "firebase/firestore";
import ProtectedRoute from "../components/ProtectedRoute";
import Sidebar from "../components/Sidebar";
import Navbar from "../components/Navbar";
import { Child } from "../types/child";

export default function ChildrenPage() {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [list, setList] = useState<Child[]>([]);

  const addChild = async () => {
    if (!name.trim() || !age.trim()) return;
    await addDoc(collection(db, "children"), { name, age: parseInt(age) });
    setName("");
    setAge("");
    fetchChildren();
  };

  const fetchChildren = async () => {
    const snapshot = await getDocs(collection(db, "children"));
    setList(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        ...(doc.data() as Omit<Child, "id">),
      }))
    );
  };

  useEffect(() => {
    fetchChildren();
  }, []);

  return (
    <ProtectedRoute allowedRoles={["superAdmin", "orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold text-base mb-6">Children</h2>

            <div className="flex flex-wrap items-center gap-4 mb-6">
              <input
                className="border border-gray-300 rounded px-4 py-2 w-64 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <input
                className="border border-gray-300 rounded px-4 py-2 w-32 focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Age"
                value={age}
                onChange={(e) => setAge(e.target.value)}
              />
              <button
                className="bg-primary text-white px-4 py-2 rounded hover:bg-sky-400 transition"
                onClick={addChild}
              >
                Add
              </button>
            </div>

            <ul className="space-y-2">
              {list.map((c) => (
                <li
                  key={c.id}
                  className="bg-white rounded shadow px-4 py-3 border border-gray-100"
                >
                  <span className="font-semibold text-base">{c.name}</span>
                  <span className="text-sm text-gray-600 ml-2">
                    Age {c.age}
                  </span>
                </li>
              ))}
            </ul>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
