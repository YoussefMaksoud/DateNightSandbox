"use client";

const MESSAGE_LINES = [
  "HAPPY BIRTHDAY SWEETIE BABY!! 🧸💕",
  "",
  "HELLO Cutiest of cutie pies,",
  "",
  "This might just be the cheesiest BUT most original gift I've given had 🧀✨ I really tried to personalize it for you. I tried / am trying to capture different moods you have (studying 📚, iPad baby 🎨, artsy 🖌️, talkative 💬). And now we can build onto it together as we come up with things to do!",
  "",
  "I don't like being apart from you, I don't like not knowing with you, cause truthfully I feel like I'm with my other half with you 🫶",
  "",
  "22 is a big one. I wanna be here for all of it. Your successes 🏆, your hardships. I wanna celebrate with you, and build with you and blah blah blah you know the rest of the spiel 😏💗",
  "",
  "I love you more than I can put into words, more than there's bits in a terabyte 💾, more than there's grains of sand on the world's beaches 🏖️. I miss you more than I express angel (somehow)",
  "",
  "Happy Birthday Olivia Williams 🎂👑🎀",
  "",
  "Love, Youssef Abdel Maksoud 💌",
];

export default function SecretMessageDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="relative w-full sm:mx-4 sm:max-w-md max-h-[85dvh] flex flex-col animate-[fadeSlideUp_0.3s_ease-out] sm:animate-[fadeScale_0.3s_ease-out] overflow-hidden rounded-t-2xl sm:rounded-2xl border border-pink-400/25 bg-gradient-to-b from-[#1f0a18] via-[#150810] to-[#0d0710] shadow-2xl shadow-pink-500/15"
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

        {/* Crown header */}
        <div className="pointer-events-none absolute -top-1 left-1/2 -translate-x-1/2">
          <span className="text-2xl animate-[float_3s_ease-in-out_infinite]">👑</span>
        </div>

        {/* Top shimmer */}
        <div className="absolute left-0 right-0 top-0 h-[1px] bg-gradient-to-r from-transparent via-pink-400/40 to-transparent" />

        {/* Scrollable content */}
        <div className="overflow-y-auto overscroll-contain p-6 sm:p-8 pt-8 sm:pt-8">
          <div className="relative space-y-1" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
            {MESSAGE_LINES.map((line, i) => {
              if (line === "") return <div key={i} className="h-2 sm:h-3" />;

              const isGreeting = i === 0;
              const isSignOff = i >= MESSAGE_LINES.length - 3;

              return (
                <p
                  key={i}
                  className={`leading-relaxed ${
                    isGreeting
                      ? "text-center text-lg sm:text-xl font-semibold text-pink-200"
                      : isSignOff
                        ? "text-center text-sm sm:text-base text-pink-300/90 italic"
                        : "text-sm sm:text-[15px] text-pink-100/80"
                  }`}
                >
                  {line}
                </p>
              );
            })}
          </div>
        </div>

        {/* Sticky bottom */}
        <div className="shrink-0 px-6 sm:px-8 pb-6 sm:pb-8">
          {/* Bottom shimmer */}
          <div className="mb-4 h-[1px] bg-gradient-to-r from-transparent via-pink-400/30 to-transparent" />

          <button
            onClick={onClose}
            className="mx-auto block rounded-full border border-pink-400/15 bg-pink-500/10 px-6 py-2.5 sm:py-2 text-sm sm:text-xs font-medium text-pink-300 transition-all hover:bg-pink-500/20 hover:border-pink-400/30"
          >
            close 💗
          </button>
        </div>
      </div>

      <style jsx global>{`
        @keyframes fadeScale {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes float {
          0%, 100% { transform: translateX(-50%) translateY(0); }
          50% { transform: translateX(-50%) translateY(-4px); }
        }
      `}</style>
    </div>
  );
}
