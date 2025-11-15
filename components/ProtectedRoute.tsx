import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useUserRole } from "@/lib/role";
import { isPublicRoute } from "@/lib/routes";
import LoadingScreen from "./LoadingScreen";

export default function ProtectedRoute({
  children,
  allowedRoles,
}: {
  children: React.ReactNode;
  allowedRoles?: string[];
}) {
  const [user, loading] = useAuthState(auth);
  const role = useUserRole();
  const router = useRouter();

  useEffect(() => {
    console.log("ProtectedRoute check for:", router.pathname);
    if (isPublicRoute(router.pathname)) {
      console.log("accessible public route");
      return;
    }

    if (loading) return; // Wait until Firebase finishes loading

    if (!user) router.push("/");

    if (
      user &&
      allowedRoles &&
      typeof role === "string" &&
      !allowedRoles.includes(role)
    ) {
      router.push("/dashboard");
    }
  }, [user, loading, role, allowedRoles, router]);

  return (
    <>
      {loading ? (
        <LoadingScreen /> // or null, spinner, skeleton, etc.
      ) : (
        user &&
        (!allowedRoles ||
          (typeof role === "string" && allowedRoles.includes(role))) &&
        children
      )}
    </>
  );
}
