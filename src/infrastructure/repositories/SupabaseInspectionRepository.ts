import { supabase } from '../../lib/supabase';
import { Inspection } from '../../domain/entities/Inspection';
import { Finding } from '../../domain/entities/Finding';
import { IInspectionRepository } from '../../domain/repositories/IInspectionRepository';

export class SupabaseInspectionRepository implements IInspectionRepository {
  async getById(id: string): Promise<Inspection | null> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*, signature_records(*)')
      .eq('id', id)
      .single();

    if (error || !data) return null;
    
    // Obtenemos la última firma si existe
    const latestSignature = data.signature_records?.[0]?.signature_url;

    return new Inspection(
      data.id,
      data.inspector_id,
      data.area_id,
      data.subarea_id,
      new Date(data.inspection_date),
      data.status,
      data.summary,
      latestSignature
    );
  }

  async getAll(): Promise<Inspection[]> {
    const { data, error } = await supabase
      .from('inspections')
      .select('*, areas(name), profiles(full_name)')
      .order('inspection_date', { ascending: false });

    if (error || !data) return [];

    return data.map(d => new Inspection(
      d.id,
      d.inspector_id,
      d.area_id,
      d.subarea_id,
      new Date(d.inspection_date),
      d.status,
      d.summary
    ));
  }

  async save(inspection: Inspection): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .upsert({
        id: inspection.id,
        inspector_id: inspection.inspectorId,
        area_id: inspection.areaId,
        subarea_id: inspection.subareaId,
        status: inspection.status,
        inspection_date: inspection.date.toISOString(),
        summary: inspection.summary
      });

    if (error) throw error;
  }

  async addSignature(inspectionId: string, profileId: string, url: string): Promise<void> {
    const { error } = await supabase
      .from('signature_records')
      .insert({
        inspection_id: inspectionId,
        profile_id: profileId,
        signature_url: url
      });
    
    if (error) throw error;
  }

  async updateStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('inspections')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }

  async saveFinding(finding: Finding): Promise<void> {
    const { error } = await supabase
      .from('findings')
      .upsert({
        id: finding.id,
        inspection_id: finding.inspectionId,
        item_id: (finding as any).itemId, // Relación con item_id
        hazard_id: finding.hazardId,
        observation: finding.observation,
        severity: finding.severity,
        status: finding.status,
        responsible_id: finding.responsibleId,
        deadline: finding.deadline?.toISOString()
      });

    if (error) throw error;
  }

  async getFindingsByInspectionId(inspectionId: string): Promise<Finding[]> {
    const query = supabase.from('findings').select('*');
    if (inspectionId) query.eq('inspection_id', inspectionId);
    
    const { data, error } = await query;
    if (error || !data) return [];

    return data.map(d => new Finding(
      d.id,
      d.inspection_id,
      d.observation,
      d.severity,
      d.status,
      d.hazard_id,
      d.root_cause,
      d.deadline ? new Date(d.deadline) : undefined,
      d.responsible_id,
      []
    ));
  }

  async updateFindingStatus(id: string, status: string): Promise<void> {
    const { error } = await supabase
      .from('findings')
      .update({ status })
      .eq('id', id);

    if (error) throw error;
  }
}
