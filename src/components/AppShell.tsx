import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Users,
  Trophy,
  Settings,
  LogOut,
  Sun,
  Moon,
  Volume2,
  VolumeX,
  GraduationCap,
  ScanLine,
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useRoles } from "@/hooks/use-roles";
import { useTheme } from "@/hooks/use-theme";
import { isMuted, setMuted, sfx } from "@/lib/sound";
import { toast } from "sonner";

const baseNav = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/students", label: "Students", icon: Users, staffOnly: true },
  { to: "/scan", label: "Scan QR", icon: ScanLine, staffOnly: true },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const loc = useLocation();
  const nav2 = useNavigate();
  const { user, loading } = useAuth();
  const { isStaff } = useRoles();
  const { theme, toggle } = useTheme();
  const [muted, setMutedState] = useState(false);

  useEffect(() => {
    setMutedState(isMuted());
  }, []);
  useEffect(() => {
    if (!loading && !user) nav2({ to: "/login" });
  }, [user, loading, nav2]);

  const logout = async () => {
    sfx.click();
    await supabase.auth.signOut();
    toast.success("Logged out");
    nav2({ to: "/login" });
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-64 shrink-0 border-r border-border/60 bg-sidebar flex flex-col p-5">
        <div className="flex items-center gap-2 mb-8">
          <GraduationCap className="size-7 text-primary" />
          <div>
            <div className="font-bold text-xl gradient-text leading-none">SIS</div>
            <div className="text-[10px] tracking-widest text-muted-foreground mt-1">
              STUDENT INFO SYSTEM
            </div>
          </div>
        </div>
        <nav className="flex flex-col gap-1">
          {baseNav
            .filter((n) => !n.staffOnly || isStaff)
            .map((n) => {
              const active = loc.pathname.startsWith(n.to);
              const Icon = n.icon;
              return (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => sfx.click()}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-all ${
                    active
                      ? "bg-primary/15 text-primary border border-primary/40 border-glow-pink"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className="size-4" />
                  {n.label}
                </Link>
              );
            })}
        </nav>
        <div className="mt-auto space-y-3">
          <div>
            <div className="text-[10px] tracking-widest text-muted-foreground">LOGGED IN AS</div>
            <div className="font-semibold text-primary truncate">{user.email}</div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                sfx.click();
                toggle();
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border border-border hover:border-secondary text-xs"
            >
              {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
            </button>
            <button
              onClick={() => {
                const n = !muted;
                setMuted(n);
                setMutedState(n);
              }}
              className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-md border border-border hover:border-secondary text-xs"
            >
              {muted ? <VolumeX className="size-4" /> : <Volume2 className="size-4" />}
            </button>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center justify-center gap-2 py-2 rounded-md border border-destructive/50 text-destructive hover:bg-destructive/10 text-sm font-medium"
          >
            <LogOut className="size-4" /> Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 overflow-x-hidden">
        <div className="p-6 md:p-10 max-w-7xl mx-auto animate-fade-in">{children}</div>
      </main>
    </div>
  );
}
