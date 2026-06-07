import { Inspection, IInspection } from '../domain/entities/Inspection';
import { Finding } from '../domain/entities/Finding';
import { IInspectionRepository } from '../domain/repositories/IInspectionRepository';

export class InspectionService {
  constructor(private repository: IInspectionRepository) {}

  async startNewInspection(data: Omit<IInspection, 'id' | 'status'>): Promise<Inspection> {
    const inspection = Inspection.create(data);
    await this.repository.save(inspection);
    return inspection;
  }

  async addFinding(data: any): Promise<Finding> {
    const finding = Finding.createNew(data);
    await this.repository.saveFinding(finding);
    return finding;
  }

  async signAndComplete(inspectionId: string, signatureUrl: string): Promise<void> {
    const inspection = await this.repository.getById(inspectionId);
    if (!inspection) throw new Error('Inspección no encontrada');

    inspection.complete(signatureUrl);
    await this.repository.save(inspection);
  }

  async getDashboardStats() {
    // Lógica para calcular KPIs
    const all = await this.repository.getAll();
    return {
      total: all.length,
      completed: all.filter(i => i.status === 'COMPLETADA').length,
      pending: all.filter(i => i.status === 'PENDIENTE').length,
    };
  }
}
