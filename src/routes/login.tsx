import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { sfx } from "@/lib/sound";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  LogIn,
  Sparkles,
  GraduationCap,
  Users,
  Shield,
} from "lucide-react";
import { toast } from "sonner";

type Role = "student" | "teacher" | "admin";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in · Student Information System" }] }),
  component: Login,
});

const ROLES: {
  id: Role;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  desc: string;
}[] = [
  { id: "student", label: "Student", icon: GraduationCap, desc: "View your profile and grades" },
  { id: "teacher", label: "Teacher", icon: Users, desc: "Manage students and download details" },
  { id: "admin", label: "Admin", icon: Shield, desc: "Full access to the system" },
];

function Login() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [role, setRole] = useState<Role>("student");
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user) nav({ to: "/dashboard" });
  }, [user, nav]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        // Verify role matches what they selected
        const { data: roles } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", data.user!.id);
        const has = (roles ?? []).some((r) => r.role === role);
        if (!has) {
          await supabase.auth.signOut();
          throw new Error(`This account is not registered as ${role}. Pick the correct role.`);
        }
        sfx.success();
        toast.success(`Welcome back, ${role}`);
        nav({ to: "/dashboard" });
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/dashboard` },
        });
        if (error) throw error;
        // Sign in (auto-confirm is enabled)
        const { data: signed, error: e2 } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (e2) throw e2;
        const uid = signed.user!.id;
        const { error: roleErr } = await supabase.from("user_roles").insert({ user_id: uid, role });
        if (roleErr && !roleErr.message.includes("duplicate")) throw roleErr;
        sfx.success();
        toast.success(`Account created as ${role}`);
        nav({ to: "/dashboard" });
      }
    } catch (err) {
      const error = err as Error;
      sfx.error();
      toast.error(error.message ?? "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2 bg-background">
      <div className="relative hidden md:flex flex-col justify-between p-12 overflow-hidden bg-grid">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20 pointer-events-none" />
        <div className="absolute -top-32 -left-32 size-96 rounded-full bg-primary/30 blur-3xl animate-pulse-glow" />
        <div className="absolute bottom-0 right-0 size-96 rounded-full bg-secondary/30 blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Sparkles className="size-4 text-secondary" /> v1.0 · Neon Edition
          </div>
        </div>
        <div className="relative">
          <h1 className="font-bold text-6xl md:text-7xl leading-[0.95] tracking-tight">
            <span className="block text-foreground">STUDENT</span>
            <span className="block gradient-text text-glow-pink">INFORMATION</span>
            <span className="block text-foreground">SYSTEM</span>
          </h1>
          <p className="mt-6 text-muted-foreground max-w-md">
            Student · Teacher · Admin portals. Track, scan, and download student data in seconds.
          </p>
        </div>
        <div className="relative text-xs text-muted-foreground tracking-widest">
          PINK · LIGHT BLUE · NEON
        </div>
      </div>

      <div className="flex items-center justify-center p-6 md:p-8">
        <form onSubmit={submit} className="w-full max-w-sm space-y-5 animate-rise">
          <div>
            <h2 className="text-3xl font-bold gradient-text">
              {mode === "login" ? "Welcome Back" : "Create Account"}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Choose your role to continue</p>
          </div>

          <div className="grid grid-cols-3 gap-2">
            {ROLES.map((r) => {
              const Icon = r.icon;
              const active = role === r.id;
              return (
                <button
                  key={r.id}
                  type="button"
                  onClick={() => {
                    sfx.click();
                    setRole(r.id);
                  }}
                  className={`p-3 rounded-md border text-center transition-all ${
                    active
                      ? "border-primary bg-primary/10 border-glow-pink"
                      : "border-border hover:border-secondary"
                  }`}
                >
                  <Icon
                    className={`size-5 mx-auto ${active ? "text-primary" : "text-muted-foreground"}`}
                  />
                  <div
                    className={`text-xs mt-1.5 font-medium ${active ? "text-primary" : "text-muted-foreground"}`}
                  >
                    {r.label}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-muted-foreground -mt-2">
            {ROLES.find((r) => r.id === role)!.desc}
          </p>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Email Address</label>
            <div className="relative">
              <Mail className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={`${role}@sis.com`}
                className="w-full bg-input border border-border focus:border-primary focus:border-glow-pink outline-none rounded-md pl-10 pr-3 py-2.5 text-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium">Password</label>
            <div className="relative">
              <Lock className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-secondary" />
              <input
                type={show ? "text" : "password"}
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-input border border-border focus:border-primary focus:border-glow-pink outline-none rounded-md pl-10 pr-10 py-2.5 text-sm"
              />
              <button
                type="button"
                onClick={() => setShow((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={busy}
            onMouseDown={() => sfx.click()}
            className="w-full flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-md transition-all hover:border-glow-pink disabled:opacity-60"
          >
            <LogIn className="size-4" />{" "}
            {busy
              ? "Please wait…"
              : mode === "login"
                ? `Sign In as ${ROLES.find((r) => r.id === role)!.label}`
                : `Sign Up as ${ROLES.find((r) => r.id === role)!.label}`}
          </button>

          <div className="text-center text-sm text-muted-foreground">
            {mode === "login" ? "Don't have an account? " : "Already have one? "}
            <button
              type="button"
              onClick={() => setMode((m) => (m === "login" ? "signup" : "login"))}
              className="text-primary hover:text-glow-pink font-medium"
            >
              {mode === "login" ? "Sign Up" : "Sign In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
