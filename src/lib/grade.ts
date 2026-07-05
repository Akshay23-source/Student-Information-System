export function calcGrade(marks: number): { grade: string; pass: boolean; color: string } {
  if (marks >= 90) return { grade: "A+", pass: true, color: "var(--neon-pink)" };
  if (marks >= 80) return { grade: "A", pass: true, color: "var(--neon-blue)" };
  if (marks >= 70) return { grade: "B", pass: true, color: "oklch(0.78 0.18 160)" };
  if (marks >= 60) return { grade: "C", pass: true, color: "oklch(0.78 0.18 90)" };
  if (marks >= 50) return { grade: "D", pass: true, color: "oklch(0.75 0.16 60)" };
  return { grade: "Fail", pass: false, color: "oklch(0.65 0.25 25)" };
}
