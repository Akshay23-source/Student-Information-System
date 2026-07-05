// Tiny WebAudio click/success/error sounds — no asset files needed.
let ctx: AudioContext | null = null;
function ac() {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new (
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    )();
  }
  return ctx;
}

export function isMuted() {
  if (typeof window === "undefined") return false;
  return localStorage.getItem("sis-muted") === "1";
}
export function setMuted(m: boolean) {
  localStorage.setItem("sis-muted", m ? "1" : "0");
}

function tone(freq: number, dur = 0.08, type: OscillatorType = "sine", gain = 0.06) {
  if (isMuted()) return;
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(c.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + dur);
  o.stop(c.currentTime + dur);
}

export const sfx = {
  click: () => tone(620, 0.05, "triangle", 0.04),
  success: () => {
    tone(660, 0.09, "sine", 0.06);
    setTimeout(() => tone(880, 0.12, "sine", 0.06), 80);
  },
  error: () => {
    tone(220, 0.12, "sawtooth", 0.05);
    setTimeout(() => tone(160, 0.18, "sawtooth", 0.05), 90);
  },
  reveal: () => {
    tone(523, 0.08);
    setTimeout(() => tone(659, 0.08), 80);
    setTimeout(() => tone(784, 0.14), 160);
  },
};
