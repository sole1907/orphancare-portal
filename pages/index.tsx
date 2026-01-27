import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import Link from "next/link";
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
    <div className="flex items-center justify-center h-screen bg-gray-100">
      <div className="bg-white p-8 rounded shadow-md w-96">
        <h2 className="text-2xl mb-4">Orphancare Admin Login</h2>
        <input
          className="w-full mb-2 p-2 border"
          placeholder="Email"
          onChange={(e) => setEmail(e.target.value)}
        />
        <div className="relative">
          <input
            className="w-full mb-2 p-2 border pr-10"
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-600"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeSlashIcon className="h-5 w-5" />
            ) : (
              <EyeIcon className="h-5 w-5" />
            )}
          </button>
        </div>
        <button className="w-full bg-blue-600 text-white p-2" onClick={login}>
          Login
        </button>
        <div className="mt-3 text-center">
          <Link
            href="/forgot-password"
            className="text-blue-600 hover:underline text-sm"
          >
            Forgot password?
          </Link>
        </div>
        {error && (
          <p className="mt-3 text-sm text-red-600 text-center">{error}</p>
        )}
      </div>
    </div>
  );
}
