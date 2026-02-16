"use client";

import { useState } from "react";
import SecretMessageDialog from "./SecretMessageDialog";

export default function SecretMessageLanding() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full rounded-full border border-pink-400/20 bg-pink-950/40 px-6 py-3 text-sm backdrop-blur-md transition-all duration-300 hover:border-pink-400/40 hover:bg-pink-950/60 active:scale-[0.98] animate-[heartbeatLanding_1.8s_ease-in-out_infinite]"
        style={{ fontFamily: "Georgia, 'Times New Roman', serif", fontStyle: "italic" }}
      >
        <span className="text-pink-200">💌 secret message</span>
      </button>

      {open && <SecretMessageDialog onClose={() => setOpen(false)} />}

      <style jsx global>{`
        @keyframes heartbeatLanding {
          0%   { box-shadow: 0 0 8px rgba(236,72,153,0.1);  border-color: rgba(244,114,182,0.15); }
          10%  { box-shadow: 0 0 18px rgba(236,72,153,0.25); border-color: rgba(244,114,182,0.3); }
          18%  { box-shadow: 0 0 8px rgba(236,72,153,0.1);  border-color: rgba(244,114,182,0.15); }
          28%  { box-shadow: 0 0 22px rgba(236,72,153,0.3);  border-color: rgba(244,114,182,0.35); }
          42%  { box-shadow: 0 0 6px rgba(236,72,153,0.08); border-color: rgba(244,114,182,0.12); }
          100% { box-shadow: 0 0 6px rgba(236,72,153,0.08); border-color: rgba(244,114,182,0.12); }
        }
      `}</style>
    </>
  );
}
