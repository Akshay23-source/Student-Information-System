import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { Html5Qrcode } from "html5-qrcode";
import { useRoles } from "@/hooks/use-roles";
import { ScanLine, Camera } from "lucide-react";
import { sfx } from "@/lib/sound";
import { toast } from "sonner";

export const Route = createFileRoute("/scan")({
  head: () => ({ meta: [{ title: "Scan QR · SIS" }] }),
  component: () => (
    <AppShell>
      <Scan />
    </AppShell>
  ),
});

function Scan() {
  const { isStaff, loading } = useRoles();
  const nav = useNavigate();
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = async () => {
    setError(null);
    try {
      const el = document.getElementById("qr-reader");
      if (!el) return;
      const s = new Html5Qrcode("qr-reader");
      scannerRef.current = s;
      await s.start(
        { facingMode: "environment" },
        { fps: 10, qrbox: 250 },
        (decoded) => {
          sfx.success();
          try {
            const url = new URL(decoded);
            const m = url.pathname.match(/\/student\/([0-9a-f-]+)/i);
            if (m) {
              s.stop().then(() => {
                scannerRef.current = null;
                setScanning(false);
                nav({ to: "/student/$id", params: { id: m[1] } });
              });
              return;
            }
          } catch (err) {
            console.debug("Failed to parse decoded QR code as URL:", err);
          }
          toast.error("Unrecognized QR code");
        },
        () => {},
      );
      setScanning(true);
    } catch (e) {
      const err = e as Error;
      setError(err.message || "Camera not available");
    }
  };

  const stop = async () => {
    if (scannerRef.current) {
      await scannerRef.current.stop().catch(() => {});
      scannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(
    () => () => {
      stop();
    },
    [],
  );

  if (loading) return <div className="text-muted-foreground">Loading…</div>;
  if (!isStaff)
    return (
      <div className="neon-card rounded-xl p-10 text-center">
        <p className="text-muted-foreground">Only teachers and admins can scan student QR codes.</p>
      </div>
    );

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-5xl font-bold gradient-text text-glow-pink">Scan QR</h1>
        <p className="text-muted-foreground mt-2">
          Point your camera at a student's QR code to load their full profile.
        </p>
      </div>

      <div className="neon-card rounded-xl p-6">
        <div
          id="qr-reader"
          className="w-full rounded-lg overflow-hidden bg-black min-h-[300px] flex items-center justify-center"
        >
          {!scanning && <ScanLine className="size-16 text-primary/40" />}
        </div>
        {error && <p className="text-destructive text-sm mt-3">{error}</p>}
        <div className="flex gap-2 mt-4">
          {!scanning ? (
            <button
              onClick={start}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-4 py-2.5 rounded-md hover:border-glow-pink"
            >
              <Camera className="size-4" /> Start Scanner
            </button>
          ) : (
            <button
              onClick={stop}
              className="px-4 py-2.5 rounded-md border border-destructive/50 text-destructive"
            >
              Stop
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
