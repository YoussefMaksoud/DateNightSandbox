export interface VehicleBuildDto {
  engine: string;
  tires: string;
  body: string;
  spoiler: string;
  nitro: string;
  stats: {
    speed: number;
    weight: number;
    acceleration: number;
  };
}
