export const VEHICLE_PARTS = {
  engine: ["stock", "sport", "turbo", "racing", "electric"],
  tires: ["street", "off-road", "slick", "drift", "monster"],
  body: ["sedan", "coupe", "suv", "truck", "roadster"],
  spoiler: ["none", "lip", "wing", "gt-wing", "whale-tail"],
  nitro: ["none", "small", "medium", "large", "ultra"],
} as const;

export type VehiclePartCategory = keyof typeof VEHICLE_PARTS;
export type VehiclePartOption<K extends VehiclePartCategory> = (typeof VEHICLE_PARTS)[K][number];

export const PART_STATS: Record<string, Record<string, { speed: number; weight: number; acceleration: number }>> = {
  engine: {
    stock: { speed: 0, weight: 0, acceleration: 0 },
    sport: { speed: 10, weight: 5, acceleration: 8 },
    turbo: { speed: 20, weight: 10, acceleration: 15 },
    racing: { speed: 30, weight: 15, acceleration: 12 },
    electric: { speed: 15, weight: -5, acceleration: 25 },
  },
  tires: {
    street: { speed: 0, weight: 0, acceleration: 0 },
    "off-road": { speed: -5, weight: 10, acceleration: -5 },
    slick: { speed: 15, weight: -5, acceleration: 10 },
    drift: { speed: 5, weight: 0, acceleration: 15 },
    monster: { speed: -10, weight: 20, acceleration: -10 },
  },
  body: {
    sedan: { speed: 0, weight: 0, acceleration: 0 },
    coupe: { speed: 10, weight: -10, acceleration: 5 },
    suv: { speed: -5, weight: 15, acceleration: -5 },
    truck: { speed: -10, weight: 25, acceleration: -15 },
    roadster: { speed: 15, weight: -15, acceleration: 10 },
  },
  spoiler: {
    none: { speed: 0, weight: 0, acceleration: 0 },
    lip: { speed: 3, weight: 2, acceleration: 2 },
    wing: { speed: 8, weight: 5, acceleration: 5 },
    "gt-wing": { speed: 12, weight: 8, acceleration: 8 },
    "whale-tail": { speed: 10, weight: 6, acceleration: 10 },
  },
  nitro: {
    none: { speed: 0, weight: 0, acceleration: 0 },
    small: { speed: 5, weight: 3, acceleration: 5 },
    medium: { speed: 10, weight: 6, acceleration: 10 },
    large: { speed: 18, weight: 10, acceleration: 18 },
    ultra: { speed: 25, weight: 15, acceleration: 25 },
  },
};

export interface VehicleBuildConfigProps {
  engine: string;
  tires: string;
  body: string;
  spoiler: string;
  nitro: string;
}

export interface VehicleStats {
  speed: number;
  weight: number;
  acceleration: number;
}

export class VehicleBuildConfig {
  private constructor(private readonly props: VehicleBuildConfigProps) {}

  static create(props: Partial<VehicleBuildConfigProps>): VehicleBuildConfig {
    const config: VehicleBuildConfigProps = {
      engine: props.engine ?? "stock",
      tires: props.tires ?? "street",
      body: props.body ?? "sedan",
      spoiler: props.spoiler ?? "none",
      nitro: props.nitro ?? "none",
    };

    for (const [key, value] of Object.entries(config)) {
      const allowed = VEHICLE_PARTS[key as VehiclePartCategory] as readonly string[];
      if (!allowed.includes(value)) {
        throw new Error(`Invalid ${key}: "${value}"`);
      }
    }

    return new VehicleBuildConfig(config);
  }

  get engine(): string { return this.props.engine; }
  get tires(): string { return this.props.tires; }
  get body(): string { return this.props.body; }
  get spoiler(): string { return this.props.spoiler; }
  get nitro(): string { return this.props.nitro; }

  computeStats(): VehicleStats {
    const base = { speed: 30, weight: 50, acceleration: 30 };
    for (const [cat, part] of Object.entries(this.props)) {
      const mods = PART_STATS[cat]?.[part];
      if (mods) {
        base.speed += mods.speed;
        base.weight += mods.weight;
        base.acceleration += mods.acceleration;
      }
    }
    return {
      speed: Math.max(0, Math.min(100, base.speed)),
      weight: Math.max(0, Math.min(100, base.weight)),
      acceleration: Math.max(0, Math.min(100, base.acceleration)),
    };
  }

  toJSON(): VehicleBuildConfigProps {
    return { ...this.props };
  }
}
