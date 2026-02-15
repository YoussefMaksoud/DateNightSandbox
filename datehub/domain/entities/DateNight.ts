export interface DateNightProps {
  id: string;
  user1Id: string;
  user2Id: string | null;
  activityId: string;
  startTime: Date;
  endTime: Date | null;
  createdAt: Date;
}

export class DateNight {
  private constructor(private readonly props: DateNightProps) {}

  static create(props: Omit<DateNightProps, "endTime" | "createdAt"> & { endTime?: Date | null; createdAt?: Date }): DateNight {
    if (props.user1Id === props.user2Id) {
      throw new Error("A date night requires two different users");
    }
    return new DateNight({
      ...props,
      endTime: props.endTime ?? null,
      createdAt: props.createdAt ?? new Date(),
    });
  }

  static createPending(props: { id: string; hostId: string; activityId: string; startTime: Date }): DateNight {
    return new DateNight({
      id: props.id,
      user1Id: props.hostId,
      user2Id: null,
      activityId: props.activityId,
      startTime: props.startTime,
      endTime: null,
      createdAt: new Date(),
    });
  }

  static reconstitute(props: DateNightProps): DateNight {
    return new DateNight(props);
  }

  get id(): string { return this.props.id; }
  get user1Id(): string { return this.props.user1Id; }
  get user2Id(): string | null { return this.props.user2Id; }
  get activityId(): string { return this.props.activityId; }
  get startTime(): Date { return this.props.startTime; }
  get endTime(): Date | null { return this.props.endTime; }
  get createdAt(): Date { return this.props.createdAt; }

  get isActive(): boolean {
    return this.props.endTime === null;
  }

  end(): DateNight {
    if (this.props.endTime) {
      throw new Error("Date night has already ended");
    }
    return new DateNight({ ...this.props, endTime: new Date() });
  }
}
