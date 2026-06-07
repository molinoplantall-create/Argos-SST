import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

export type EppInspectionReportItem = {
  name: string;
  size?: string;
  certification?: string;
  assignedDate?: string;
  status: string;
  condition: 'BUENO' | 'MALO';
  cleaningOk: boolean;
  useOk: boolean;
  observation?: string;
  recommendation?: string;
  deactivationReason?: string;
};

export type EppInspectionReportData = {
  documentCode?: string;
  revision?: string;
  inspectionDate: string;
  client: {
    legalName: string;
    ruc: string;
    address: string;
    activity: string;
    logoUrl?: string;
  };
  worker: {
    fullName: string;
    documentNumber: string;
    position: string;
    area: string;
  };
  inspectedBy: {
    fullName: string;
    signatureUrl?: string;
  };
  workerSignatureUrl?: string;
  items: EppInspectionReportItem[];
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
  markOk: {
    color: colors.blue,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  markBad: {
    color: colors.red,
    fontWeight: 'bold',
    textAlign: 'center',
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

function EppInspectionPDF({ data }: { data: EppInspectionReportData }) {
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
              <Text style={styles.subtitle}>FORMATO DE INSPECCION DE EPP</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '20%', padding: 0 }]}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Codigo</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.documentCode ?? 'SST-EPP-INS'}</Text>
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
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>DATOS DEL EMPLEADOR</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '32%' }]}>
              <Text style={styles.label}>Razon social</Text>
              <Text style={styles.value}>{data.client.legalName}</Text>
            </View>
            <View style={[styles.cell, { width: '13%' }]}>
              <Text style={styles.label}>RUC</Text>
              <Text style={styles.value}>{data.client.ruc}</Text>
            </View>
            <View style={[styles.cell, { width: '36%' }]}>
              <Text style={styles.label}>Domicilio</Text>
              <Text style={styles.value}>{data.client.address}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '19%' }]}>
              <Text style={styles.label}>Actividad</Text>
              <Text style={styles.value}>{data.client.activity}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>DATOS DE INSPECCION</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '30%' }]}>
              <Text style={styles.label}>Trabajador</Text>
              <Text style={styles.value}>{data.worker.fullName}</Text>
            </View>
            <View style={[styles.cell, { width: '12%' }]}>
              <Text style={styles.label}>DNI / Codigo</Text>
              <Text style={styles.value}>{data.worker.documentNumber}</Text>
            </View>
            <View style={[styles.cell, { width: '20%' }]}>
              <Text style={styles.label}>Cargo</Text>
              <Text style={styles.value}>{data.worker.position}</Text>
            </View>
            <View style={[styles.cell, { width: '22%' }]}>
              <Text style={styles.label}>Area / Proyecto</Text>
              <Text style={styles.value}>{data.worker.area}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '16%' }]}>
              <Text style={styles.label}>Inspeccionado por</Text>
              <Text style={styles.value}>{data.inspectedBy.fullName}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerFill, { width: '4%' }]}>Item</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '20%' }]}>EPP inspeccionado</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '9%' }]}>Entrega</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Certificacion</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '5%' }]}>B</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '5%' }]}>M</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '7%' }]}>Limp.</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '7%' }]}>Uso</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Estado</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '12%' }]}>Observacion</Text>
            <Text style={[styles.cell, styles.headerFill, styles.lastCell, { width: '11%' }]}>Accion</Text>
          </View>

          {data.items.map((item, index) => (
            <View style={styles.row} key={`${item.name}-${index}`} wrap={false}>
              <Text style={[styles.cell, { width: '4%', textAlign: 'center' }]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: '20%' }]}>{item.name}{item.size ? ` / Talla ${item.size}` : ''}</Text>
              <Text style={[styles.cell, { width: '9%', textAlign: 'center' }]}>{item.assignedDate ?? '-'}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{item.certification ?? '-'}</Text>
              <Text style={[styles.cell, item.condition === 'BUENO' ? styles.markOk : styles.markBad, { width: '5%' }]}>
                {item.condition === 'BUENO' ? 'X' : ''}
              </Text>
              <Text style={[styles.cell, item.condition === 'MALO' ? styles.markBad : styles.markOk, { width: '5%' }]}>
                {item.condition === 'MALO' ? 'X' : ''}
              </Text>
              <Text style={[styles.cell, item.cleaningOk ? styles.markOk : styles.markBad, { width: '7%' }]}>
                {item.cleaningOk ? 'OK' : 'OBS'}
              </Text>
              <Text style={[styles.cell, item.useOk ? styles.markOk : styles.markBad, { width: '7%' }]}>
                {item.useOk ? 'OK' : 'OBS'}
              </Text>
              <Text style={[styles.cell, { width: '10%', color: item.status === 'ACTIVO' ? colors.blue : colors.red, fontWeight: 'bold' }]}>
                {item.status}
              </Text>
              <Text style={[styles.cell, { width: '12%' }]}>{item.observation || item.deactivationReason || '-'}</Text>
              <Text style={[styles.cell, styles.lastCell, { width: '11%' }]}>{item.recommendation || '-'}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>CONVENCIONES</Text>
          </View>
          <View style={styles.row}>
            <Text style={[styles.cell, { width: '25%' }]}>B: Bueno</Text>
            <Text style={[styles.cell, { width: '25%' }]}>M: Malo</Text>
            <Text style={[styles.cell, { width: '25%' }]}>Limp.: Limpieza</Text>
            <Text style={[styles.cell, styles.lastCell, { width: '25%' }]}>Uso: Uso correcto del EPP</Text>
          </View>
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>FIRMAS DEL REGISTRO</Text>
          </View>
          <View style={styles.row}>
            <SignatureBlock title="Trabajador inspeccionado" name={data.worker.fullName} src={data.workerSignatureUrl} />
            <SignatureBlock title="Responsable del registro" name={data.inspectedBy.fullName} src={data.inspectedBy.signatureUrl} />
          </View>
        </View>

        <Text style={styles.footerNote}>
          El presente registro evidencia la inspeccion de los EPP activos asignados al trabajador. Los EPP dados de baja
          o reemplazados no deben volver a aparecer como activos en inspecciones posteriores.
        </Text>
      </Page>
    </Document>
  );
}

export class EppInspectionReportService {
  async generatePdf(data: EppInspectionReportData): Promise<Buffer> {
    const buffer = await renderToBuffer(<EppInspectionPDF data={data} />);
    return Buffer.from(buffer);
  }
}

export const eppInspectionReportService = new EppInspectionReportService();
