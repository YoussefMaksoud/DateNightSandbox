export const AVATAR_OPTIONS = {
  skinTone: ["cat", "dog", "bunny", "bear", "frog", "fox", "owl", "penguin", "alien", "robot", "ghost"],
  hairStyle: ["solid", "spots", "stripes", "gradient", "stars", "hearts", "lightning", "swirl", "pixel", "checker", "none"],
  hairColor: ["coral", "mint", "lavender", "sky", "peach", "lemon", "blush", "sage", "lilac", "ocean", "cloud"],
  eyeColor: ["round", "anime", "sleepy", "cyclops", "button", "sparkle", "angry"],
  outfit: ["casual-tee", "hoodie", "dress-shirt", "blouse", "sweater", "tank-top", "dress", "jacket"],
  outfitColor: ["rose", "blue", "purple", "green", "orange", "red", "black", "white", "pink", "teal"],
  accessory: ["none", "glasses", "sunglasses", "earrings", "necklace", "hat", "beanie", "headband", "bow"],
  expression: ["smile", "laugh", "wink", "blush", "kiss", "surprised", "cool", "love-eyes"],
  background: ["none", "hearts", "stars", "sparkles", "clouds", "sunset", "moon"],
  vehicle: ["none", "bike", "car", "airplane"],
} as const;

export type AvatarCategory = keyof typeof AVATAR_OPTIONS;
export type AvatarOption<K extends AvatarCategory> = (typeof AVATAR_OPTIONS)[K][number];

export interface AvatarConfigProps {
  skinTone: string;
  hairStyle: string;
  hairColor: string;
  eyeColor: string;
  outfit: string;
  outfitColor: string;
  accessory: string;
  expression: string;
  background: string;
  vehicle: string;
}

export class AvatarConfig {
  private constructor(private readonly props: AvatarConfigProps) {}

  static create(props: Partial<AvatarConfigProps>): AvatarConfig {
    const config: AvatarConfigProps = {
      skinTone: props.skinTone ?? "cat",
      hairStyle: props.hairStyle ?? "solid",
      hairColor: props.hairColor ?? "coral",
      eyeColor: props.eyeColor ?? "round",
      outfit: props.outfit ?? "casual-tee",
      outfitColor: props.outfitColor ?? "rose",
      accessory: props.accessory ?? "none",
      expression: props.expression ?? "smile",
      background: props.background ?? "none",
      vehicle: props.vehicle ?? "none",
    };

    // Validate each field against allowed options
    for (const [key, value] of Object.entries(config)) {
      const allowed = AVATAR_OPTIONS[key as AvatarCategory] as readonly string[];
      if (!allowed.includes(value)) {
        throw new Error(`Invalid ${key}: "${value}"`);
      }
    }

    return new AvatarConfig(config);
  }

  get skinTone(): string { return this.props.skinTone; }
  get hairStyle(): string { return this.props.hairStyle; }
  get hairColor(): string { return this.props.hairColor; }
  get eyeColor(): string { return this.props.eyeColor; }
  get outfit(): string { return this.props.outfit; }
  get outfitColor(): string { return this.props.outfitColor; }
  get accessory(): string { return this.props.accessory; }
  get expression(): string { return this.props.expression; }
  get background(): string { return this.props.background; }
  get vehicle(): string { return this.props.vehicle; }

  toJSON(): AvatarConfigProps {
    return { ...this.props };
  }
}
