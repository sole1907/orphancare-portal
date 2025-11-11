import { auth } from "../lib/firebase";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/router";
import { useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useEffect } from "react";
import { isPublicRoute } from "@/lib/routes";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const router = useRouter();
  const [user, loading] = useAuthState(auth);

  useEffect(() => {
    if (user && !loading) {
      user.getIdTokenResult().then((token) => {
        const claims = token.claims;
        if (claims.superAdmin || claims.orphanageAdmin)
          router.replace("/dashboard");
        else router.replace("/"); // fallback or donor dashboard
      });
    }
  }, [user, loading, router]);

  const login = async () => {
    await signInWithEmailAndPassword(auth, email, password);
    router.push("/dashboard");
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
        <input
          className="w-full mb-4 p-2 border"
          type="password"
          placeholder="Password"
          onChange={(e) => setPassword(e.target.value)}
        />
        <button className="w-full bg-blue-600 text-white p-2" onClick={login}>
          Login
        </button>
      </div>
    </div>
  );
}
