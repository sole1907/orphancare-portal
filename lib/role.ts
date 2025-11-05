import { useEffect, useState } from "react";
import { auth } from "./firebase";

export function useUserRole() {
  const [role, setRole] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const token = await user.getIdTokenResult();
        const claims = token.claims;
        if (claims.superAdmin) setRole("superAdmin");
        else if (claims.orphanageAdmin) setRole("orphanageAdmin");
        else if (claims.donor) setRole("donor");
        else setRole(null);
      } else {
        setRole(null);
      }
    });

    return () => unsubscribe();
  }, []);

  return role;
}
