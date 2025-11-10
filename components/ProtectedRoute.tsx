import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useUserRole } from "@/lib/role";
import { isPublicRoute } from "@/lib/routes";

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
    if (isPublicRoute(router.pathname)) return;

    if (!loading && !user) {
      router.push("/");
    }

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
      {user &&
        (!allowedRoles ||
          (typeof role === "string" && allowedRoles.includes(role))) &&
        children}
    </>
  );
}
