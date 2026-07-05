import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { calcGrade } from "@/lib/grade";
import {
  Plus,
  Search,
  Pencil,
  Trash2,
  X,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Download,
  FileSpreadsheet,
} from "lucide-react";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";
import { StudentQR } from "@/components/StudentQR";
import { downloadStudentPDF } from "@/lib/student-export";
import { downloadStudentsCSV } from "@/lib/students-csv";
import { useRoles } from "@/hooks/use-roles";

export const Route = createFileRoute("/students")({
  head: () => ({ meta: [{ title: "Students · SIS" }] }),
  component: () => (
    <AppShell>
      <Students />
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

const DEPTS = ["Computer Science", "Electrical", "Mechanical", "Civil", "Electronics", "Chemical"];
const empty: Omit<Student, "id"> = {
  name: "",
  age: 20,
  roll_no: "",
  marks: 0,
  department: DEPTS[0],
  email: "",
  phone: "",
  address: "",
  attendance: 100,
};

function Students() {
  const { isStaff } = useRoles();
  const [items, setItems] = useState<Student[]>([]);
  const [q, setQ] = useState("");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState<Omit<Student, "id">>(empty);

  const load = async () => {
    const { data } = await supabase
      .from("students")
      .select("*")
      .order("marks", { ascending: false });
    setItems((data as unknown as Student[]) ?? []);
  };
  useEffect(() => {
    load();
  }, []);

  const ranked = useMemo(() => {
    const sorted = [...items].sort((a, b) => Number(b.marks) - Number(a.marks));
    const rankMap = new Map(sorted.map((s, i) => [s.id, i + 1]));
    return items
      .map((s) => ({ ...s, rank: rankMap.get(s.id)! }))
      .filter((s) => {
        const t = q.toLowerCase();
        return (
          !t ||
          s.name.toLowerCase().includes(t) ||
          s.roll_no.toLowerCase().includes(t) ||
          (s.email ?? "").toLowerCase().includes(t)
        );
      });
  }, [items, q]);

  const openNew = () => {
    sfx.click();
    setEditing(null);
    setForm(empty);
    setOpen(true);
  };
  const openEdit = (s: Student) => {
    sfx.click();
    setEditing(s);
    const { id: _, ...rest } = s;
    setForm(rest);
    setOpen(true);
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editing) {
        const { error } = await supabase
          .from("students")
          .update(form as unknown as Omit<Student, "id">)
          .eq("id", editing.id);
        if (error) throw error;
        toast.success("Student updated");
      } else {
        const { error } = await supabase
          .from("students")
          .insert(form as unknown as Omit<Student, "id">);
        if (error) throw error;
        sfx.success();
        toast.success("Student added");
      }
      setOpen(false);
      load();
    } catch (err) {
      const error = err as Error;
      sfx.error();
      toast.error(error.message);
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this student?")) return;
    const { error } = await supabase.from("students").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Deleted");
      load();
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-5xl font-bold gradient-text text-glow-pink">Students</h1>
          <p className="text-muted-foreground mt-2">Manage student records and information</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {isStaff && (
            <button
              onClick={() => {
                if (ranked.length === 0) {
                  toast.error("No students to export");
                  return;
                }
                sfx.success();
                downloadStudentsCSV(ranked);
                toast.success(
                  `Exported ${ranked.length} student${ranked.length === 1 ? "" : "s"} to CSV`,
                );
              }}
              className="flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-secondary-foreground font-semibold px-4 py-2.5 rounded-md hover:border-glow-blue transition-all"
              title="Export all students as CSV"
            >
              <FileSpreadsheet className="size-4" /> Export CSV
            </button>
          )}
          <button
            onClick={openNew}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:border-glow-pink transition-all"
          >
            <Plus className="size-4" /> Add Student
          </button>
        </div>
      </div>

      <div className="relative">
        <Search className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-primary" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search by name, roll number, or email…"
          className="w-full bg-input border border-border rounded-md pl-10 pr-3 py-2.5 text-sm focus:border-primary outline-none"
        />
      </div>

      {ranked.length === 0 ? (
        <div className="neon-card rounded-xl p-16 text-center text-muted-foreground">
          No students added yet. Click{" "}
          <span className="text-primary font-semibold">"Add Student"</span> to get started.
        </div>
      ) : (
        <div className="grid gap-3">
          {ranked.map((s, i) => {
            const g = calcGrade(Number(s.marks));
            return (
              <div
                key={s.id}
                className="neon-card rounded-xl p-5 flex flex-wrap items-center gap-4 animate-rise"
                style={{ animationDelay: `${i * 40}ms` }}
              >
                <div className="flex-1 min-w-[200px]">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-lg font-bold text-primary">{s.name}</h3>
                    <span className="text-[10px] tracking-wider px-2 py-0.5 rounded bg-secondary/20 text-secondary border border-secondary/40">
                      Rank #{s.rank}
                    </span>
                  </div>
                  <div className="text-xs text-muted-foreground font-mono mt-1.5 flex flex-wrap gap-x-3 gap-y-1">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      Roll: {s.roll_no}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="size-3" />
                      {s.phone || "—"}
                    </span>
                  </div>
                </div>
                <div className="text-xs text-muted-foreground font-mono space-y-1 min-w-[180px]">
                  <div className="flex items-center gap-1">
                    <Mail className="size-3" />
                    {s.email || "—"}
                  </div>
                  <div className="flex items-center gap-1">
                    <MapPin className="size-3" />
                    {s.department}
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
                <div className="flex gap-2 flex-wrap">
                  <StudentQR studentId={s.id} rollNo={s.roll_no} />
                  <button
                    onClick={() => {
                      sfx.success();
                      downloadStudentPDF(s);
                    }}
                    className="p-2 rounded border border-border hover:border-primary text-primary"
                    title="Download PDF"
                  >
                    <Download className="size-4" />
                  </button>
                  <button
                    onClick={() => openEdit(s)}
                    className="p-2 rounded border border-border hover:border-secondary text-secondary"
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    onClick={() => remove(s.id)}
                    className="p-2 rounded border border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="size-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <form
            onSubmit={save}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-lg neon-card rounded-xl p-6 space-y-4 animate-rise"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold gradient-text">
                {editing ? "Edit Student" : "Add New Student"}
              </h2>
              <button type="button" onClick={() => setOpen(false)}>
                <X className="size-4 text-muted-foreground" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name *">
                <input
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Age *">
                <input
                  required
                  type="number"
                  value={form.age}
                  onChange={(e) => setForm({ ...form, age: +e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Roll Number *">
                <input
                  required
                  value={form.roll_no}
                  onChange={(e) => setForm({ ...form, roll_no: e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Marks (0–100) *">
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  value={form.marks}
                  onChange={(e) => setForm({ ...form, marks: +e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Department *">
                <select
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                  className={inp}
                >
                  {DEPTS.map((d) => (
                    <option key={d} value={d}>
                      {d}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Attendance % *">
                <input
                  required
                  type="number"
                  min={0}
                  max={100}
                  value={form.attendance}
                  onChange={(e) => setForm({ ...form, attendance: +e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Email">
                <input
                  type="email"
                  value={form.email ?? ""}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className={inp}
                />
              </Field>
              <Field label="Phone">
                <input
                  value={form.phone ?? ""}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                  className={inp}
                />
              </Field>
              <div className="col-span-2">
                <Field label="Address">
                  <input
                    value={form.address ?? ""}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className={inp}
                  />
                </Field>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="px-4 py-2 rounded border border-border text-sm hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded bg-primary text-primary-foreground font-semibold text-sm hover:border-glow-pink"
              >
                {editing ? "Save" : "Add Student"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

const inp =
  "w-full bg-input border border-border rounded-md px-3 py-2 text-sm focus:border-primary outline-none";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs text-secondary block mb-1">{label}</span>
      {children}
    </label>
  );
}
