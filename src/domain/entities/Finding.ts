export type Severity = 'A' | 'B' | 'C';
export type FindingStatus = 'ABIERTO' | 'EN_PROCESO' | 'CERRADO';

export interface IFinding {
  id: string;
  inspectionId: string;
  itemId?: string; // Nuevo: Relación con ítem de inspección
  hazardId?: string;
  observation: string;
  rootCause?: string;
  severity: Severity;
  status: FindingStatus;
  deadline?: Date;
  responsibleId?: string;
  photos: string[];
}

export class Finding implements IFinding {
  constructor(
    public id: string,
    public inspectionId: string,
    public observation: string,
    public severity: Severity,
    public status: FindingStatus = 'ABIERTO',
    public hazardId?: string,
    public rootCause?: string,
    public deadline?: Date,
    public responsibleId?: string,
    public photos: string[] = [],
    public itemId?: string
  ) {}

  static createNew(data: Omit<IFinding, 'id' | 'status' | 'photos'>): Finding {
    return new Finding(
      crypto.randomUUID(),
      data.inspectionId,
      data.observation,
      data.severity,
      'ABIERTO',
      data.hazardId,
      data.rootCause,
      data.deadline,
      data.responsibleId,
      [],
      data.itemId
    );
  }
}
