import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";
import { Download, QrCode } from "lucide-react";

export function StudentQR({ studentId, rollNo }: { studentId: string; rollNo: string }) {
  const [open, setOpen] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [url, setUrl] = useState("");

  useEffect(() => {
    if (!open || !canvasRef.current) return;
    const target = `${window.location.origin}/student/${studentId}`;
    setUrl(target);
    QRCode.toCanvas(canvasRef.current, target, {
      width: 280,
      margin: 2,
      color: { dark: "#ff4fa3", light: "#0b0b14" },
    });
  }, [open, studentId]);

  const download = async () => {
    const target = `${window.location.origin}/student/${studentId}`;
    const dataUrl = await QRCode.toDataURL(target, {
      width: 600,
      margin: 2,
      color: { dark: "#ff4fa3", light: "#0b0b14" },
    });
    const a = document.createElement("a");
    a.href = dataUrl;
    a.download = `qr-${rollNo}.png`;
    a.click();
  };

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="p-2 rounded border border-border hover:border-primary text-primary"
        title="Show QR"
      >
        <QrCode className="size-4" />
      </button>
      {open && (
        <div
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in"
          onClick={() => setOpen(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neon-card rounded-xl p-6 text-center space-y-3 animate-rise"
          >
            <h3 className="font-bold gradient-text text-lg">Student QR · {rollNo}</h3>
            <p className="text-xs text-muted-foreground">
              Scan with a teacher/admin account to view full info
            </p>
            <div className="bg-[#0b0b14] p-3 rounded-lg inline-block border border-primary/40 border-glow-pink">
              <canvas ref={canvasRef} />
            </div>
            <div className="text-[10px] text-muted-foreground font-mono break-all">{url}</div>
            <div className="flex gap-2 justify-center pt-2">
              <button
                onClick={download}
                className="flex items-center gap-2 px-3 py-2 rounded bg-primary text-primary-foreground text-sm font-semibold"
              >
                <Download className="size-4" /> Download
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-3 py-2 rounded border border-border text-sm"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
