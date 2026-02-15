import { DateNight } from "@/domain/entities/DateNight";

export interface IDateNightRepository {
  findById(id: string): Promise<DateNight | null>;
  findByUserId(userId: string): Promise<DateNight[]>;
  create(dateNight: DateNight): Promise<DateNight>;
  update(dateNight: DateNight): Promise<DateNight>;
}
