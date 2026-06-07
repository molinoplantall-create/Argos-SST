import { Inspection } from '../entities/Inspection';
import { Finding } from '../entities/Finding';

export interface IInspectionRepository {
  getById(id: string): Promise<Inspection | null>;
  getAll(filters?: any): Promise<Inspection[]>;
  save(inspection: Inspection): Promise<void>;
  updateStatus(id: string, status: string): Promise<void>;
  
  // Findings
  saveFinding(finding: Finding): Promise<void>;
  getFindingsByInspectionId(inspectionId: string): Promise<Finding[]>;
  updateFindingStatus(id: string, status: string): Promise<void>;
}

export interface IAreaRepository {
  getAreas(): Promise<any[]>;
  getSubareas(areaId: string): Promise<any[]>;
}
