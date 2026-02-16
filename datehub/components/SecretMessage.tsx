"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";
import SecretMessageDialog from "./SecretMessageDialog";

export default function SecretMessage() {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [proximity, setProximity] = useState(0);

  const handlePointer = useCallback((e: MouseEvent | TouchEvent) => {
    if (!btnRef.current) return;
    const rect = btnRef.current.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let px: number, py: number;
    if ("touches" in e) {
      px = e.touches[0].clientX;
      py = e.touches[0].clientY;
    } else {
      px = e.clientX;
      py = e.clientY;
    }

    const dist = Math.sqrt((px - cx) ** 2 + (py - cy) ** 2);
    const maxDist = 400;
    setProximity(Math.max(0, Math.min(1, 1 - dist / maxDist)));
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", handlePointer);
    window.addEventListener("touchmove", handlePointer);
    return () => {
      window.removeEventListener("mousemove", handlePointer);
      window.removeEventListener("touchmove", handlePointer);
    };
  }, [handlePointer]);

  if (!isSignedIn) return null;

  const speed = 1.8 - proximity * 1.4;
  const intensity = 1 + proximity * 2;

  return (
    <>
      <button
        ref={btnRef}
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-1.5 rounded-full border bg-pink-950/60 px-4 py-2 backdrop-blur-md transition-transform duration-300 hover:scale-105 active:scale-95"
        style={{
          animation: `heartbeat ${speed}s ease-in-out infinite`,
          ["--glow" as string]: intensity,
        }}
      >
        <span className="text-base">💌</span>
        <span
          className="text-[13px] tracking-wide text-pink-200"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
        >
          secret message
        </span>
      </button>

      {open && <SecretMessageDialog onClose={() => setOpen(false)} />}

      <style jsx global>{`
        @keyframes heartbeat {
          0%   {
            box-shadow: 0 0 calc(8px * var(--glow, 1)) rgba(236,72,153, calc(0.1 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.15 * var(--glow, 1)));
          }
          10%  {
            box-shadow: 0 0 calc(18px * var(--glow, 1)) rgba(236,72,153, calc(0.35 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.4 * var(--glow, 1)));
          }
          18%  {
            box-shadow: 0 0 calc(8px * var(--glow, 1)) rgba(236,72,153, calc(0.1 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.15 * var(--glow, 1)));
          }
          28%  {
            box-shadow: 0 0 calc(22px * var(--glow, 1)) rgba(236,72,153, calc(0.4 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.45 * var(--glow, 1)));
          }
          42%  {
            box-shadow: 0 0 calc(6px * var(--glow, 1)) rgba(236,72,153, calc(0.08 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.12 * var(--glow, 1)));
          }
          100% {
            box-shadow: 0 0 calc(6px * var(--glow, 1)) rgba(236,72,153, calc(0.08 * var(--glow, 1)));
            border-color: rgba(244,114,182, calc(0.12 * var(--glow, 1)));
          }
        }
      `}</style>
    </>
  );
}
