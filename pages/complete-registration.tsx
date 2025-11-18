import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailLink,
  updatePassword,
  isSignInWithEmailLink,
} from "firebase/auth";
import { auth, db } from "../lib/firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";

export default function CompleteRegistration() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"verify" | "setPassword">("verify");

  useEffect(() => {
    if (!router.isReady) return;

    const emailFromQuery = router.query.email as string | undefined;
    const link = window.location.href;

    console.log("Verifying email link with query param:", emailFromQuery);

    if (emailFromQuery && isSignInWithEmailLink(auth, link)) {
      signInWithEmailLink(auth, emailFromQuery, link)
        .then(() => {
          setEmail(emailFromQuery);
          setStep("setPassword");
        })
        .catch((err) => {
          console.error("Sign-in error:", err);
          setError("Invalid or expired link");
        });
    } else {
      setTimeout(() => {
        setError("Missing email or invalid link");
      }, 0);
    }
  }, [router.isReady, router.query]);

  const isPasswordStrong = (pwd: string) => {
    return (
      pwd.length >= 8 &&
      /[A-Z]/.test(pwd) &&
      /[a-z]/.test(pwd) &&
      /[0-9]/.test(pwd)
    );
  };

  const handlePasswordSubmit = async () => {
    if (!isPasswordStrong(password)) {
      setError(
        "Password must be at least 8 characters and include uppercase, lowercase, and a number."
      );
      return;
    }

    try {
      await updatePassword(auth.currentUser!, password);

      await setDoc(doc(db, "registrations", auth.currentUser!.uid), {
        email,
        completedAt: serverTimestamp(),
        role: "orphanageAdmin",
      });

      setSuccess(true);
      setTimeout(() => router.push("/dashboard"), 3000);
    } catch (err) {
      console.error("failed to set password:", err);
      setError("Failed to set password");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white p-6 rounded shadow">
        <h2 className="text-xl font-semibold mb-4">Complete Registration</h2>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        {success && (
          <p className="text-green-600 text-sm mb-4">
            ✅ Registration complete! Redirecting to dashboard...
          </p>
        )}

        {step === "setPassword" && !success && (
          <>
            <p className="mb-2 text-sm text-gray-600">
              Set a password for your Orphanage Admin account:
            </p>
            <input
              type="password"
              className="border border-gray-300 rounded px-4 py-2 w-full mb-4"
              placeholder="Create password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              className="bg-primary text-white px-4 py-2 rounded w-full"
              onClick={handlePasswordSubmit}
            >
              Set Password & Continue
            </button>
          </>
        )}
      </div>
    </div>
  );
}
