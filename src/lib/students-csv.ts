import { calcGrade } from "./grade";

type StudentRow = {
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

const esc = (v: unknown) => {
  const s = v == null ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export function downloadStudentsCSV(rows: StudentRow[]) {
  const headers = [
    "Name",
    "Roll No",
    "Age",
    "Department",
    "Email",
    "Phone",
    "Address",
    "Marks",
    "Grade",
    "Pass/Fail",
    "Attendance (%)",
  ];
  const lines = [headers.join(",")];
  for (const s of rows) {
    const g = calcGrade(Number(s.marks));
    lines.push(
      [
        s.name,
        s.roll_no,
        s.age,
        s.department,
        s.email ?? "",
        s.phone ?? "",
        s.address ?? "",
        s.marks,
        g.grade,
        g.pass ? "PASS" : "FAIL",
        s.attendance,
      ]
        .map(esc)
        .join(","),
    );
  }
  const blob = new Blob(["\ufeff" + lines.join("\n")], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  const ts = new Date().toISOString().slice(0, 10);
  a.href = url;
  a.download = `students-${ts}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
