import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { useEffect, useState, Fragment } from "react";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { Combobox, Transition } from "@headlessui/react";
import { BACKEND_ENDPOINTS } from "@/lib/config";
import { collection, getDocs } from "firebase/firestore";

export default function AccountDetailsPage() {
  const [user] = useAuthState(auth);

  const [banks, setBanks] = useState<{ name: string; code: string }[]>([]);
  const [query, setQuery] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");

  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  // Load orphanage details + bank list
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) return;

      const token = await user.getIdTokenResult();
      const orphanageId = token.claims.orphanageId as string;

      // Load orphanage details
      const ref = doc(db, "orphanages", orphanageId);
      const snap = await getDoc(ref);
      if (snap.exists()) {
        const data = snap.data();
        setBankName(data.bankName || "");
        setAccountName(data.accountName || "");
        setAccountNumber(data.accountNumber || "");
      }

      // Load bank list
      // Load bank list
      const banksSnap = await getDocs(collection(db, "banks"));
      const list = banksSnap.docs.map(
        (d) => d.data() as { name: string; code: string }
      );
      setBanks(list);

      setLoading(false);
    };

    fetchDetails();
  }, [user]);

  // Filter banks for search
  const filteredBanks =
    query === ""
      ? banks
      : banks.filter((bank) =>
          bank.name.toLowerCase().includes(query.toLowerCase())
        );

  // Auto-resolve account name when bank + account number are valid
  useEffect(() => {
    const resolve = async () => {
      if (!bankCode || accountNumber.length !== 10) return;

      setResolving(true);
      setError("");

      try {
        const idToken = await user?.getIdToken();

        const res = await fetch(
          `${BACKEND_ENDPOINTS.apiBaseUrl}/resolveAccount`,
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${idToken}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              accountNumber,
              bankCode,
            }),
          }
        );

        const json = await res.json();

        if (!res.ok) {
          setAccountName("");
          setError(json.error || "Unable to resolve account");
        } else {
          setAccountName(json.accountName);
        }
      } catch (err) {
        console.error("Resolve error:", err);
        setError("Network error resolving account");
      } finally {
        setResolving(false);
      }
    };

    resolve();
  }, [bankCode, accountNumber, user]);

  const handleSubmit = async () => {
    if (!user) return;

    if (!bankName || !bankCode) {
      alert("Please select a bank");
      return;
    }

    if (accountNumber.length !== 10) {
      alert("Account number must be 10 digits");
      return;
    }

    if (!accountName) {
      alert("Unable to resolve account name");
      return;
    }

    const token = await user.getIdTokenResult();
    const orphanageId = token.claims.orphanageId as string;
    const ref = doc(db, "orphanages", orphanageId);

    await updateDoc(ref, {
      bankName,
      bankCode,
      accountName,
      accountNumber,
      accountVerificationStatus: "pending",
    });

    alert("Account details submitted for verification.");
  };

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <h2 className="text-3xl font-bold mb-6">Account Details</h2>

            {loading ? (
              <p>Loading...</p>
            ) : (
              <div className="bg-white rounded shadow p-6 max-w-lg space-y-6">
                {/* BANK SELECT */}
                <div>
                  <label className="block font-semibold mb-2">Bank</label>

                  <Combobox
                    value={bankName}
                    onChange={(value: string | null) => {
                      const name = value ?? "";
                      setBankName(name);

                      const bank = banks.find((b) => b.name === name);
                      setBankCode(bank?.code ?? "");
                    }}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="border p-2 w-full"
                        onChange={(e) => setQuery(e.target.value)}
                        displayValue={(value: string) => value}
                        placeholder="Search bank..."
                      />

                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-white border rounded shadow">
                          {filteredBanks.length === 0 ? (
                            <div className="p-2 text-gray-500">
                              No banks found
                            </div>
                          ) : (
                            filteredBanks.map((bank) => (
                              <Combobox.Option
                                key={bank.code}
                                value={bank.name}
                                className="cursor-pointer p-2 hover:bg-gray-100"
                              >
                                {bank.name}
                              </Combobox.Option>
                            ))
                          )}
                        </Combobox.Options>
                      </Transition>
                    </div>
                  </Combobox>
                </div>

                {/* ACCOUNT NUMBER */}
                <div>
                  <label className="block font-semibold mb-2">
                    Account Number
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                      setAccountNumber(e.target.value.replace(/\D/g, ""))
                    }
                    maxLength={10}
                    className="border p-2 w-full"
                    placeholder="10-digit account number"
                  />
                  {accountNumber.length > 0 && accountNumber.length !== 10 && (
                    <p className="text-red-600 text-sm mt-1">
                      Account number must be 10 digits
                    </p>
                  )}
                </div>

                {/* ACCOUNT NAME (AUTO-FILLED) */}
                <div>
                  <label className="block font-semibold mb-2">
                    Account Name
                  </label>

                  {resolving ? (
                    <p className="text-gray-500">Resolving...</p>
                  ) : accountName ? (
                    <p className="font-medium">{accountName}</p>
                  ) : (
                    <p className="text-gray-400 italic">
                      Enter account number to resolve
                    </p>
                  )}

                  {error && (
                    <p className="text-red-600 text-sm mt-1">{error}</p>
                  )}
                </div>

                {/* SUBMIT */}
                <button
                  onClick={handleSubmit}
                  className="bg-blue-600 text-white px-4 py-2 rounded"
                >
                  Save & Submit for Verification
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
