import { supabase } from '@/lib/supabase';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  renderToBuffer, 
  Image, 
  Font 
} from '@react-pdf/renderer';

// Define styles to match the standard grid layout
const styles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    fontSize: 6,
    fontFamily: 'Helvetica',
    color: '#000',
  },
  table: {
    width: '100%',
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#000',
  },
  tableRow: {
    flexDirection: 'row',
  },
  tableCell: {
    padding: 2,
    borderStyle: 'solid',
    borderWidth: 0.5,
    borderColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Header Styles
  headerLogo: {
    width: '15%',
    height: 40,
    padding: 5,
  },
  headerTitle: {
    width: '65%',
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    padding: 10,
    textTransform: 'uppercase',
  },
  headerMeta: {
    width: '20%',
    fontSize: 6,
  },
  metaLabel: {
    fontWeight: 'bold',
    backgroundColor: '#E5E7EB',
    width: '40%',
    padding: 2,
    borderRightWidth: 0.5,
  },
  metaValue: {
    width: '60%',
    padding: 2,
    textAlign: 'center',
  },
  // Info Bar Styles
  infoBarLabel: {
    backgroundColor: '#1E93AB',
    color: '#FFF',
    fontWeight: 'bold',
    fontSize: 5,
    textAlign: 'center',
    padding: 1,
  },
  infoBarValue: {
    fontSize: 6,
    textAlign: 'center',
    padding: 2,
  },
  // Findings Header
  findingsHeader: {
    backgroundColor: '#CCF1F7', // Very light petrol
    fontWeight: 'bold',
    textAlign: 'center',
    fontSize: 6,
  },
  // Colors
  bgAI: { backgroundColor: '#FCA5A5' }, // Light Red
  bgCI: { backgroundColor: '#C4B5FD' }, // Light Purple
  dangerA: { backgroundColor: '#EF4444', color: '#FFF' },
  dangerB: { backgroundColor: '#F59E0B', color: '#FFF' },
  dangerC: { backgroundColor: '#10B981', color: '#FFF' },
  
  photo: {
    width: '100%',
    height: 40,
    objectFit: 'contain',
    marginVertical: 2,
  },
  footerSection: {
    marginTop: 10,
    fontSize: 5,
  },
  footerGrid: {
    flexDirection: 'row',
    marginTop: 5,
  },
  signatureBox: {
    width: '25%',
    border: 0.5,
    borderColor: '#000',
    padding: 2,
    alignItems: 'center',
    minHeight: 40,
  }
});

const InspectionReportPDF = ({ data }: { data: any }) => (
  <Document>
    <Page size="A4" orientation="landscape" style={styles.page}>
      <View style={styles.table}>
        {/* ROW 1: Header */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, styles.headerLogo]}>
             <Text style={{ fontWeight: 'bold', fontSize: 10 }}>MINERA ICM</Text>
          </View>
          <View style={[styles.tableCell, styles.headerTitle]}>
            <Text>REPORTE DE INSPECCIÓN</Text>
          </View>
          <View style={[styles.tableCell, styles.headerMeta, { padding: 0 }]}>
            <View style={styles.tableRow}>
               <Text style={styles.metaLabel}>CÓDIGO:</Text>
               <Text style={styles.metaValue}>SST-INS-{data.id?.slice(-6).toUpperCase() || 'N/A'}</Text>
            </View>
            <View style={styles.tableRow}>
               <Text style={styles.metaLabel}>REV:</Text>
               <Text style={styles.metaValue}>00</Text>
            </View>
            <View style={styles.tableRow}>
               <Text style={styles.metaLabel}>FECHA:</Text>
               <Text style={styles.metaValue}>{new Date().toLocaleDateString()}</Text>
            </View>
          </View>
        </View>

        {/* ROW 2: Inspection Type */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: '10%', backgroundColor: '#E5E7EB' }]}>
            <Text style={{ fontWeight: 'bold' }}>Tipo de Inspección:</Text>
          </View>
          <View style={[styles.tableCell, { width: '90%', flexDirection: 'row', justifyContent: 'space-around' }]}>
            <Text>PLANEADA MENSUAL: [ {data.inspection_type_name === 'MENSUAL' ? 'X' : ' '} ]</Text>
            <Text>PLANEADA GERENCIAL: [ {data.inspection_type_name === 'GERENCIAL' ? 'X' : ' '} ]</Text>
            <Text>NO PLANEADA: [ {data.status === 'EMERGENCIA' ? 'X' : ' '} ]</Text>
            <Text>OTRO: [ ]</Text>
          </View>
        </View>

        {/* ROW 3: Company Info */}
        <View style={styles.tableRow}>
          <View style={{ width: '15%' }}>
             <Text style={styles.infoBarLabel}>RAZÓN SOCIAL</Text>
             <Text style={styles.infoBarValue}>MINERA INMACULADA CONCEPCIÓN Y MILAGROSA S.A.C.</Text>
          </View>
          <View style={{ width: '10%' }}>
             <Text style={styles.infoBarLabel}>RUC</Text>
             <Text style={styles.infoBarValue}>20534547715</Text>
          </View>
          <View style={{ width: '25%' }}>
             <Text style={styles.infoBarLabel}>DOMICILIO</Text>
             <Text style={styles.infoBarValue}>Asociación Centro Poblado - Saramarca Km 14.5 - Distrito de Palpa</Text>
          </View>
          <View style={{ width: '15%' }}>
             <Text style={styles.infoBarLabel}>ACTIVIDAD ECONÓMICA</Text>
             <Text style={styles.infoBarValue}>MINERÍA</Text>
          </View>
          <View style={{ width: '15%' }}>
             <Text style={styles.infoBarLabel}>UNIDAD / DEPENDENCIA</Text>
             <Text style={styles.infoBarValue}>PLANTA SARAMARCA II</Text>
          </View>
          <View style={{ width: '20%' }}>
             <Text style={styles.infoBarLabel}>N° TRABAJADORES EN CENTRO LABORAL</Text>
             <Text style={styles.infoBarValue}>5</Text>
          </View>
        </View>

        {/* ROW 4: Inspection Details */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: '30%', alignItems: 'flex-start' }]}>
            <Text style={{ fontWeight: 'bold' }}>AREAS INSPECCIONADAS: <Text style={{ fontWeight: 'normal' }}>{data.area_name} / {data.subarea_name}</Text></Text>
            <Text style={{ fontWeight: 'bold', marginTop: 2 }}>FECHA: <Text style={{ fontWeight: 'normal' }}>{new Date(data.inspection_date).toLocaleDateString()}</Text></Text>
          </View>
          <View style={[styles.tableCell, { width: '70%', padding: 0 }]}>
            <View style={[styles.tableRow, { backgroundColor: '#E5E7EB' }]}>
               <Text style={{ width: '40%', textAlign: 'center', fontWeight: 'bold' }}>EQUIPO DE INSPECTORES:</Text>
               <Text style={{ width: '40%', textAlign: 'center', fontWeight: 'bold' }}>CARGO:</Text>
               <Text style={{ width: '20%', textAlign: 'center', fontWeight: 'bold' }}>FIRMAS:</Text>
            </View>
            <View style={styles.tableRow}>
               <Text style={{ width: '40%', padding: 2 }}>{data.inspector_name}</Text>
               <Text style={{ width: '40%', padding: 2 }}>INSPECTOR SST</Text>
               <Text style={{ width: '20%', padding: 2 }}></Text>
            </View>
          </View>
        </View>

        {/* ROW 5: Object */}
        <View style={styles.tableRow}>
          <View style={[styles.tableCell, { width: '15%', backgroundColor: '#E5E7EB' }]}>
            <Text style={{ fontWeight: 'bold' }}>OBJETO DE LA INSPECCIÓN:</Text>
          </View>
          <View style={[styles.tableCell, { width: '85%', alignItems: 'flex-start' }]}>
            <Text>{data.summary || 'Verificar el cumplimiento de los estándares establecidos.'}</Text>
          </View>
        </View>

        {/* TABLE HEADER */}
        <View style={[styles.tableRow, styles.findingsHeader]}>
          <View style={[styles.tableCell, { width: '3%' }]}><Text>ITE M</Text></View>
          <View style={[styles.tableCell, { width: '10%' }]}><Text>ÁREA</Text></View>
          <View style={[styles.tableCell, { width: '6%', padding: 0 }]}>
            <Text style={{ borderBottomWidth: 0.5, width: '100%', padding: 1 }}>Causa: Acto / Condición</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: '50%', borderRightWidth: 0.5, backgroundColor: '#EF4444', color: '#FFF' }}>AI</Text>
              <Text style={{ width: '50%', backgroundColor: '#7C3AED', color: '#FFF' }}>CI</Text>
            </View>
          </View>
          <View style={[styles.tableCell, { width: '15%' }]}><Text>OBSERVACIONES</Text></View>
          <View style={[styles.tableCell, { width: '10%' }]}><Text>EVIDENCIA DE OBSERVACIÓN</Text></View>
          <View style={[styles.tableCell, { width: '6%', padding: 0 }]}>
            <Text style={{ borderBottomWidth: 0.5, width: '100%', padding: 1 }}>CLASIFICACIÓN DE PELIGRO</Text>
            <View style={{ flexDirection: 'row' }}>
              <Text style={{ width: '33%', borderRightWidth: 0.5, backgroundColor: '#EF4444', color: '#FFF' }}>A</Text>
              <Text style={{ width: '33%', borderRightWidth: 0.5, backgroundColor: '#F59E0B', color: '#FFF' }}>B</Text>
              <Text style={{ width: '34%', backgroundColor: '#10B981', color: '#FFF' }}>C</Text>
            </View>
          </View>
          <View style={[styles.tableCell, { width: '12%' }]}><Text>MEDIDA CORRECTIVA / PREVENTIVA</Text></View>
          <View style={[styles.tableCell, { width: '8%' }]}><Text>RESPONSABLE</Text></View>
          <View style={[styles.tableCell, { width: '8%' }]}><Text>PLAZO DE CUMPLIMIENTO</Text></View>
          <View style={[styles.tableCell, { width: '10%' }]}><Text>EVIDENCIA DE CUMPLIMIENTO</Text></View>
          <View style={[styles.tableCell, { width: '12%' }]}><Text>DESCRIPCIÓN DEL LEVANTAMIENTO</Text></View>
        </View>

        {/* TABLE DATA */}
        {data.findings.map((f: any, index: number) => (
          <View key={f.id} style={styles.tableRow} wrap={false}>
            <View style={[styles.tableCell, { width: '3%' }]}><Text>{index + 1}</Text></View>
            <View style={[styles.tableCell, { width: '10%', alignItems: 'flex-start' }]}>
               <Text>{data.area_name}</Text>
               <Text style={{ fontSize: 4, color: '#666' }}>{data.subarea_name}</Text>
            </View>
            <View style={[styles.tableCell, { width: '6%', flexDirection: 'row', padding: 0 }]}>
              <View style={[styles.tableCell, { width: '50%', height: '100%', borderBottomWidth: 0, borderTopWidth: 0, borderLeftWidth: 0, backgroundColor: f.cause_type === 'AI' ? '#FCA5A5' : '#FFF' }]}>
                <Text>{f.cause_type === 'AI' ? 'X' : ''}</Text>
              </View>
              <View style={[styles.tableCell, { width: '50%', height: '100%', borderBottomWidth: 0, borderTopWidth: 0, borderRightWidth: 0, backgroundColor: f.cause_type === 'CI' ? '#C4B5FD' : '#FFF' }]}>
                <Text>{f.cause_type === 'CI' ? 'X' : ''}</Text>
              </View>
            </View>
            <View style={[styles.tableCell, { width: '15%', alignItems: 'flex-start' }]}>
               <Text style={{ fontWeight: 'bold', fontSize: 5 }}>{f.hazard_code}</Text>
               <Text>{f.observation}</Text>
            </View>
            <View style={[styles.tableCell, { width: '10%' }]}>
               {f.photos?.[0] && <Image src={f.photos[0].photo_url} style={styles.photo} />}
            </View>
            <View style={[styles.tableCell, { width: '6%', flexDirection: 'row', padding: 0 }]}>
              <View style={[styles.tableCell, { width: '33%', height: '100%', borderTopWidth: 0, borderBottomWidth: 0, borderLeftWidth: 0, backgroundColor: f.severity === 'A' ? '#EF4444' : '#FFF' }]}>
                <Text style={{ color: f.severity === 'A' ? '#FFF' : '#000' }}>{f.severity === 'A' ? 'A' : ''}</Text>
              </View>
              <View style={[styles.tableCell, { width: '33%', height: '100%', borderTopWidth: 0, borderBottomWidth: 0, backgroundColor: f.severity === 'B' ? '#F59E0B' : '#FFF' }]}>
                <Text style={{ color: f.severity === 'B' ? '#FFF' : '#000' }}>{f.severity === 'B' ? 'B' : ''}</Text>
              </View>
              <View style={[styles.tableCell, { width: '34%', height: '100%', borderTopWidth: 0, borderBottomWidth: 0, borderRightWidth: 0, backgroundColor: f.severity === 'C' ? '#10B981' : '#FFF' }]}>
                <Text style={{ color: f.severity === 'C' ? '#FFF' : '#000' }}>{f.severity === 'C' ? 'C' : ''}</Text>
              </View>
            </View>
            <View style={[styles.tableCell, { width: '12%', alignItems: 'flex-start' }]}>
               <Text>{f.corrective_actions?.[0]?.description || 'Pendiente de definir medida correctiva.'}</Text>
            </View>
            <View style={[styles.tableCell, { width: '8%' }]}><Text>{f.responsible_name || '-'}</Text></View>
            <View style={[styles.tableCell, { width: '8%' }]}><Text>{f.deadline ? new Date(f.deadline).toLocaleDateString() : '-'}</Text></View>
            <View style={[styles.tableCell, { width: '10%' }]}></View>
            <View style={[styles.tableCell, { width: '12%' }]}></View>
          </View>
        ))}
      </View>

      {/* FOOTER: Definitions & Responsibility */}
      <View style={styles.footerSection}>
        <Text style={{ fontWeight: 'bold' }}>CLASIFICACIÓN DE PELIGRO:</Text>
        <Text>A: Peligro, conducción o práctica capaz de causar incapacidad permanente, pérdida de la vida o de alguna parte del cuerpo, daño permanente a la salud o posible impacto ambiental con una extensión mas allá instalaciones (completar en 24 horas)</Text>
        <Text>B: Es una condición o practica que puede causar una lesión o enfermedad grave dando como resultados incapacidad temporal o daño a la propiedad, medio ambiente de tipo destructivo pero no muy extenso (completar en 72 horas)</Text>
        <Text>C: Condición o practica capaz de causar lesiones menores, no incapacitantes, enfermedad leve o daño menor a la propiedad y/o Medio ambiente</Text>
        
        <View style={{ flexDirection: 'row', marginTop: 2 }}>
           <View style={{ width: '50%', backgroundColor: '#FCA5A5', padding: 1, border: 0.5 }}><Text>AI: Actos Inseguros</Text></View>
           <View style={{ width: '50%', backgroundColor: '#C4B5FD', padding: 1, border: 0.5 }}><Text>CI: Condición Insegura</Text></View>
        </View>

        <View style={styles.footerGrid}>
           <View style={[styles.signatureBox, { width: '30%', backgroundColor: '#E5E7EB' }]}><Text style={{ fontWeight: 'bold' }}>RESPONSABLE DEL REGISTRO</Text></View>
           <View style={[styles.signatureBox, { width: '25%' }]}><Text>NOMBRE Y APELLIDOS</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}><Text>PUESTO</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}><Text>FECHA</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}><Text>FIRMA</Text></View>
        </View>
        <View style={styles.footerGrid}>
           <View style={[styles.signatureBox, { width: '30%', height: 20 }]}><Text></Text></View>
           <View style={[styles.signatureBox, { width: '25%' }]}><Text style={{ fontSize: 6 }}>{data.inspector_name}</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}><Text>INSPECTOR SST</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}><Text>{new Date(data.inspection_date).toLocaleDateString()}</Text></View>
           <View style={[styles.signatureBox, { width: '15%' }]}>
              {data.inspector_signature && <Image src={data.inspector_signature} style={{ width: 30, height: 15 }} />}
           </View>
        </View>
      </View>
    </Page>
  </Document>
);

export class InspectionReportService {
  async generateInspectionPdf(supabaseClient: any, inspectionId: string, userId: string): Promise<Buffer> {
    // 1. Validate and Fetch all necessary data
    const { data: inspection, error: inspectionError } = await supabaseClient
      .from('inspections')
      .select(`
        *,
        areas(name),
        subareas(name),
        inspection_types(name),
        template_versions(name, version_code),
        profiles:inspector_id(full_name, signature_url)
      `)
      .eq('id', inspectionId)
      .single();

    if (inspectionError || !inspection) {
      throw new Error('Inspección no encontrada');
    }

    // 2. Fetch findings with hazards, responsible profiles, and PHOTOS
    const { data: findings, error: findingsError } = await supabaseClient
      .from('findings')
      .select(`
        *,
        iperc_hazards(code, description, risk_level),
        profiles:responsible_id(full_name),
        corrective_actions(description, status, completion_date),
        finding_photos(photo_url)
      `)
      .eq('inspection_id', inspectionId);

    // 3. Prepare data for the PDF
    const reportData = {
      ...inspection,
      area_name: inspection.areas?.name,
      subarea_name: inspection.subareas?.name,
      inspection_type_name: inspection.inspection_types?.name,
      template_version: inspection.template_versions?.version_code,
      inspector_name: inspection.profiles?.full_name,
      inspector_signature: inspection.profiles?.signature_url,
      findings: findings?.map((f: any) => ({
        ...f,
        hazard_code: f.iperc_hazards?.code,
        hazard_description: f.iperc_hazards?.description,
        responsible_name: f.profiles?.full_name,
        photos: f.finding_photos || []
      })) || []
    };

    // 4. Generate PDF buffer
    const buffer = await renderToBuffer(<InspectionReportPDF data={reportData} />);
    
    return Buffer.from(buffer);
  }
}

export const inspectionReportService = new InspectionReportService();
