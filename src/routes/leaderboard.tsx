import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { calcGrade } from "@/lib/grade";
import { Trophy, Medal, Award, Star } from "lucide-react";

export const Route = createFileRoute("/leaderboard")({
  head: () => ({ meta: [{ title: "Leaderboard · SIS" }] }),
  component: () => (
    <AppShell>
      <Leaderboard />
    </AppShell>
  ),
});

type Student = {
  id: string;
  name: string;
  roll_no: string;
  marks: number;
  department: string;
  attendance: number;
};

function rankIcon(i: number) {
  if (i === 0) return { Icon: Trophy, color: "var(--neon-pink)" };
  if (i === 1) return { Icon: Medal, color: "var(--neon-blue)" };
  if (i === 2) return { Icon: Award, color: "oklch(0.78 0.18 60)" };
  return { Icon: Star, color: "var(--muted-foreground)" };
}

function Leaderboard() {
  const [items, setItems] = useState<Student[]>([]);
  useEffect(() => {
    supabase
      .from("students")
      .select("*")
      .order("marks", { ascending: false })
      .then(({ data }) => setItems((data as unknown as Student[]) ?? []));
  }, []);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-5xl font-bold gradient-text text-glow-pink">Leaderboard</h1>
        <p className="text-muted-foreground mt-2">Top performing students by marks</p>
      </header>

      {items.length === 0 && (
        <div className="neon-card rounded-xl p-12 text-center text-muted-foreground">
          Add students to see the leaderboard.
        </div>
      )}

      <div className="space-y-3">
        {items.map((s, i) => {
          const g = calcGrade(Number(s.marks));
          const { Icon, color } = rankIcon(i);
          const highlight = i < 3;
          return (
            <div
              key={s.id}
              className={`neon-card rounded-xl p-5 flex items-center gap-5 animate-rise ${highlight ? (i === 0 ? "border-glow-pink" : "border-glow-blue") : ""}`}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div
                className="size-14 rounded-full flex items-center justify-center border"
                style={{
                  borderColor: color,
                  background: `color-mix(in oklab, ${color} 15%, transparent)`,
                }}
              >
                <Icon className="size-6" style={{ color }} />
              </div>
              <div className="text-3xl font-bold font-mono text-muted-foreground w-16">
                #{i + 1}
              </div>
              <div className="flex-1">
                <div className="text-lg font-bold text-primary">{s.name}</div>
                <div className="text-xs text-muted-foreground font-mono mt-0.5 flex flex-wrap gap-x-3">
                  <span>Roll: {s.roll_no}</span>
                  <span>|</span>
                  <span>{s.department}</span>
                  <span>|</span>
                  <span>Attendance: {s.attendance}%</span>
                </div>
              </div>
              <div className="text-right">
                <div
                  className="text-3xl font-bold font-mono"
                  style={{ color: g.color, textShadow: `0 0 14px ${g.color}` }}
                >
                  {g.grade}
                </div>
                <div className="text-xs text-muted-foreground font-mono">{s.marks}/100</div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
