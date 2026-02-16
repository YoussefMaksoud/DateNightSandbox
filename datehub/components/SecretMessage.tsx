"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@clerk/nextjs";

const MESSAGE_LINES = [
  "My dearest sweetie baby 🧸💕",
  "",
  "This might just be the cheesiest BUT most original gift I've ever had 🧀✨ I really tried to personalize it for us. And I tried / am trying to capture different moods you have (studying 📚, iPad baby 🎨, artsy 🖌️, talkative 💬). And now we can build onto it together as we come up with things to do!",
  "",
  "I don't like being apart from you, I don't like not knowing with you, cause truthfully I feel like I'm with my other half with you 🫶",
  "",
  "22 is a big one. I wanna be here for all of it. Your successes 🏆, your hardships. I wanna celebrate with you, and build with you and blah blah blah you know the rest of the spiel 😏💗",
  "",
  "I love you more than I can put into words, more than there's bits in a terabyte 💾, more than there's grains of sand on the world's beaches 🏖️. I miss you more than I express my love (somehow) 🥺",
  "",
  "Happy Birthday Sweetie Baby 🎂👑🎀",
  "",
  "Love, Youssef Abdel Maksoud 💌",
];

export default function SecretMessage() {
  const { isSignedIn } = useUser();
  const [open, setOpen] = useState(false);
  const btnRef = useRef<HTMLButtonElement>(null);
  const [proximity, setProximity] = useState(0); // 0 = far, 1 = on top

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

  // Map proximity to animation speed: 1.8s (far) → 0.4s (close)
  const speed = 1.8 - proximity * 1.4;
  // Map proximity to glow intensity: 1 (far) → 3 (close)
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

      {open && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        >
          <div
            className="relative mx-4 max-w-md animate-[fadeScale_0.3s_ease-out] overflow-hidden rounded-2xl border border-pink-400/25 bg-gradient-to-b from-[#1f0a18] via-[#150810] to-[#0d0710] p-8 shadow-2xl shadow-pink-500/15"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Sparkle accents */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-pink-500/[0.07] blur-2xl" />
              <div className="absolute -bottom-8 -left-8 h-28 w-28 rounded-full bg-purple-500/[0.06] blur-2xl" />
              <div className="absolute right-8 top-12 animate-pulse text-[10px] opacity-40">✨</div>
              <div className="absolute left-6 top-20 animate-pulse text-[10px] opacity-30" style={{ animationDelay: "0.5s" }}>✨</div>
              <div className="absolute bottom-16 right-12 animate-pulse text-[10px] opacity-35" style={{ animationDelay: "1s" }}>✨</div>
              <div className="absolute bottom-24 left-10 animate-pulse text-[10px] opacity-25" style={{ animationDelay: "1.5s" }}>💫</div>
            </div>

            {/* Crown + hearts header */}
            <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2">
              <span className="text-2xl animate-[float_3s_ease-in-out_infinite]">👑</span>
            </div>

            {/* Decorative top border shimmer */}
            <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />

            <div className="relative mt-3 space-y-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {MESSAGE_LINES.map((line, i) => {
                if (line === "") return <div key={i} className="h-3" />;

                // Style the greeting and sign-off differently
                const isGreeting = i === 0;
                const isSignOff = i >= MESSAGE_LINES.length - 3;

                return (
                  <p
                    key={i}
                    className={`leading-relaxed ${
                      isGreeting
                        ? "text-center text-xl font-semibold text-pink-200"
                        : isSignOff
                          ? "text-center text-base text-pink-300/90 italic"
                          : "text-[15px] text-pink-100/80"
                    }`}
                  >
                    {line}
                  </p>
                );
              })}
            </div>

            {/* Decorative bottom border shimmer */}
            <div className="mt-6 h-[1px] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

            <button
              onClick={() => setOpen(false)}
              className="mx-auto mt-4 block rounded-full border border-pink-400/15 bg-pink-500/10 px-6 py-2 text-xs font-medium text-pink-300 transition-all hover:bg-pink-500/20 hover:border-pink-400/30"
            >
              close 💗
            </button>
          </div>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
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
