import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../lib/firebase";
import { useRouter } from "next/router";
import { useEffect } from "react";
import { useUserRole } from "../lib/role";

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
    const publicRoutes = [
      "/complete-registration",
      "/login",
      "/forgot-password",
    ];
    const isPublic = publicRoutes.includes(router.pathname);

    if (!loading && !user && !isPublic) {
      router.push("/");
    }

    if (
      user &&
      allowedRoles &&
      typeof role === "string" &&
      !allowedRoles.includes(role) &&
      !isPublic
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
