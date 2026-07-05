import jsPDF from "jspdf";
import { calcGrade } from "./grade";

export type StudentLike = {
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

export function downloadStudentPDF(s: StudentLike) {
  const g = calcGrade(Number(s.marks));
  const doc = new jsPDF();

  // Header band
  doc.setFillColor(255, 105, 180);
  doc.rect(0, 0, 210, 28, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.text("STUDENT INFORMATION SYSTEM", 105, 13, { align: "center" });
  doc.setFontSize(10);
  doc.text("Official Student Record", 105, 21, { align: "center" });

  doc.setTextColor(20, 20, 20);
  doc.setFontSize(16);
  doc.text(s.name, 14, 44);
  doc.setFontSize(10);
  doc.setTextColor(120, 120, 120);
  doc.text(`Roll No: ${s.roll_no}`, 14, 51);

  const rows: [string, string][] = [
    ["Age", String(s.age)],
    ["Department", s.department],
    ["Email", s.email || "—"],
    ["Phone", s.phone || "—"],
    ["Address", s.address || "—"],
    ["Marks", `${s.marks} / 100`],
    ["Grade", `${g.grade} (${g.pass ? "PASS" : "FAIL"})`],
    ["Attendance", `${s.attendance}%`],
  ];

  let y = 64;
  doc.setDrawColor(230, 230, 230);
  doc.line(14, y - 6, 196, y - 6);
  doc.setFontSize(11);
  rows.forEach(([k, v]) => {
    doc.setTextColor(120, 120, 120);
    doc.text(k, 14, y);
    doc.setTextColor(20, 20, 20);
    doc.text(String(v), 70, y);
    y += 9;
  });

  doc.setTextColor(150, 150, 150);
  doc.setFontSize(8);
  doc.text(`Generated ${new Date().toLocaleString()}`, 14, 285);

  doc.save(`student-${s.roll_no}.pdf`);
}
