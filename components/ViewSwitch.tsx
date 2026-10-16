"use client";

import { useEffect, useSyncExternalStore } from "react";

/*
  Desktop / Mobile view switch.

  - On a phone, "Desktop" reloads the page with a 1280px-wide viewport, so the full
    laptop layout is shown (the inline script in layout.tsx applies it before paint).
  - On a laptop, "Mobile" opens the current page inside a phone-sized frame, so the
    real phone layout is shown (CSS breakpoints react to the frame's width).
  The choice is remembered on this device. Inside the phone frame the switch is hidden.
*/

const VIEW_KEY = "view-mode";
const PHONE_MAX = 767;

type Mode = "auto" | "desktop" | "mobile";

function readMode(): Mode {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === "desktop" || v === "mobile" ? v : "auto";
  } catch {
    return "auto";
  }
}

function saveMode(m: Mode) {
  try {
    if (m === "auto") localStorage.removeItem(VIEW_KEY);
    else localStorage.setItem(VIEW_KEY, m);
  } catch {
    /* storage blocked: the switch still works for this page view */
  }
}

function frameUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set("view", "frame");
  return url.pathname + url.search + url.hash;
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  window.addEventListener("storage", cb);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", cb);
  };
}
function notify() {
  listeners.forEach((cb) => cb());
}

/** Browser-only facts packed into one string so the snapshot is stable between renders. */
function getSnapshot(): string {
  const framed =
    window.self !== window.top || new URLSearchParams(window.location.search).get("view") === "frame";
  // screen size stays the device's real size even when the desktop viewport is forced
  const phone = Math.min(window.screen.width, window.screen.height) <= PHONE_MAX;
  return `${readMode()}|${phone ? 1 : 0}|${framed ? 1 : 0}`;
}
function getServerSnapshot(): string | null {
  return null;
}

export default function ViewSwitch() {
  const snap = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const [mode, phoneFlag, frameFlag] = (snap ?? "auto|0|1").split("|") as [Mode, string, string];
  const isPhone = phoneFlag === "1";
  const inFrame = frameFlag === "1";
  const phonePreview = snap !== null && !isPhone && mode === "mobile" && !inFrame;
  const src = phonePreview ? frameUrl() : "";

  useEffect(() => {
    if (!phonePreview) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        saveMode("auto");
        notify();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.documentElement.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [phonePreview]);

  function choose(target: "desktop" | "mobile") {
    if (isPhone) {
      const next: Mode = target === "desktop" ? "desktop" : "auto";
      if (next === mode) return;
      saveMode(next);
      window.location.reload();
      return;
    }
    saveMode(target === "mobile" ? "mobile" : "auto");
    notify();
  }

  if (snap === null || inFrame) return null;

  const showingDesktop = isPhone ? mode === "desktop" : mode !== "mobile";

  return (
    <>
      <div
        role="group"
        aria-label="Choose desktop or mobile view"
        className="view-switch fixed bottom-4 right-4 z-[60] flex rounded-full border border-ink/15 bg-paper/90 p-1 text-xs shadow-[0_6px_24px_-12px_rgba(28,35,49,0.45)] backdrop-blur-md print:hidden"
      >
        {(["desktop", "mobile"] as const).map((t) => {
          const active = (t === "desktop") === showingDesktop;
          return (
            <button
              key={t}
              type="button"
              aria-pressed={active}
              onClick={() => choose(t)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 font-medium transition-colors duration-300 ${
                active ? "bg-ink text-paper" : "text-stone hover:text-ink"
              }`}
            >
              {t === "desktop" ? <MonitorIcon /> : <PhoneIcon />}
              {t === "desktop" ? "Desktop" : "Mobile"}
            </button>
          );
        })}
      </div>

      {phonePreview && src && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Mobile view preview"
          className="view-preview fixed inset-0 z-[55] flex flex-col items-center justify-center gap-4 bg-paper-deep/95 px-4 py-6 backdrop-blur-sm"
        >
          <div className="flex w-full max-w-[400px] items-center justify-between gap-4">
            <p className="text-sm font-medium text-ink">Mobile view</p>
            <button type="button" onClick={() => choose("desktop")} className="btn btn-line min-h-0 py-1.5 text-xs">
              Back to desktop
            </button>
          </div>
          <div className="view-phone overflow-hidden rounded-[2rem] border-[10px] border-ink bg-paper shadow-[0_30px_60px_-30px_rgba(28,35,49,0.6)]">
            <iframe src={src} title="This page in mobile view" className="block h-full w-full border-0" />
          </div>
        </div>
      )}
    </>
  );
}

function MonitorIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="3" y="4" width="18" height="12" rx="1.5" />
      <path d="M8 20h8M12 16v4" />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <rect x="7" y="2.5" width="10" height="19" rx="2" />
      <path d="M11 18.5h2" />
    </svg>
  );
}
