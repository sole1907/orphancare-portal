import React, { useEffect, useState, Fragment, ChangeEvent } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import Sidebar from "@/components/Sidebar";
import Navbar from "@/components/Navbar";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs } from "firebase/firestore";
import { Combobox, Transition } from "@headlessui/react";
import { BACKEND_ENDPOINTS } from "@/lib/config";
import { Orphanage } from "@/types/orphanage";

type Bank = {
  name: string;
  code: string;
};

type VerificationStep = "form" | "otp" | "done";

export default function AccountDetailsPage() {
  const [user] = useAuthState(auth);

  const [banks, setBanks] = useState<Bank[]>([]);
  const [query, setQuery] = useState("");

  const [bankName, setBankName] = useState("");
  const [bankCode, setBankCode] = useState("");

  const [accountNumber, setAccountNumber] = useState("");
  const [accountNumberMasked, setAccountNumberMasked] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verificationStatus, setVerificationStatus] = useState<string>("");

  const [loading, setLoading] = useState(true);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState("");

  const [step, setStep] = useState<VerificationStep>("form");

  const [otp, setOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpLoading, setOtpLoading] = useState(false);
  const [infoMessage, setInfoMessage] = useState("");

  // NEW: Edit mode
  const [isEditing, setIsEditing] = useState(false);

  // Load orphanage details + bank list
  useEffect(() => {
    const fetchDetails = async () => {
      if (!user) return;

      const tokenResult = await user.getIdTokenResult();
      const orphanageId = tokenResult.claims.orphanageId as string;
      const orphanageRef = doc(db, "orphanages", orphanageId);
      const orphanageSnap = await getDoc(orphanageRef);

      if (orphanageSnap.exists()) {
        const data = orphanageSnap.data() as Orphanage;

        setBankName(data.bankName || "");
        setBankCode(data.bankCode || "");
        setAccountName(data.accountName || "");
        setVerificationStatus(data.accountVerificationStatus || "none");

        // NEW: Load masked account number
        if (data.accountNumberMasked) {
          setAccountNumberMasked(data.accountNumberMasked);
          setAccountNumber(data.accountNumberMasked);
        }

        if (data.accountVerificationStatus === "otp_pending") {
          setStep("otp");
          setInfoMessage(
            "An OTP has been sent to your registered email. Please enter it below to verify your account details."
          );
        } else if (data.accountVerificationStatus === "pending") {
          setStep("done");
          setInfoMessage(
            "Your account details have been submitted and will be reviewed by our support team. You’ll be notified once approved."
          );
        } else {
          setStep("form");
        }
      }

      const banksSnap = await getDocs(collection(db, "banks"));
      const list: Bank[] = banksSnap.docs.map((d) => {
        const bankData = d.data() as Bank;
        return {
          name: bankData.name as string,
          code: bankData.code as string,
        };
      });
      setBanks(list);

      setLoading(false);
    };

    fetchDetails();
  }, [user]);

  const filteredBanks =
    query.trim() === ""
      ? banks
      : banks.filter((bank) =>
          bank.name.toLowerCase().includes(query.toLowerCase())
        );

  // Auto-resolve account name when bank + account number are valid
  useEffect(() => {
    const resolve = async () => {
      if (!user) return;
      if (!bankCode || accountNumber.length !== 10) return;
      if (!isEditing) return; // NEW: Only resolve when editing

      setResolving(true);
      setError("");

      try {
        const idToken = await user.getIdToken();

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
  }, [bankCode, accountNumber, user, isEditing]);

  // NEW: Handle account number input (masked vs real)
  const handleAccountNumberChange = (e: ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/\D/g, "");

    // If user starts typing over masked value, clear it
    if (accountNumber === accountNumberMasked) {
      setAccountNumber(raw);
      return;
    }

    setAccountNumber(raw);
  };

  // NEW: Start editing
  const startEditing = () => {
    setIsEditing(true);
    setAccountNumber(""); // clear masked value
  };

  // NEW: Cancel editing
  const cancelEditing = () => {
    setIsEditing(false);
    setAccountNumber(accountNumberMasked);
    setError("");
  };

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

    const idToken = await user.getIdToken();
    const res = await fetch(
      `${BACKEND_ENDPOINTS.apiBaseUrl}/submitAccountDetails`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${idToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          bankName,
          bankCode,
          accountName,
          accountNumber,
        }),
      }
    );
    const json = await res.json();
    if (!res.ok) {
      alert(json.error || "Unable to submit account details");
      return;
    }

    // NEW: Reset UI
    setIsEditing(false);
    setAccountNumberMasked("******" + accountNumber.slice(-4));
    setAccountNumber("******" + accountNumber.slice(-4));

    setStep("otp");
    setVerificationStatus("otp_pending");
    setInfoMessage(
      "Your account details have been saved. An OTP has been sent to your registered email. Please enter it below to complete verification."
    );
  };

  const handleVerifyOtp = async () => {
    if (!user) return;

    if (!otp || otp.length < 4) {
      setOtpError("Please enter the OTP sent to your email.");
      return;
    }

    setOtpLoading(true);
    setOtpError("");

    try {
      const tokenResult = await user.getIdTokenResult();
      const idToken = tokenResult.token;
      const orphanageId = tokenResult.claims.orphanageId as string;

      const res = await fetch(
        `${BACKEND_ENDPOINTS.apiBaseUrl}/verifyAccountOtp`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${idToken}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            orphanageId,
            otp,
          }),
        }
      );

      const json = await res.json();

      if (!res.ok) {
        setOtpError(json.error || "Invalid or expired OTP.");
        return;
      }

      setStep("done");
      setVerificationStatus("pending");
      setInfoMessage(
        "Your account details have been successfully submitted and will be reviewed by our support team. You’ll be notified once approved."
      );
    } catch (err) {
      console.error("OTP verify error:", err);
      setOtpError("Network error verifying OTP. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  const renderStatusBadge = () => {
    const base = "inline-block px-3 py-1 rounded-full text-sm font-medium";
    console.log("Verification Status:", verificationStatus);
    switch (verificationStatus) {
      case "approved":
        return (
          <span className={`${base} bg-green-100 text-green-800`}>
            Approved
          </span>
        );
      case "pending":
        return (
          <span className={`${base} bg-yellow-100 text-yellow-800`}>
            Pending Review
          </span>
        );
      case "rejected":
        return (
          <span className={`${base} bg-red-100 text-red-800`}>Rejected</span>
        );
      case "otp_pending":
        return (
          <span className={`${base} bg-blue-100 text-blue-800`}>
            OTP Required
          </span>
        );
      default:
        return (
          <span className={`${base} bg-gray-100 text-gray-800`}>
            Not Submitted
          </span>
        );
    }
  };

  return (
    <ProtectedRoute allowedRoles={["orphanageAdmin"]}>
      <div className="min-h-screen flex flex-col bg-background text-base">
        <Navbar />
        <div className="flex">
          <Sidebar />
          <main className="flex-1 p-8">
            <div className="flex items-center gap-3 mb-6">
              <h2 className="text-3xl font-bold">Account Details</h2>
              {renderStatusBadge()}
            </div>

            {infoMessage && (
              <div className="mb-4 p-3 rounded bg-blue-50 text-blue-800 text-sm">
                {infoMessage}
              </div>
            )}

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
                      if (!isEditing) return;
                      const name = value ?? "";
                      setBankName(name);

                      const bank = banks.find((b) => b.name === name);
                      setBankCode(bank?.code ?? "");
                    }}
                  >
                    <div className="relative">
                      <Combobox.Input
                        className="border p-2 w-full"
                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                          setQuery(e.target.value)
                        }
                        displayValue={(value: string) => value}
                        placeholder="Search bank..."
                        disabled={!isEditing}
                      />

                      <Transition
                        as={Fragment}
                        leave="transition ease-in duration-100"
                        leaveFrom="opacity-100"
                        leaveTo="opacity-0"
                      >
                        <Combobox.Options className="absolute mt-1 max-h-60 w-full overflow-auto bg-white border rounded shadow z-10">
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
                    onChange={handleAccountNumberChange}
                    maxLength={10}
                    className="border p-2 w-full"
                    placeholder="10-digit account number"
                    disabled={!isEditing}
                  />
                  {isEditing &&
                    accountNumber.length > 0 &&
                    accountNumber.length !== 10 && (
                      <p className="text-red-600 text-sm mt-1">
                        Account number must be 10 digits
                      </p>
                    )}
                </div>

                {/* ACCOUNT NAME */}
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

                {/* EDIT / SAVE / CANCEL BUTTONS */}
                {step === "form" && !isEditing && (
                  <button
                    onClick={startEditing}
                    className="bg-gray-700 text-white px-4 py-2 rounded"
                  >
                    Edit Account Details
                  </button>
                )}

                {step === "form" && isEditing && (
                  <div className="flex gap-3">
                    <button
                      onClick={handleSubmit}
                      className="bg-blue-600 text-white px-4 py-2 rounded"
                    >
                      Save & Send OTP
                    </button>
                    <button
                      onClick={cancelEditing}
                      className="bg-gray-400 text-white px-4 py-2 rounded"
                    >
                      Cancel
                    </button>
                  </div>
                )}

                {/* OTP SECTION */}
                {step === "otp" && (
                  <div className="border-t pt-4 space-y-3">
                    <h3 className="font-semibold text-lg">
                      Verify Your Account
                    </h3>
                    <p className="text-sm text-gray-600">
                      We’ve sent a one-time password (OTP) to your registered
                      email address. Please enter it below to confirm your bank
                      account details.
                    </p>

                    <div>
                      <label className="block font-semibold mb-2">
                        OTP Code
                      </label>
                      <input
                        type="text"
                        value={otp}
                        onChange={(e: ChangeEvent<HTMLInputElement>) => {
                          setOtp(e.target.value.replace(/\D/g, ""));
                          setOtpError("");
                        }}
                        maxLength={6}
                        className="border p-2 w-full"
                        placeholder="Enter 6-digit OTP"
                      />
                      {otpError && (
                        <p className="text-red-600 text-sm mt-1">{otpError}</p>
                      )}
                    </div>

                    <button
                      onClick={handleVerifyOtp}
                      className="bg-green-600 text-white px-4 py-2 rounded"
                      disabled={otpLoading}
                    >
                      {otpLoading ? "Verifying..." : "Verify OTP"}
                    </button>
                  </div>
                )}

                {/* DONE STATE */}
                {step === "done" && (
                  <p className="text-sm text-green-700 bg-green-50 p-3 rounded">
                    Your request has been submitted and will be reviewed by our
                    support team. You’ll be notified once it’s approved.
                  </p>
                )}
              </div>
            )}
          </main>
        </div>
      </div>
    </ProtectedRoute>
  );
}
