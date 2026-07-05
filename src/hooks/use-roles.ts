import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./use-auth";

export type AppRole = "admin" | "teacher" | "student";

export function useRoles() {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setRoles([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .then(({ data }) => {
        setRoles(((data ?? []) as { role: AppRole }[]).map((r) => r.role));
        setLoading(false);
      });
  }, [user, authLoading]);

  const has = (r: AppRole) => roles.includes(r);
  const isStaff = has("admin") || has("teacher");
  return {
    roles,
    loading: loading || authLoading,
    has,
    isStaff,
    isAdmin: has("admin"),
    isTeacher: has("teacher"),
    isStudent: has("student"),
  };
}
