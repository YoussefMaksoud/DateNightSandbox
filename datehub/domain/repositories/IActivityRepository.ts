import { Activity } from "@/domain/entities/Activity";

export interface IActivityRepository {
  findById(id: string): Promise<Activity | null>;
  findAll(): Promise<Activity[]>;
  create(activity: Activity): Promise<Activity>;
}
