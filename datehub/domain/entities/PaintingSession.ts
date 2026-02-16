export interface PaintingSessionProps {
  id: string;
  userId: string;
  dateNightId: string | null;
  difficulty: string;
  theme: string;
  referenceUrl: string;
  palette: string[];
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

export class PaintingSession {
  private constructor(private readonly props: PaintingSessionProps) {}

  static create(props: Omit<PaintingSessionProps, "createdAt" | "updatedAt"> & { createdAt?: Date; updatedAt?: Date }): PaintingSession {
    return new PaintingSession({
      ...props,
      createdAt: props.createdAt ?? new Date(),
      updatedAt: props.updatedAt ?? new Date(),
    });
  }

  static reconstitute(props: PaintingSessionProps): PaintingSession {
    return new PaintingSession(props);
  }

  get id(): string { return this.props.id; }
  get userId(): string { return this.props.userId; }
  get dateNightId(): string | null { return this.props.dateNightId; }
  get difficulty(): string { return this.props.difficulty; }
  get theme(): string { return this.props.theme; }
  get referenceUrl(): string { return this.props.referenceUrl; }
  get palette(): string[] { return this.props.palette; }
  get status(): string { return this.props.status; }
  get createdAt(): Date { return this.props.createdAt; }
  get updatedAt(): Date { return this.props.updatedAt; }

  get isActive(): boolean {
    return this.props.status === "active";
  }

  complete(): PaintingSession {
    return new PaintingSession({ ...this.props, status: "completed", updatedAt: new Date() });
  }

  saveForLater(): PaintingSession {
    return new PaintingSession({ ...this.props, status: "saved", updatedAt: new Date() });
  }
}
