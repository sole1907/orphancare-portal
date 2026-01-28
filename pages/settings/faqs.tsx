import { useState, useEffect } from "react";
import {
  collection,
  addDoc,
  getDocs,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  query,
  orderBy,
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
  const [order, setOrder] = useState<number>(0);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [errors, setErrors] = useState<{ question?: string; answer?: string }>({});
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

  const validateForm = () => {
    const newErrors: { question?: string; answer?: string } = {};
    if (!question.trim()) {
      newErrors.question = "Question is required.";
    }
    if (!answer.trim()) {
      newErrors.answer = "Answer is required.";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveFAQ = async () => {
    if (!validateForm()) return;

    setSaving(true);
    try {
      if (editingId) {
        await updateDoc(doc(db, "faqs", editingId), {
          question: question.trim(),
          answer: answer.trim(),
          order,
          updatedAt: serverTimestamp(),
        });
      } else {
        // For new FAQs, set order to next available if not specified
        const nextOrder = order || list.length + 1;
        await addDoc(collection(db, "faqs"), {
          question: question.trim(),
          answer: answer.trim(),
          order: nextOrder,
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
    if (!confirm("Are you sure you want to delete this FAQ?")) return;
    await deleteDoc(doc(db, "faqs", id));
    fetchFAQs();
  };

  const startEditing = (faq: FAQ) => {
    setEditingId(faq.id);
    setQuestion(faq.question);
    setAnswer(faq.answer);
    setOrder(faq.order);
    setErrors({});
  };

  const resetForm = () => {
    setQuestion("");
    setAnswer("");
    setOrder(0);
    setEditingId(null);
    setErrors({});
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
                <input
                  placeholder="Question *"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className={`border rounded px-3 py-2 w-full ${
                    errors.question ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.question && (
                  <p className="text-red-500 text-sm mt-1">{errors.question}</p>
                )}
              </div>

              <div>
                <textarea
                  placeholder="Answer *"
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  rows={4}
                  className={`border rounded px-3 py-2 w-full ${
                    errors.answer ? "border-red-500" : "border-gray-300"
                  }`}
                />
                {errors.answer && (
                  <p className="text-red-500 text-sm mt-1">{errors.answer}</p>
                )}
              </div>

              <div>
                <input
                  type="number"
                  placeholder="Display Order (optional)"
                  value={order || ""}
                  onChange={(e) => setOrder(parseInt(e.target.value) || 0)}
                  className="border border-gray-300 rounded px-3 py-2 w-32"
                />
                <span className="text-gray-500 text-sm ml-2">
                  Lower numbers appear first
                </span>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={saveFAQ}
                  disabled={saving}
                  className="bg-primary text-white px-4 py-2 rounded hover:bg-sky-400 transition disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update FAQ" : "Add FAQ"}
                </button>
                {editingId && (
                  <button
                    onClick={resetForm}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400 transition"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>

            {/* List */}
            <div className="max-w-2xl space-y-4">
              {list.length === 0 ? (
                <p className="text-gray-500">No FAQs yet. Add one above.</p>
              ) : (
                list.map((faq) => (
                  <div
                    key={faq.id}
                    className="bg-white rounded shadow p-4"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="bg-gray-200 text-gray-600 text-xs px-2 py-1 rounded">
                            #{faq.order}
                          </span>
                          <h4 className="font-semibold text-lg">{faq.question}</h4>
                        </div>
                        <p className="text-gray-600 whitespace-pre-wrap">{faq.answer}</p>
                      </div>
                      <div className="ml-4 space-x-3 flex-shrink-0">
                        <button
                          className="text-blue-600 text-sm hover:underline"
                          onClick={() => startEditing(faq)}
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
                  </div>
                ))
              )}
            </div>
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
