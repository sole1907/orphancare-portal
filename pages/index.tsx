import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { EyeIcon, EyeSlashIcon } from "@heroicons/react/24/outline";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const [user, loading] = useAuthState(auth);
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      user.getIdTokenResult().then((token) => {
        const claims = token.claims;
        if (claims.superAdmin || claims.orphanageAdmin)
          router.replace("/dashboard");
        else router.replace("/");
      });
    }
  }, [user, loading, router]);

  const login = async () => {
    setError(""); // clear previous error
    try {
      await signInWithEmailAndPassword(auth, email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (
        typeof err === "object" &&
        err !== null &&
        "code" in err &&
        typeof (err as { code: unknown }).code === "string"
      ) {
        const code = (err as { code: string }).code;
        if (code === "auth/invalid-credential") {
          setError("Invalid email or password.");
        } else {
          setError("Something went wrong. Please try again.");
        }
      } else {
        setError("Unexpected error occurred.");
      }
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary via-primary-light to-accent">
      <div className="bg-white p-8 rounded-xl shadow-2xl w-96">
        <div className="flex flex-col items-center mb-6">
          <Image
            src="/benevovia_icon_wordmark.png"
            alt="Benevovia"
            width={220}
            height={60}
            className="mb-2"
            priority
          />
          <p className="text-gray-500 text-sm">Admin Portal</p>
        </div>
        <input
          className="w-full mb-3 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative">
          <input
            className="w-full mb-3 p-3 border border-gray-300 rounded-lg pr-10 focus:outline-none focus:ring-2 focus:ring-primary-light focus:border-transparent transition"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
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
          className="w-full bg-primary hover:bg-primary/90 text-white p-3 rounded-lg font-medium transition"
          onClick={login}
        >
          Sign In
        </button>
        <div className="mt-4 text-center">
          <Link
            href="/forgot-password"
            className="text-primary-light hover:underline text-sm"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 text-center bg-red-50 p-2 rounded">{error}</p>
        )}
      </div>
    </div>
  );
}
