import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  orderBy,
  query,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";

interface FAQ {
  id: string;
  question: string;
  answer: string;
  order: number;
}

export default function FAQsPage() {
  const [list, setList] = useState<FAQ[]>([]);
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState("");
  const [order, setOrder] = useState(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchFAQs = async () => {
    const q = query(collection(db, "faqs"), orderBy("order", "asc"));
    const snapshot = await getDocs(q);
    setList(
      snapshot.docs.map((doc) => ({
        id: doc.id,
        question: doc.data().question || "",
        answer: doc.data().answer || "",
        order: doc.data().order || 0,
      }))
    );
  };

  useEffect(() => {
    fetchFAQs();
  }, []);

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setOrder(list.length > 0 ? Math.max(...list.map((f) => f.order)) + 1 : 0);
    setEditingId(null);
    setError("");
  };

  const saveFAQ = async () => {
    if (!question.trim()) {
      setError("Please enter a question.");
      return;
    }
    if (!answer.trim()) {
      setError("Please enter an answer.");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), {
          question,
          answer,
          order,
          updatedAt: serverTimestamp(),
        });
      } else {
        await addDoc(collection(db, "faqs"), {
          question,
          answer,
          order,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
      }
      resetForm();
      await fetchFAQs();
    } finally {
      setSaving(false);
    }
  };

  const deleteFAQ = async (id: string) => {
    if (confirm("Are you sure you want to delete this FAQ?")) {
      await deleteDoc(doc(db, "faqs", id));
      fetchFAQs();
    }
  };

  const startEdit = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrder(faq.order);
    setError("");
  };

  return (
    <ProtectedRoute allowedRoles={["superAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Manage FAQs</h2>

            {/* Form */}
            <div className="max-w-2xl bg-white rounded shadow p-6 mb-8 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Question *
                </label>
                <input
                  placeholder="Enter the FAQ question"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={`border rounded px-3 py-2 w-full ${
                    error && !question.trim()
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Answer *
                </label>
                <textarea
                  placeholder="Enter the answer"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className={`border rounded px-3 py-2 w-full ${
                    error && !answer.trim()
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Display Order
                </label>
                <input
                  type="number"
                  placeholder="0"
                  value={order}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className="border border-gray-300 rounded px-3 py-2 w-24"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Lower numbers appear first
                </p>
              </div>
              {error && <p className="text-red-500 text-sm">{error}</p>}
              <div className="flex gap-3">
                <button
                  onClick={saveFAQ}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-sky-400 transition disabled:opacity-50"
                >
                  {editingId ? "Update FAQ" : "Add FAQ"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="border border-gray-300 px-4 py-2 rounded hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="space-y-4 max-w-2xl">
              {list.length === 0 && (
                <p className="text-gray-500">
                  No FAQs yet. Add your first FAQ above.
                </p>
              )}
              {list.map((faq) => (
                <div
                  key={faq.id}
                  className="bg-white rounded shadow px-4 py-4"
                >
                  <div className="flex justify-between items-start mb-2">
                    <span className="text-xs text-gray-400">
                      Order: {faq.order}
                    </span>
                    <div className="space-x-3">
                      <button
                        className="text-blue-600 text-sm hover:underline"
                        onClick={() => startEdit(faq)}
                      >
                        Edit
                      </button>
                      <button
                        className="text-red-600 text-sm hover:underline"
                        onClick={() => deleteFAQ(faq.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                  <h4 className="font-semibold text-gray-800 mb-1">
                    Q: {faq.question}
                  </h4>
                  <p className="text-gray-600 text-sm whitespace-pre-wrap">
                    A: {faq.answer}
                  </p>
                </div>
              ))}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
