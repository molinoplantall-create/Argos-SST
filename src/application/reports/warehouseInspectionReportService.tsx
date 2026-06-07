import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

export type WarehouseInspectionReportItem = {
  zone: string;
  causeType: 'AI' | 'CI' | 'AS' | 'CS' | 'NA';
  riskLevel: 'A' | 'B' | 'C';
  observation?: string;
  correctiveAction?: string;
  responsible?: string;
  dueDate?: string;
  status: 'PENDIENTE' | 'EN_PROCESO' | 'CERRADO';
  photoName?: string;
};

export type WarehouseInspectionReportData = {
  documentCode?: string;
  revision?: string;
  inspectionType: string;
  inspectionDate: string;
  client: {
    legalName: string;
    ruc: string;
    project?: string;
    logoUrl?: string;
  };
  inspectedAreas: string;
  areaResponsible: string;
  objective: string;
  inspector: {
    fullName: string;
    signatureUrl?: string;
  };
  responsibleSignatureUrl?: string;
  items: WarehouseInspectionReportItem[];
};

const colors = {
  red: '#E62727',
  paper: '#F3F2EC',
  border: '#111111',
  petrol: '#1E93AB',
  orange: '#FF7F11',
  blue: '#134686',
};

const styles = StyleSheet.create({
  page: {
    padding: 18,
    fontFamily: 'Helvetica',
    fontSize: 7,
    color: '#111111',
    backgroundColor: '#FFFFFF',
  },
  table: {
    width: '100%',
    borderWidth: 0.7,
    borderColor: colors.border,
  },
  row: {
    flexDirection: 'row',
  },
  cell: {
    borderRightWidth: 0.7,
    borderBottomWidth: 0.7,
    borderColor: colors.border,
    padding: 4,
    justifyContent: 'center',
  },
  lastCell: {
    borderRightWidth: 0,
  },
  band: {
    backgroundColor: colors.petrol,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  headerFill: {
    backgroundColor: '#E9F6F8',
    fontWeight: 'bold',
    textAlign: 'center',
  },
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    color: colors.blue,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 3,
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  label: {
    fontSize: 6,
    fontWeight: 'bold',
    color: '#333333',
    textTransform: 'uppercase',
  },
  value: {
    marginTop: 2,
    fontSize: 7,
  },
  statusOpen: {
    color: colors.red,
    fontWeight: 'bold',
  },
  statusClosed: {
    color: colors.blue,
    fontWeight: 'bold',
  },
  signatureImage: {
    width: 82,
    height: 30,
    objectFit: 'contain',
  },
  signatureText: {
    color: colors.blue,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  footerNote: {
    marginTop: 8,
    color: '#333333',
    fontSize: 6,
    lineHeight: 1.3,
  },
});

function inspectionTypeLabel(value: string) {
  const labels: Record<string, string> = {
    PLANEADA_MENSUAL: 'Planeada mensual',
    PLANEADA_CSST: 'Planeada CSST',
    PLANEADA_GERENCIAL: 'Planeada gerencial',
    NO_PLANEADA: 'No planeada',
    OTRO: 'Otro',
  };

  return labels[value] ?? value;
}

function causeLabel(value: string) {
  const labels: Record<string, string> = {
    AI: 'Acto inseguro',
    CI: 'Condicion insegura',
    AS: 'Acto subestandar',
    CS: 'Condicion subestandar',
    NA: 'No aplica',
  };

  return labels[value] ?? value;
}

function SignatureBlock({ title, name, src }: { title: string; name: string; src?: string }) {
  const isDataImage = src?.startsWith('data:image/');

  return (
    <View style={[styles.cell, { width: '50%', minHeight: 58, alignItems: 'center' }]}>
      <Text style={styles.label}>{title}</Text>
      {isDataImage ? <Image src={src} style={styles.signatureImage} /> : <Text style={styles.signatureText}>FIRMA PENDIENTE</Text>}
      <Text style={styles.value}>{name}</Text>
    </View>
  );
}

function WarehouseInspectionPDF({ data }: { data: WarehouseInspectionReportData }) {
  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '16%', minHeight: 48, alignItems: 'center' }]}>
              {data.client.logoUrl ? (
                <Image src={data.client.logoUrl} style={{ width: 75, height: 34, objectFit: 'contain' }} />
              ) : (
                <Text style={{ fontWeight: 'bold', color: colors.blue }}>LOGO EMPRESA</Text>
              )}
            </View>
            <View style={[styles.cell, { width: '64%', minHeight: 48, alignItems: 'center' }]}>
              <Text style={styles.title}>SISTEMA DE GESTION EN SEGURIDAD Y SALUD EN EL TRABAJO</Text>
              <Text style={styles.subtitle}>REPORTE DE INSPECCION DE AREAS</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '20%', padding: 0 }]}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Codigo</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.documentCode ?? 'SST-ALM-INS'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Revision</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.revision ?? '00'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%', borderBottomWidth: 0 }]}>Fecha</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%', borderBottomWidth: 0 }]}>{data.inspectionDate}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>DATOS GENERALES</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '30%' }]}>
              <Text style={styles.label}>Razon social</Text>
              <Text style={styles.value}>{data.client.legalName}</Text>
            </View>
            <View style={[styles.cell, { width: '12%' }]}>
              <Text style={styles.label}>RUC</Text>
              <Text style={styles.value}>{data.client.ruc}</Text>
            </View>
            <View style={[styles.cell, { width: '18%' }]}>
              <Text style={styles.label}>Proyecto / unidad</Text>
              <Text style={styles.value}>{data.client.project ?? '-'}</Text>
            </View>
            <View style={[styles.cell, { width: '20%' }]}>
              <Text style={styles.label}>Tipo de inspeccion</Text>
              <Text style={styles.value}>{inspectionTypeLabel(data.inspectionType)}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '20%' }]}>
              <Text style={styles.label}>Areas inspeccionadas</Text>
              <Text style={styles.value}>{data.inspectedAreas}</Text>
            </View>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.label}>Responsable del area</Text>
              <Text style={styles.value}>{data.areaResponsible}</Text>
            </View>
            <View style={[styles.cell, { width: '25%' }]}>
              <Text style={styles.label}>Inspector</Text>
              <Text style={styles.value}>{data.inspector.fullName}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '50%' }]}>
              <Text style={styles.label}>Objetivo de la inspeccion</Text>
              <Text style={styles.value}>{data.objective}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerFill, { width: '4%' }]}>Item</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '18%' }]}>Seccion / zona / labor</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Causa</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '7%' }]}>Riesgo</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '21%' }]}>Observaciones</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '18%' }]}>Accion correctiva</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Responsable</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '6%' }]}>Fecha</Text>
            <Text style={[styles.cell, styles.headerFill, styles.lastCell, { width: '6%' }]}>Estado</Text>
          </View>

          {data.items.map((item, index) => (
            <View style={styles.row} key={`${item.zone}-${index}`} wrap={false}>
              <Text style={[styles.cell, { width: '4%', textAlign: 'center' }]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: '18%' }]}>{item.zone}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{causeLabel(item.causeType)}</Text>
              <Text style={[styles.cell, { width: '7%', color: item.riskLevel === 'A' ? colors.red : colors.blue, fontWeight: 'bold', textAlign: 'center' }]}>
                {item.riskLevel}
              </Text>
              <Text style={[styles.cell, { width: '21%' }]}>{item.observation || '-'}</Text>
              <Text style={[styles.cell, { width: '18%' }]}>{item.correctiveAction || '-'}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{item.responsible || '-'}</Text>
              <Text style={[styles.cell, { width: '6%', textAlign: 'center' }]}>{item.dueDate || '-'}</Text>
              <Text style={[styles.cell, styles.lastCell, item.status === 'CERRADO' ? styles.statusClosed : styles.statusOpen, { width: '6%' }]}>
                {item.status}
              </Text>
            </View>
          ))}
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>CLASIFICACION DE PELIGRO</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, { width: '33%' }]}>A: Puede causar incapacidad permanente, perdida de vida, dano permanente a la salud o impacto ambiental mayor. Completar en 24 horas.</Text>
            <Text style={[styles.cell, { width: '34%' }]}>B: Puede causar lesion o enfermedad grave, incapacidad temporal, dano a propiedad o ambiente. Completar en 72 horas.</Text>
            <Text style={[styles.cell, styles.lastCell, { width: '33%' }]}>C: Puede causar lesiones menores, enfermedad leve o dano menor a propiedad, salud o ambiente.</Text>
          </View>
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>FIRMAS DEL REGISTRO</Text>
          </View>
          <View style={styles.row}>
            <SignatureBlock title="Inspector" name={data.inspector.fullName} src={data.inspector.signatureUrl} />
            <SignatureBlock title="Responsable del area" name={data.areaResponsible} src={data.responsibleSignatureUrl} />
          </View>
        </View>

        <Text style={styles.footerNote}>
          Registro preparado para evidenciar inspecciones planeadas y no planeadas en almacenes. Las acciones abiertas deben
          cerrarse con evidencia fotografica y verificacion del responsable SSOMA.
        </Text>
      </Page>
    </Document>
  );
}

export class WarehouseInspectionReportService {
  async generatePdf(data: WarehouseInspectionReportData): Promise<Buffer> {
    const buffer = await renderToBuffer(<WarehouseInspectionPDF data={data} />);
    return Buffer.from(buffer);
  }
}

export const warehouseInspectionReportService = new WarehouseInspectionReportService();
