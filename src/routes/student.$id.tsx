import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { calcGrade } from "@/lib/grade";
import { downloadStudentPDF } from "@/lib/student-export";
import { useRoles } from "@/hooks/use-roles";
import {
  ArrowLeft,
  Download,
  Mail,
  Phone,
  MapPin,
  Calendar,
  GraduationCap,
  Percent,
} from "lucide-react";
import { sfx } from "@/lib/sound";

export const Route = createFileRoute("/student/$id")({
  head: () => ({ meta: [{ title: "Student Profile · SIS" }] }),
  component: () => (
    <AppShell>
      <StudentDetail />
    </AppShell>
  ),
});

type Student = {
  id: string;
  name: string;
  age: number;
  roll_no: string;
  marks: number;
  department: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  attendance: number;
};

function StudentDetail() {
  const { id } = Route.useParams();
  const { isStaff, loading: rolesLoading } = useRoles();
  const [s, setS] = useState<Student | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("students")
      .select("*")
      .eq("id", id)
      .maybeSingle()
      .then(({ data }) => {
        setS(data);
        setLoading(false);
      });
  }, [id]);

  if (loading || rolesLoading) return <div className="text-muted-foreground">Loading…</div>;
  if (!s)
    return (
      <div className="neon-card rounded-xl p-10 text-center">
        <p className="text-muted-foreground">Student not found or you don't have access.</p>
        <Link to="/dashboard" className="text-primary text-sm hover:underline mt-3 inline-block">
          ← Back to dashboard
        </Link>
      </div>
    );

  const g = calcGrade(Number(s.marks));

  return (
    <div className="space-y-6 max-w-3xl">
      <Link
        to="/students"
        className="inline-flex items-center gap-2 text-sm text-secondary hover:text-primary"
      >
        <ArrowLeft className="size-4" /> Back
      </Link>

      <div className="neon-card rounded-2xl p-8 animate-rise">
        <div className="flex flex-wrap items-start gap-6">
          <div className="size-24 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-4xl font-bold text-background">
            {s.name.charAt(0).toUpperCase()}
          </div>
          <div className="flex-1 min-w-[200px]">
            <h1 className="text-4xl font-bold gradient-text text-glow-pink">{s.name}</h1>
            <p className="text-muted-foreground font-mono text-sm mt-1">Roll No: {s.roll_no}</p>
            <span className="inline-block mt-2 text-xs tracking-wider px-2 py-1 rounded bg-secondary/20 text-secondary border border-secondary/40">
              {s.department}
            </span>
          </div>
          <div className="text-center">
            <div
              className="text-6xl font-bold font-mono"
              style={{ color: g.color, textShadow: `0 0 20px ${g.color}` }}
            >
              {g.grade}
            </div>
            <div className="text-xs text-muted-foreground font-mono">
              {s.marks}/100 · {g.pass ? "PASS" : "FAIL"}
            </div>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mt-8">
          <Info icon={Calendar} label="Age" value={s.age} />
          <Info icon={Percent} label="Attendance" value={`${s.attendance}%`} />
          <Info icon={Mail} label="Email" value={s.email || "—"} />
          <Info icon={Phone} label="Phone" value={s.phone || "—"} />
          <Info icon={MapPin} label="Address" value={s.address || "—"} className="sm:col-span-2" />
          <Info
            icon={GraduationCap}
            label="Department"
            value={s.department}
            className="sm:col-span-2"
          />
        </div>

        {isStaff && (
          <div className="mt-8 pt-6 border-t border-border/60 flex justify-end">
            <button
              onClick={() => {
                sfx.success();
                downloadStudentPDF(s);
              }}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:border-glow-pink transition-all"
            >
              <Download className="size-4" /> Download Student Details (PDF)
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function Info({
  icon: Icon,
  label,
  value,
  className = "",
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | number;
  className?: string;
}) {
  return (
    <div className={`bg-input/40 border border-border rounded-lg p-4 ${className}`}>
      <div className="flex items-center gap-2 text-xs text-secondary tracking-wider mb-1">
        <Icon className="size-3" /> {label.toUpperCase()}
      </div>
      <div className="text-sm font-medium break-words">{value}</div>
    </div>
  );
}
