export type InspectionStatus = 'PENDIENTE' | 'EN_CURSO' | 'COMPLETADA' | 'CERRADA';

export interface IInspection {
  id: string;
  inspectorId: string;
  areaId: string;
  subareaId: string;
  status: InspectionStatus;
  date: Date;
  summary?: string;
  inspectorSignatureUrl?: string;
}

export class Inspection implements IInspection {
  constructor(
    public id: string,
    public inspectorId: string,
    public areaId: string,
    public subareaId: string,
    public date: Date,
    public status: InspectionStatus = 'PENDIENTE',
    public summary?: string,
    public inspectorSignatureUrl?: string
  ) {}

  static create(data: Omit<IInspection, 'id' | 'status'>): Inspection {
    // Validaciones de negocio iniciales
    if (!data.areaId || !data.subareaId) {
      throw new Error('El área y subárea son obligatorias para iniciar una inspección.');
    }
    
    return new Inspection(
      crypto.randomUUID(),
      data.inspectorId,
      data.areaId,
      data.subareaId,
      data.date,
      'PENDIENTE',
      data.summary
    );
  }

  complete(signatureUrl: string) {
    if (!signatureUrl) throw new Error('La firma es obligatoria para completar la inspección.');
    this.inspectorSignatureUrl = signatureUrl;
    this.status = 'COMPLETADA';
  }

  isClosed(): boolean {
    return this.status === 'CERRADA';
  }
}
