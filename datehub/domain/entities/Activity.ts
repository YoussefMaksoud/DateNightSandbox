export type ActivityType = "game" | "storytelling" | "music" | "video";

export interface ActivityProps {
  id: string;
  title: string;
  description: string | null;
  type: ActivityType;
}

export class Activity {
  private constructor(private readonly props: ActivityProps) {}

  static create(props: ActivityProps): Activity {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error("Activity title is required");
    }
    return new Activity(props);
  }

  static reconstitute(props: ActivityProps): Activity {
    return new Activity(props);
  }

  get id(): string { return this.props.id; }
  get title(): string { return this.props.title; }
  get description(): string | null { return this.props.description; }
  get type(): ActivityType { return this.props.type; }
}
