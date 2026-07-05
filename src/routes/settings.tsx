import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useAuth } from "@/hooks/use-auth";
import { useTheme } from "@/hooks/use-theme";
import { isMuted, setMuted, sfx } from "@/lib/sound";
import { User, Mail, Shield, Moon, Sun, Volume2, VolumeX } from "lucide-react";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings · SIS" }] }),
  component: () => (
    <AppShell>
      <Settings />
    </AppShell>
  ),
});

function Settings() {
  const { user } = useAuth();
  const { theme, toggle } = useTheme();
  const [muted, setMutedState] = useState(false);
  useEffect(() => setMutedState(isMuted()), []);

  return (
    <div className="space-y-6 max-w-3xl">
      <header>
        <h1 className="text-5xl font-bold gradient-text text-glow-pink">Settings</h1>
        <p className="text-muted-foreground mt-2">Manage your account and preferences</p>
      </header>

      <section className="neon-card rounded-xl p-6 space-y-4">
        <h2 className="text-xl font-bold text-secondary">Profile Information</h2>
        <Row icon={User} label="NAME" value={user?.email?.split("@")[0] ?? "—"} />
        <Row icon={Mail} label="EMAIL" value={user?.email ?? "—"} />
        <Row icon={Shield} label="ROLE" value="ADMIN" mono />
      </section>

      <section className="neon-card rounded-xl p-6 space-y-4 border-glow-blue">
        <h2 className="text-xl font-bold text-secondary">Preferences</h2>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {theme === "dark" ? (
              <Moon className="size-5 text-primary" />
            ) : (
              <Sun className="size-5 text-primary" />
            )}
            <div>
              <div className="font-semibold">Theme</div>
              <div className="text-xs text-muted-foreground">
                {theme === "dark" ? "Dark Mode" : "Light Mode"}
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              sfx.click();
              toggle();
            }}
            className="px-4 py-2 rounded border border-secondary text-secondary hover:border-glow-blue text-sm font-semibold"
          >
            Toggle Theme
          </button>
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {muted ? (
              <VolumeX className="size-5 text-primary" />
            ) : (
              <Volume2 className="size-5 text-primary" />
            )}
            <div>
              <div className="font-semibold">Sound Effects</div>
              <div className="text-xs text-muted-foreground">{muted ? "Muted" : "Enabled"}</div>
            </div>
          </div>
          <button
            onClick={() => {
              const n = !muted;
              setMuted(n);
              setMutedState(n);
              if (!n) sfx.click();
            }}
            className="px-4 py-2 rounded border border-secondary text-secondary hover:border-glow-blue text-sm font-semibold"
          >
            {muted ? "Unmute" : "Mute"}
          </button>
        </div>
      </section>

      <section className="neon-card rounded-xl p-6">
        <h2 className="text-xl font-bold text-secondary">About</h2>
        <p className="text-sm text-muted-foreground mt-2">
          Student Information System v1.0 — A futuristic command center for academic excellence.
          Track marks, calculate grades, rank students, and visualize performance with beautiful
          neon analytics.
        </p>
      </section>
    </div>
  );
}

function Row({
  icon: Icon,
  label,
  value,
  mono,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <Icon className="size-5 text-secondary" />
      <div>
        <div className="text-[10px] tracking-widest text-muted-foreground">{label}</div>
        <div className={`font-semibold text-primary ${mono ? "font-mono" : ""}`}>{value}</div>
      </div>
    </div>
  );
}
