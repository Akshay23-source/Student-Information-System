import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { calcGrade } from "@/lib/grade";
import { Users, BarChart3, TrendingUp, Award, Trophy } from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard · SIS" }] }),
  component: () => (
    <AppShell>
      <Dashboard />
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

function Dashboard() {
  const [students, setStudents] = useState<Student[]>([]);
  useEffect(() => {
    supabase
      .from("students")
      .select("*")
      .then(({ data }) => setStudents((data as unknown as Student[]) ?? []));
  }, []);

  const total = students.length;
  const avg = total ? students.reduce((s, x) => s + Number(x.marks), 0) / total : 0;
  const pass = total ? (students.filter((s) => Number(s.marks) >= 50).length / total) * 100 : 0;
  const top = [...students].sort((a, b) => Number(b.marks) - Number(a.marks))[0];

  const gradeBuckets = ["A+", "A", "B", "C", "D", "Fail"]
    .map((g) => ({
      name: g,
      value: students.filter((s) => calcGrade(Number(s.marks)).grade === g).length,
    }))
    .filter((x) => x.value > 0);

  const deptData = Object.entries(
    students.reduce<Record<string, { sum: number; n: number }>>((acc, s) => {
      acc[s.department] = acc[s.department] ?? { sum: 0, n: 0 };
      acc[s.department].sum += Number(s.marks);
      acc[s.department].n += 1;
      return acc;
    }, {}),
  ).map(([dept, v]) => ({ dept, avg: Math.round(v.sum / v.n) }));

  const COLORS = [
    "oklch(0.68 0.27 350)",
    "oklch(0.82 0.15 220)",
    "oklch(0.78 0.18 160)",
    "oklch(0.78 0.18 90)",
    "oklch(0.75 0.16 60)",
    "oklch(0.65 0.25 25)",
  ];

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-5xl font-bold gradient-text text-glow-pink">Dashboard</h1>
        <p className="text-muted-foreground mt-2">Overview of student performance and analytics</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Users} label="Total Students" value={String(total)} accent="pink" />
        <StatCard icon={BarChart3} label="Average Marks" value={avg.toFixed(1)} accent="blue" />
        <StatCard
          icon={TrendingUp}
          label="Pass Percentage"
          value={`${pass.toFixed(1)}%`}
          accent="pink"
        />
        <StatCard icon={Award} label="Top Score" value={String(top?.marks ?? 0)} accent="blue" />
      </div>

      {top && (
        <div className="neon-card rounded-xl p-5 flex items-center gap-5 animate-rise">
          <div className="size-14 rounded-full bg-primary/20 flex items-center justify-center border border-primary/60">
            <Trophy className="size-7 text-primary" />
          </div>
          <div>
            <div className="text-xs tracking-widest text-secondary">★ TOP PERFORMER</div>
            <div className="text-2xl font-bold text-primary">{top.name}</div>
            <div className="text-xs text-muted-foreground font-mono">
              Roll: {top.roll_no} · Marks: {top.marks} · Grade: {calcGrade(Number(top.marks)).grade}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neon-card rounded-xl p-6">
          <h3 className="font-bold text-secondary mb-4">Grade Distribution</h3>
          {gradeBuckets.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <PieChart>
                  <Pie
                    data={gradeBuckets}
                    dataKey="value"
                    nameKey="name"
                    outerRadius={90}
                    label={(e) => `${e.name}: ${e.value}`}
                  >
                    {gradeBuckets.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </div>
        <div className="neon-card rounded-xl p-6">
          <h3 className="font-bold text-secondary mb-4">Department Performance</h3>
          {deptData.length ? (
            <div className="h-64">
              <ResponsiveContainer>
                <BarChart data={deptData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                  <XAxis dataKey="dept" stroke="var(--muted-foreground)" fontSize={11} />
                  <YAxis stroke="var(--muted-foreground)" fontSize={11} />
                  <Tooltip
                    contentStyle={{ background: "var(--card)", border: "1px solid var(--border)" }}
                  />
                  <Bar dataKey="avg" fill="var(--neon-pink)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <Empty />
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
  accent: "pink" | "blue";
}) {
  return (
    <div
      className={`neon-card rounded-xl p-5 ${accent === "blue" ? "border-glow-blue" : ""} animate-rise`}
    >
      <Icon className={`size-6 ${accent === "pink" ? "text-primary" : "text-secondary"}`} />
      <div
        className={`mt-3 text-3xl font-bold font-mono ${accent === "pink" ? "text-primary text-glow-pink" : "text-secondary text-glow-blue"}`}
      >
        {value}
      </div>
      <div className="text-xs text-muted-foreground mt-1">{label}</div>
    </div>
  );
}
function Empty() {
  return (
    <div className="h-64 flex items-center justify-center text-sm text-muted-foreground">
      No data yet — add students.
    </div>
  );
}
