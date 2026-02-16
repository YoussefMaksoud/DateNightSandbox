"use client";

import { useId } from "react";

const BODY_COLORS: Record<string, string> = {
  coral: "#FF6B6B", mint: "#4ECDC4", lavender: "#B8A9E8",
  sky: "#74B9FF", peach: "#FFD093", lemon: "#F9E547",
  blush: "#FD79A8", sage: "#00B894", lilac: "#A29BFE",
  ocean: "#0984E3", cloud: "#DFE6E9",
};

const OUTFIT_COLORS: Record<string, string> = {
  rose: "#e11d48", blue: "#3B82F6", purple: "#8B5CF6", green: "#10B981",
  orange: "#F97316", red: "#DC2626", black: "#27272A", white: "#E4E4E7",
  pink: "#EC4899", teal: "#14B8A6",
};

interface AvatarConfig {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
  expression: string;
  background: string;
}

interface AvatarRendererProps {
  config: AvatarConfig;
  size?: number;
  className?: string;
}

function col(map: Record<string, string>, key: string): string {
  return map[key] ?? Object.values(map)[0];
}

function darken(hex: string, amount: number): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, (num >> 16) - amount);
  const g = Math.max(0, ((num >> 8) & 0xff) - amount);
  const b = Math.max(0, (num & 0xff) - amount);
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

// --- Backgrounds (unchanged) ---

function renderBackground(bg: string) {
  switch (bg) {
    case "hearts":
      return (
        <g opacity={0.15}>
          <path d="M30 50 C30 44,38 44,38 50 C38 56,30 62,30 62 C30 62,22 56,22 50 C22 44,30 44,30 50Z" fill="#e11d48" />
          <path d="M160 35 C160 30,166 30,166 35 C166 40,160 44,160 44 C160 44,154 40,154 35 C154 30,160 30,160 35Z" fill="#e11d48" />
          <path d="M170 160 C170 155,176 155,176 160 C176 165,170 169,170 169 C170 169,164 165,164 160 C164 155,170 155,170 160Z" fill="#e11d48" />
          <path d="M40 165 C40 161,45 161,45 165 C45 169,40 172,40 172 C40 172,35 169,35 165 C35 161,40 161,40 165Z" fill="#e11d48" />
        </g>
      );
    case "stars":
      return (
        <g opacity={0.15}>
          <polygon points="30,42 33,48 40,48 34,52 36,58 30,54 24,58 26,52 20,48 27,48" fill="#FBBF24" />
          <polygon points="165,30 167,34 172,34 168,37 169,42 165,39 161,42 162,37 158,34 163,34" fill="#FBBF24" />
          <polygon points="170,160 172,164 176,164 173,166 174,170 170,168 166,170 167,166 164,164 168,164" fill="#FBBF24" />
          <polygon points="35,160 37,163 40,163 38,165 39,168 35,166 31,168 32,165 30,163 33,163" fill="#FBBF24" />
        </g>
      );
    case "sparkles":
      return (
        <g opacity={0.15}>
          <path d="M30 48 L32 42 L34 48 L40 50 L34 52 L32 58 L30 52 L24 50Z" fill="#E8E8E8" />
          <path d="M165 32 L166 28 L167 32 L171 33 L167 34 L166 38 L165 34 L161 33Z" fill="#E8E8E8" />
          <path d="M168 162 L169 158 L170 162 L174 163 L170 164 L169 168 L168 164 L164 163Z" fill="#E8E8E8" />
        </g>
      );
    case "clouds":
      return (
        <g opacity={0.15}>
          <ellipse cx={35} cy={50} rx={18} ry={10} fill="white" />
          <ellipse cx={50} cy={48} rx={14} ry={8} fill="white" />
          <ellipse cx={155} cy={40} rx={20} ry={11} fill="white" />
          <ellipse cx={170} cy={38} rx={12} ry={7} fill="white" />
          <ellipse cx={40} cy={170} rx={16} ry={9} fill="white" />
        </g>
      );
    case "sunset":
      return (
        <g opacity={0.2}>
          <rect x={0} y={160} width={200} height={15} fill="#FBBF24" />
          <rect x={0} y={175} width={200} height={15} fill="#F97316" />
          <rect x={0} y={190} width={200} height={10} fill="#DC2626" />
          <circle cx={160} cy={50} r={18} fill="#F97316" />
        </g>
      );
    case "moon":
      return (
        <g opacity={0.2}>
          <circle cx={155} cy={45} r={16} fill="#FBBF24" />
          <circle cx={162} cy={40} r={13} fill="#27272a" />
          <circle cx={30} cy={40} r={1.5} fill="white" />
          <circle cx={50} cy={55} r={1} fill="white" />
          <circle cx={170} cy={80} r={1.5} fill="white" />
          <circle cx={40} cy={160} r={1} fill="white" />
          <circle cx={175} cy={150} r={1.5} fill="white" />
          <circle cx={25} cy={100} r={1} fill="white" />
        </g>
      );
    default:
      return null;
  }
}

// --- Outfit (unchanged) ---

function renderOutfit(outfit: string, outfitColor: string) {
  const fill = OUTFIT_COLORS[outfitColor] ?? outfitColor;
  switch (outfit) {
    case "casual-tee":
      return (
        <g>
          <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />
          <path d="M85 145 Q100 155,115 145" fill="none" stroke={fill} strokeWidth={2} />
        </g>
      );
    case "hoodie":
      return (
        <g>
          <path d="M50 175 Q50 145,100 142 Q150 145,150 175 L150 200 L50 200Z" fill={fill} />
          <ellipse cx={100} cy={140} rx={18} ry={12} fill={fill} />
          <path d="M85 175 Q100 178,115 175 L115 200 L85 200Z" fill={fill} opacity={0.3} />
        </g>
      );
    case "dress-shirt":
      return (
        <g>
          <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />
          <path d="M88 145 L100 160 L112 145" fill="none" stroke="white" strokeWidth={2} />
          <line x1={100} y1={160} x2={100} y2={200} stroke="white" strokeWidth={1} opacity={0.4} />
          <circle cx={100} cy={170} r={2} fill="white" opacity={0.6} />
          <circle cx={100} cy={182} r={2} fill="white" opacity={0.6} />
          <circle cx={100} cy={194} r={2} fill="white" opacity={0.6} />
        </g>
      );
    case "blouse":
      return (
        <g>
          <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />
          <path d="M88 145 L100 158 L112 145" fill="none" stroke={fill} strokeWidth={2} opacity={0.5} />
        </g>
      );
    case "sweater":
      return (
        <g>
          <path d="M50 175 Q50 146,100 143 Q150 146,150 175 L150 200 L50 200Z" fill={fill} />
          <line x1={55} y1={170} x2={145} y2={170} stroke={fill} strokeWidth={1.5} opacity={0.2} />
          <line x1={53} y1={180} x2={147} y2={180} stroke={fill} strokeWidth={1.5} opacity={0.2} />
          <line x1={52} y1={190} x2={148} y2={190} stroke={fill} strokeWidth={1.5} opacity={0.2} />
        </g>
      );
    case "tank-top":
      return (
        <g>
          <path d="M70 175 Q70 152,100 148 Q130 152,130 175 L130 200 L70 200Z" fill={fill} />
          <line x1={82} y1={145} x2={78} y2={148} stroke={fill} strokeWidth={5} />
          <line x1={118} y1={145} x2={122} y2={148} stroke={fill} strokeWidth={5} />
        </g>
      );
    case "dress":
      return (
        <g>
          <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />
          <path d="M60 185 Q100 180,140 185 L145 200 L55 200Z" fill={fill} opacity={0.85} />
        </g>
      );
    case "jacket":
      return (
        <g>
          <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />
          <path d="M92 148 L100 160 L108 148" fill="white" opacity={0.7} />
          <line x1={100} y1={160} x2={100} y2={200} stroke="#00000022" strokeWidth={2} />
        </g>
      );
    default:
      return <path d="M55 175 Q55 148,100 145 Q145 148,145 175 L145 200 L55 200Z" fill={fill} />;
  }
}

// --- Eyes ---

function renderEyes(eyeStyle: string, expression: string) {
  if (expression === "love-eyes") {
    return (
      <g>
        <path d="M82 93 C82 88,87 88,87 93 C87 97,82 100,82 100 C82 100,77 97,77 93 C77 88,82 88,82 93Z" fill="#e11d48" />
        <path d="M118 93 C118 88,123 88,123 93 C123 97,118 100,118 100 C118 100,113 97,113 93 C113 88,118 88,118 93Z" fill="#e11d48" />
      </g>
    );
  }

  switch (eyeStyle) {
    case "anime":
      return (
        <g>
          {[82, 118].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={93} rx={7} ry={8} fill="white" />
              <ellipse cx={cx + 1} cy={92} rx={5} ry={6} fill="#2E86C1" />
              <circle cx={cx + 1} cy={91} r={3} fill="#111" />
              <circle cx={cx + 3} cy={89} r={1.5} fill="white" />
              <circle cx={cx - 1} cy={93} r={1} fill="white" />
            </g>
          ))}
        </g>
      );
    case "sleepy":
      return (
        <g>
          <path d="M76 95 Q82 90,88 95" fill="none" stroke="#333" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M112 95 Q118 90,124 95" fill="none" stroke="#333" strokeWidth={2.5} strokeLinecap="round" />
        </g>
      );
    case "cyclops":
      return (
        <g>
          <ellipse cx={100} cy={93} rx={9} ry={10} fill="white" />
          <ellipse cx={101} cy={92} rx={6} ry={7} fill="#2E86C1" />
          <circle cx={101} cy={91} r={4} fill="#111" />
          <circle cx={103} cy={89} r={1.5} fill="white" />
        </g>
      );
    case "button":
      return (
        <g>
          <circle cx={82} cy={93} r={4} fill="#111" />
          <circle cx={118} cy={93} r={4} fill="#111" />
        </g>
      );
    case "sparkle":
      return (
        <g>
          {[82, 118].map((cx) => (
            <g key={cx}>
              <path d={`M${cx} 87 L${cx + 2} 93 L${cx} 99 L${cx - 2} 93Z`} fill="#FBBF24" />
              <path d={`M${cx - 5} 93 L${cx} 91 L${cx + 5} 93 L${cx} 95Z`} fill="#FBBF24" />
            </g>
          ))}
        </g>
      );
    case "angry":
      return (
        <g>
          {[82, 118].map((cx) => {
            const brow1 = cx < 100 ? cx - 5 : cx + 5;
            const brow2 = cx < 100 ? cx + 5 : cx - 5;
            return (
              <g key={cx}>
                <ellipse cx={cx} cy={95} rx={5.5} ry={6} fill="white" />
                <ellipse cx={cx + 1} cy={94} rx={4} ry={4.5} fill="#DC2626" />
                <circle cx={cx + 1} cy={93} r={2.5} fill="#111" />
                <line x1={brow1} y1={84} x2={brow2} y2={87} stroke="#333" strokeWidth={2.5} strokeLinecap="round" />
              </g>
            );
          })}
        </g>
      );
    default: // round
      return (
        <g>
          {[82, 118].map((cx) => (
            <g key={cx}>
              <ellipse cx={cx} cy={95} rx={5.5} ry={6} fill="white" />
              <ellipse cx={cx + 1} cy={94} rx={4} ry={4.5} fill="#2E86C1" />
              <circle cx={cx + 1} cy={93} r={2.5} fill="#111" />
              <circle cx={cx + 2.5} cy={91} r={1} fill="white" />
            </g>
          ))}
        </g>
      );
  }
}

// --- Mouth / expression ---

function renderExpression(expression: string) {
  switch (expression) {
    case "smile":
    case "love-eyes":
      return <path d="M88 110 Q100 120,112 110" fill="none" stroke="#8B4513" strokeWidth={2} strokeLinecap="round" />;
    case "laugh":
      return (
        <g>
          <path d="M88 108 Q100 122,112 108" fill="#8B4513" stroke="#8B4513" strokeWidth={1.5} />
          <path d="M90 108 Q100 104,110 108" fill="white" />
        </g>
      );
    case "wink":
      return <path d="M90 110 Q100 118,110 110" fill="none" stroke="#8B4513" strokeWidth={2} strokeLinecap="round" />;
    case "surprised":
      return <ellipse cx={100} cy={112} rx={5} ry={6} fill="#8B4513" />;
    case "cool":
      return <line x1={90} y1={112} x2={110} y2={112} stroke="#8B4513" strokeWidth={2} strokeLinecap="round" />;
    default:
      return <path d="M88 110 Q100 120,112 110" fill="none" stroke="#8B4513" strokeWidth={2} strokeLinecap="round" />;
  }
}

// --- Creature heads ---

function renderCreatureHead(creature: string, bodyColor: string) {
  const fill = col(BODY_COLORS, bodyColor);
  const dark = darken(fill, 40);

  switch (creature) {
    case "cat":
      return (
        <g>
          {/* Neck */}
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          {/* Head */}
          <ellipse cx={100} cy={92} rx={34} ry={36} fill={fill} />
          {/* Ears */}
          <polygon points="70,70 60,42 82,62" fill={fill} />
          <polygon points="130,70 140,42 118,62" fill={fill} />
          <polygon points="72,66 64,48 80,62" fill="#FFB6C1" />
          <polygon points="128,66 136,48 120,62" fill="#FFB6C1" />
          {/* Nose */}
          <polygon points="97,104 100,100 103,104" fill="#FFB6C1" />
          {/* Whiskers */}
          <line x1={65} y1={100} x2={90} y2={103} stroke={dark} strokeWidth={1.2} />
          <line x1={65} y1={108} x2={90} y2={106} stroke={dark} strokeWidth={1.2} />
          <line x1={135} y1={100} x2={110} y2={103} stroke={dark} strokeWidth={1.2} />
          <line x1={135} y1={108} x2={110} y2={106} stroke={dark} strokeWidth={1.2} />
        </g>
      );
    case "dog":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={34} ry={36} fill={fill} />
          {/* Floppy ears */}
          <ellipse cx={64} cy={88} rx={12} ry={22} fill={dark} transform="rotate(-10 64 88)" />
          <ellipse cx={136} cy={88} rx={12} ry={22} fill={dark} transform="rotate(10 136 88)" />
          {/* Snout */}
          <ellipse cx={100} cy={106} rx={14} ry={10} fill={fill} stroke={dark} strokeWidth={0.5} />
          {/* Nose */}
          <ellipse cx={100} cy={102} rx={5} ry={4} fill="#333" />
          {/* Tongue */}
          <ellipse cx={103} cy={116} rx={4} ry={6} fill="#FF6B81" />
        </g>
      );
    case "bunny":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={95} rx={32} ry={34} fill={fill} />
          {/* Tall ears */}
          <ellipse cx={82} cy={40} rx={10} ry={32} fill={fill} />
          <ellipse cx={118} cy={40} rx={10} ry={32} fill={fill} />
          <ellipse cx={82} cy={40} rx={6} ry={26} fill="#FFB6C1" />
          <ellipse cx={118} cy={40} rx={6} ry={26} fill="#FFB6C1" />
          {/* Nose */}
          <ellipse cx={100} cy={104} rx={3} ry={2.5} fill="#FFB6C1" />
          {/* Buck teeth */}
          <rect x={95} y={108} width={4} height={6} rx={1} fill="white" stroke="#eee" strokeWidth={0.5} />
          <rect x={101} y={108} width={4} height={6} rx={1} fill="white" stroke="#eee" strokeWidth={0.5} />
        </g>
      );
    case "bear":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={36} ry={38} fill={fill} />
          {/* Round ears */}
          <circle cx={68} cy={62} r={12} fill={fill} />
          <circle cx={132} cy={62} r={12} fill={fill} />
          <circle cx={68} cy={62} r={7} fill={dark} />
          <circle cx={132} cy={62} r={7} fill={dark} />
          {/* Nose */}
          <ellipse cx={100} cy={104} rx={6} ry={5} fill="#333" />
          {/* Rosy cheeks */}
          <circle cx={78} cy={106} r={6} fill="#FFB6C1" opacity={0.4} />
          <circle cx={122} cy={106} r={6} fill="#FFB6C1" opacity={0.4} />
        </g>
      );
    case "frog":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          {/* Wide flat head */}
          <ellipse cx={100} cy={96} rx={40} ry={32} fill={fill} />
          {/* Bulging eyes on top */}
          <circle cx={78} cy={68} r={14} fill={fill} />
          <circle cx={122} cy={68} r={14} fill={fill} />
          <circle cx={78} cy={68} r={9} fill="white" />
          <circle cx={122} cy={68} r={9} fill="white" />
          <circle cx={79} cy={67} r={5} fill="#111" />
          <circle cx={123} cy={67} r={5} fill="#111" />
          {/* Wide mouth */}
          <path d="M68 108 Q100 122,132 108" fill="none" stroke={dark} strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "fox":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={32} ry={35} fill={fill} />
          {/* Pointed ears */}
          <polygon points="68,72 56,38 84,62" fill={fill} />
          <polygon points="132,72 144,38 116,62" fill={fill} />
          <polygon points="70,68 62,46 80,62" fill="white" />
          <polygon points="130,68 138,46 120,62" fill="white" />
          {/* White muzzle */}
          <ellipse cx={100} cy={108} rx={18} ry={14} fill="white" />
          {/* Nose */}
          <ellipse cx={100} cy={102} rx={4} ry={3} fill="#333" />
        </g>
      );
    case "owl":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={36} ry={38} fill={fill} />
          {/* Ear tufts */}
          <polygon points="70,64 60,40 80,56" fill={dark} />
          <polygon points="130,64 140,40 120,56" fill={dark} />
          {/* Large eye discs */}
          <circle cx={82} cy={88} r={16} fill={dark} />
          <circle cx={118} cy={88} r={16} fill={dark} />
          <circle cx={82} cy={88} r={12} fill="white" />
          <circle cx={118} cy={88} r={12} fill="white" />
          <circle cx={83} cy={87} r={7} fill="#D68910" />
          <circle cx={119} cy={87} r={7} fill="#D68910" />
          <circle cx={83} cy={86} r={4} fill="#111" />
          <circle cx={119} cy={86} r={4} fill="#111" />
          {/* Beak */}
          <polygon points="96,104 100,112 104,104" fill="#F9A825" />
        </g>
      );
    case "penguin":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={32} ry={36} fill={fill} />
          {/* White face patch */}
          <ellipse cx={100} cy={96} rx={22} ry={26} fill="white" />
          {/* Beak */}
          <polygon points="95,105 100,114 105,105" fill="#F97316" />
        </g>
      );
    case "alien":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          {/* Large egg head */}
          <ellipse cx={100} cy={88} rx={38} ry={42} fill={fill} />
          {/* Antennae */}
          <line x1={84} y1={50} x2={78} y2={28} stroke={dark} strokeWidth={2} strokeLinecap="round" />
          <line x1={116} y1={50} x2={122} y2={28} stroke={dark} strokeWidth={2} strokeLinecap="round" />
          <circle cx={78} cy={28} r={5} fill="#FBBF24" />
          <circle cx={122} cy={28} r={5} fill="#FBBF24" />
          {/* Large almond eyes */}
          <ellipse cx={82} cy={88} rx={10} ry={8} fill="#111" />
          <ellipse cx={118} cy={88} rx={10} ry={8} fill="#111" />
          <ellipse cx={84} cy={86} rx={3} ry={3} fill="white" />
          <ellipse cx={120} cy={86} rx={3} ry={3} fill="white" />
        </g>
      );
    case "robot":
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={4} fill={fill} />
          {/* Boxy head */}
          <rect x={62} y={56} width={76} height={72} rx={8} fill={fill} />
          {/* Antenna */}
          <line x1={100} y1={56} x2={100} y2={36} stroke="#888" strokeWidth={3} />
          <circle cx={100} cy={32} r={6} fill="#FF6B6B" />
          {/* Visor */}
          <rect x={72} y={80} width={56} height={18} rx={4} fill="#87CEEB" opacity={0.8} />
          {/* Eye dots */}
          <circle cx={88} cy={89} r={5} fill="white" />
          <circle cx={112} cy={89} r={5} fill="white" />
          {/* Bolts */}
          <circle cx={62} cy={92} r={4} fill="#888" />
          <circle cx={138} cy={92} r={4} fill="#888" />
          {/* Speaker mouth */}
          <rect x={88} y={108} width={24} height={8} rx={2} fill={darken(fill, 50)} />
          <line x1={92} y1={110} x2={92} y2={114} stroke={fill} strokeWidth={1} />
          <line x1={96} y1={110} x2={96} y2={114} stroke={fill} strokeWidth={1} />
          <line x1={100} y1={110} x2={100} y2={114} stroke={fill} strokeWidth={1} />
          <line x1={104} y1={110} x2={104} y2={114} stroke={fill} strokeWidth={1} />
          <line x1={108} y1={110} x2={108} y2={114} stroke={fill} strokeWidth={1} />
        </g>
      );
    case "ghost":
      return (
        <g>
          {/* Ghost blends head into body — teardrop */}
          <ellipse cx={100} cy={88} rx={38} ry={40} fill={fill} opacity={0.9} />
          <rect x={62} y={88} width={76} height={70} fill={fill} opacity={0.85} />
          {/* Wavy bottom */}
          <path d="M62 158 Q72 148,82 158 Q92 168,100 158 Q108 148,118 158 Q128 168,138 158 L138 165 L62 165Z" fill={fill} opacity={0.8} />
          {/* Simple eyes */}
          <circle cx={84} cy={88} r={6} fill="#111" />
          <circle cx={116} cy={88} r={6} fill="#111" />
          <circle cx={86} cy={86} r={2} fill="white" />
          <circle cx={118} cy={86} r={2} fill="white" />
          {/* Small mouth */}
          <ellipse cx={100} cy={106} rx={4} ry={5} fill="#555" />
        </g>
      );
    default:
      return (
        <g>
          <rect x={90} y={130} width={20} height={18} rx={6} fill={fill} />
          <ellipse cx={100} cy={92} rx={34} ry={36} fill={fill} />
        </g>
      );
  }
}

// --- Accessories (unchanged, adjusted positions slightly) ---

function renderAccessory(accessory: string) {
  switch (accessory) {
    case "glasses":
      return (
        <g>
          <circle cx={82} cy={93} r={11} fill="none" stroke="#444" strokeWidth={2.5} />
          <circle cx={118} cy={93} r={11} fill="none" stroke="#444" strokeWidth={2.5} />
          <path d="M93 93 L107 93" fill="none" stroke="#444" strokeWidth={2} />
          <path d="M71 91 L62 88" fill="none" stroke="#444" strokeWidth={2} strokeLinecap="round" />
          <path d="M129 91 L138 88" fill="none" stroke="#444" strokeWidth={2} strokeLinecap="round" />
        </g>
      );
    case "sunglasses":
      return (
        <g>
          <rect x={69} y={84} width={26} height={18} rx={4} fill="#27272A" />
          <rect x={105} y={84} width={26} height={18} rx={4} fill="#27272A" />
          <path d="M95 92 L105 92" fill="none" stroke="#27272A" strokeWidth={2.5} />
          <path d="M69 90 L60 87" fill="none" stroke="#27272A" strokeWidth={2.5} strokeLinecap="round" />
          <path d="M131 90 L140 87" fill="none" stroke="#27272A" strokeWidth={2.5} strokeLinecap="round" />
          <rect x={70} y={85} width={24} height={8} rx={3} fill="white" opacity={0.15} />
          <rect x={106} y={85} width={24} height={8} rx={3} fill="white" opacity={0.15} />
        </g>
      );
    case "earrings":
      return (
        <g>
          <circle cx={62} cy={110} r={3.5} fill="#FBBF24" />
          <circle cx={62} cy={110} r={2} fill="#F59E0B" />
          <circle cx={138} cy={110} r={3.5} fill="#FBBF24" />
          <circle cx={138} cy={110} r={2} fill="#F59E0B" />
        </g>
      );
    case "hat":
      return (
        <g>
          <ellipse cx={100} cy={58} rx={48} ry={6} fill="#27272A" />
          <rect x={68} y={34} width={64} height={26} rx={12} fill="#27272A" />
          <rect x={72} y={50} width={56} height={4} rx={2} fill="#e11d48" />
        </g>
      );
    case "beanie":
      return (
        <g>
          <ellipse cx={100} cy={62} rx={38} ry={22} fill="#e11d48" />
          <rect x={64} y={56} width={72} height={12} rx={6} fill="#be123c" />
          <circle cx={100} cy={42} r={5} fill="#e11d48" />
        </g>
      );
    case "headband":
      return (
        <path d="M62 76 Q100 68,138 76" fill="none" stroke="#e11d48" strokeWidth={4} strokeLinecap="round" />
      );
    case "bow":
      return (
        <g>
          <path d="M62 70 Q52 60,62 56 Q72 60,62 70Z" fill="#e11d48" />
          <path d="M62 70 Q72 60,62 56 Q52 60,62 70Z" fill="#FB7185" />
          <circle cx={62} cy={64} r={3} fill="#be123c" />
        </g>
      );
    case "necklace":
      return (
        <g>
          <path d="M78 148 Q100 160,122 148" fill="none" stroke="#FBBF24" strokeWidth={2} strokeLinecap="round" />
          <circle cx={100} cy={155} r={4} fill="#FBBF24" />
          <circle cx={100} cy={155} r={2.5} fill="#F59E0B" />
        </g>
      );
    default:
      return null;
  }
}

// --- Pattern on body ---

function renderPattern(pattern: string, bodyColor: string) {
  const dark = darken(col(BODY_COLORS, bodyColor), 50);

  switch (pattern) {
    case "spots":
      return (
        <g opacity={0.4}>
          <circle cx={80} cy={160} r={5} fill={dark} />
          <circle cx={120} cy={155} r={4} fill={dark} />
          <circle cx={95} cy={170} r={4.5} fill={dark} />
        </g>
      );
    case "stripes":
      return (
        <g opacity={0.25}>
          <line x1={65} y1={160} x2={135} y2={160} stroke={dark} strokeWidth={3} />
          <line x1={60} y1={172} x2={140} y2={172} stroke={dark} strokeWidth={3} />
          <line x1={58} y1={184} x2={142} y2={184} stroke={dark} strokeWidth={3} />
        </g>
      );
    default:
      return null;
  }
}

// --- Main renderer ---

export default function AvatarRenderer({
  config,
  size = 200,
  className = "",
}: AvatarRendererProps) {
  const clipId = useId();
  const creature = config.skinTone;
  const bodyColor = config.hairColor;
  const isGhost = creature === "ghost";
  const isFrog = creature === "frog";
  const isOwl = creature === "owl";
  const isAlien = creature === "alien";
  const isRobot = creature === "robot";

  // Creatures with custom eyes built into their head
  const hasCustomEyes = isGhost || isFrog || isOwl || isAlien || isRobot;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <clipPath id={clipId}>
          <circle cx={100} cy={100} r={98} />
        </clipPath>
      </defs>

      {/* Outer ring */}
      <circle cx={100} cy={100} r={99} fill="none" stroke="#3f3f46" strokeWidth={2} />

      <g clipPath={`url(#${clipId})`}>
        {/* Base background */}
        <circle cx={100} cy={100} r={98} fill="#27272a" />

        {/* Decorative background */}
        {renderBackground(config.background)}

        {/* Outfit */}
        {renderOutfit(config.outfit, config.outfitColor)}

        {/* Pattern overlay on body area */}
        {renderPattern(config.hairStyle, bodyColor)}

        {/* Creature head + body */}
        {renderCreatureHead(creature, bodyColor)}

        {/* Penguin white belly on outfit area */}
        {creature === "penguin" && (
          <ellipse cx={100} cy={170} rx={18} ry={22} fill="white" opacity={0.7} />
        )}

        {/* Eyes (skip for creatures with built-in eyes) */}
        {!hasCustomEyes && renderEyes(config.eyeColor, config.expression)}

        {/* Mouth (skip for creatures with built-in mouths) */}
        {!isGhost && !isFrog && !isRobot && renderExpression(config.expression)}

        {/* Accessory on top */}
        {renderAccessory(config.accessory)}
      </g>
    </svg>
  );
}
