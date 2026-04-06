import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  signInWithEmailLink,
  updatePassword,
  isSignInWithEmailLink,
} from "firebase/auth";
import { doc, setDoc, updateDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function CompleteRegistration() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [step, setStep] = useState<"verify" | "setPassword">("verify");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (!router.isReady) return;

    const emailFromQuery = router.query.email as string | undefined;
    const fullLink = `${window.location.origin}${router.asPath}`;

    if (emailFromQuery && isSignInWithEmailLink(auth, fullLink)) {
      signInWithEmailLink(auth, emailFromQuery, fullLink)
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
  }, [router.isReady, router.query, router.asPath]);

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

      // also update orphanage status
      if (router.query.orphanageId) {
        await updateDoc(
          doc(db, "orphanages", router.query.orphanageId as string),
          {
            status: "Active",
            activatedAt: serverTimestamp(),
          }
        );
      }

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
            <div className="flex items-center border border-gray-300 rounded mb-4">
              <input
                className="px-4 py-2 w-full leading-none focus:outline-none"
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                className="px-3 text-gray-600 flex items-center"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? (
                  <EyeSlashIcon className="h-5 w-5" />
                ) : (
                  <EyeIcon className="h-5 w-5" />
                )}
              </button>
            </div>
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
