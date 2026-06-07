export type WorkerEppStatus = 'ACTIVO' | 'BAJA' | 'REEMPLAZADO' | 'PERDIDO' | 'DEVUELTO';
export type WorkerEppCondition = 'BUENO' | 'REGULAR' | 'MALO';

export interface IWorkerEppAssignment {
  id: string;
  clientId: string;
  workerId: string;
  eppId?: string;
  deliveryId?: string;
  deliveryItemId?: string;
  eppName: string;
  bodyZone?: string;
  size?: string;
  certification?: string;
  assignedDate: Date;
  status: WorkerEppStatus;
  currentCondition: WorkerEppCondition;
  lastInspectionId?: string;
  deactivatedAt?: Date;
  deactivationReason?: string;
  notes?: string;
}

export class WorkerEppAssignment implements IWorkerEppAssignment {
  constructor(
    public id: string,
    public clientId: string,
    public workerId: string,
    public eppName: string,
    public assignedDate: Date,
    public status: WorkerEppStatus = 'ACTIVO',
    public currentCondition: WorkerEppCondition = 'BUENO',
    public eppId?: string,
    public deliveryId?: string,
    public deliveryItemId?: string,
    public bodyZone?: string,
    public size?: string,
    public certification?: string,
    public lastInspectionId?: string,
    public deactivatedAt?: Date,
    public deactivationReason?: string,
    public notes?: string
  ) {}

  deactivate(reason: string, status: Exclude<WorkerEppStatus, 'ACTIVO'> = 'BAJA') {
    if (!reason.trim()) throw new Error('Debe indicar el motivo de baja del EPP.');

    this.status = status;
    this.deactivatedAt = new Date();
    this.deactivationReason = reason.trim();
  }

  updateCondition(condition: WorkerEppCondition, inspectionId?: string) {
    this.currentCondition = condition;
    this.lastInspectionId = inspectionId;
  }

  isActive(): boolean {
    return this.status === 'ACTIVO';
  }
}
