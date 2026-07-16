import { formatDate } from '@/lib/utils';
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

export type EppHistoryReportItem = {
  name: string;
  bodyZone?: string;
  assignedDate?: string;
  quantity: number;
  size?: string;
  brand?: string;
  certification?: string;
  unitPrice?: number;
  status: 'ACTIVO' | 'BAJA';
  workerSignatureUrl?: string;
};

export type EppHistoryReportData = {
  documentCode?: string;
  generatedDate: string;
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
  deliveredBy?: {
    fullName: string;
    signatureUrl?: string;
  };
  items: EppHistoryReportItem[];
};

const colors = {
  border: '#111111',
  petrol: '#1E93AB',
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
  title: {
    fontSize: 13,
    fontWeight: 'bold',
    textAlign: 'center',
    color: colors.blue,
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
  logoBox: {
    width: '16%',
    minHeight: 48,
    alignItems: 'center',
  },
  titleBox: {
    width: '64%',
    minHeight: 48,
    alignItems: 'center',
  },
  metaBox: {
    width: '20%',
    padding: 0,
  },
  signatureImage: {
    width: 68,
    height: 26,
    objectFit: 'contain',
  },
  signatureText: {
    color: colors.blue,
    fontSize: 6,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  statusActivo: {
    color: '#15803d',
    fontWeight: 'bold',
  },
  statusBaja: {
    color: '#b91c1c',
    fontWeight: 'bold',
  },
  totalRow: {
    fontWeight: 'bold',
    backgroundColor: '#F3F4F6',
  },
  footerNote: {
    marginTop: 8,
    color: '#333333',
    fontSize: 6,
    lineHeight: 1.3,
  },
});

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

function formatMoney(value?: number) {
  return moneyFormatter.format(Number(value ?? 0));
}

// Anchos de columna compartidos por el header, las filas y la fila de total,
// para que el total quede exactamente debajo de "P. Unit." y los bordes
// de todas las celdas (incluida la firma) queden alineados y uniformes.
const COL = {
  item: 3,
  epp: 18,
  fecha: 9,
  cantidad: 6,
  talla: 6,
  marca: 9,
  certificacion: 10,
  precio: 8,
  estado: 8,
  firma: 23,
};

function SignatureCell({ src }: { src?: string }) {
  const isDataImage = src?.startsWith('data:image/');

  return (
    <View style={[styles.cell, styles.lastCell, { width: `${COL.firma}%`, alignItems: 'center', justifyContent: 'center' }]}>
      {isDataImage ? <Image src={src} style={styles.signatureImage} /> : <Text style={styles.signatureText}>PENDIENTE</Text>}
    </View>
  );
}

function EppHistoryPDF({ data }: { data: EppHistoryReportData }) {
  const total = data.items.reduce((sum, item) => sum + (item.unitPrice ?? 0) * item.quantity, 0);

  return (
    <Document>
      <Page size="A4" orientation="landscape" style={styles.page}>
        <View style={styles.table}>
          <View style={styles.row}>
            <View style={[styles.cell, styles.logoBox]}>
              {data.client.logoUrl ? (
                <Image src={data.client.logoUrl} style={{ width: 75, height: 34, objectFit: 'contain' }} />
              ) : (
                <Text style={{ fontWeight: 'bold', color: colors.blue }}>LOGO EMPRESA</Text>
              )}
            </View>
            <View style={[styles.cell, styles.titleBox]}>
              <Text style={styles.title}>SISTEMA DE GESTION DE SEGURIDAD Y SALUD OCUPACIONAL</Text>
              <Text style={styles.subtitle}>HISTORIAL DE EQUIPOS DE PROTECCION PERSONAL ENTREGADOS</Text>
            </View>
            <View style={[styles.cell, styles.metaBox, styles.lastCell]}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Codigo</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.documentCode ?? 'R-MIC&M-SSO-008'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%', borderBottomWidth: 0 }]}>Generado</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%', borderBottomWidth: 0 }]}>{formatDate(data.generatedDate)}</Text>
              </View>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>DATOS DEL EMPLEADOR</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '32%' }]}>
              <Text style={styles.label}>Razon social o denominacion social</Text>
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
              <Text style={styles.label}>Actividad economica</Text>
              <Text style={styles.value}>{data.client.activity}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>DATOS DEL PERSONAL</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '32%' }]}>
              <Text style={styles.label}>Nombres y apellidos</Text>
              <Text style={styles.value}>{data.worker.fullName}</Text>
            </View>
            <View style={[styles.cell, { width: '13%' }]}>
              <Text style={styles.label}>DNI / Codigo</Text>
              <Text style={styles.value}>{data.worker.documentNumber}</Text>
            </View>
            <View style={[styles.cell, { width: '24%' }]}>
              <Text style={styles.label}>Cargo</Text>
              <Text style={styles.value}>{data.worker.position}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '31%' }]}>
              <Text style={styles.label}>Area</Text>
              <Text style={styles.value}>{data.worker.area}</Text>
            </View>
          </View>

          <View style={styles.row}>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.item}%` }]}>Item</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.epp}%` }]}>EPP</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.fecha}%` }]}>Fecha entrega</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.cantidad}%` }]}>Cantidad</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.talla}%` }]}>Talla</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.marca}%` }]}>Marca</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.certificacion}%` }]}>Certificacion</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.precio}%` }]}>P. Unit.</Text>
            <Text style={[styles.cell, styles.headerFill, { width: `${COL.estado}%` }]}>Estado</Text>
            <Text style={[styles.cell, styles.headerFill, styles.lastCell, { width: `${COL.firma}%` }]}>Firma trabajador</Text>
          </View>

          {data.items.map((item, index) => (
            <View style={styles.row} key={`${item.name}-${index}`} wrap={false}>
              <Text style={[styles.cell, { width: `${COL.item}%`, textAlign: 'center' }]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: `${COL.epp}%` }]}>{item.name}</Text>
              <Text style={[styles.cell, { width: `${COL.fecha}%`, textAlign: 'center' }]}>{formatDate(item.assignedDate)}</Text>
              <Text style={[styles.cell, { width: `${COL.cantidad}%`, textAlign: 'center' }]}>{item.quantity}</Text>
              <Text style={[styles.cell, { width: `${COL.talla}%`, textAlign: 'center' }]}>{item.size ?? '-'}</Text>
              <Text style={[styles.cell, { width: `${COL.marca}%` }]}>{item.brand ?? '-'}</Text>
              <Text style={[styles.cell, { width: `${COL.certificacion}%` }]}>{item.certification ?? '-'}</Text>
              <Text style={[styles.cell, { width: `${COL.precio}%`, textAlign: 'right' }]}>{formatMoney(item.unitPrice)}</Text>
              <Text
                style={[
                  styles.cell,
                  { width: `${COL.estado}%`, textAlign: 'center' },
                  item.status === 'ACTIVO' ? styles.statusActivo : styles.statusBaja,
                ]}
              >
                {item.status}
              </Text>
              <SignatureCell src={item.workerSignatureUrl} />
            </View>
          ))}

          <View style={[styles.row, styles.totalRow]} wrap={false}>
            <Text style={[styles.cell, { width: `${COL.item + COL.epp + COL.fecha + COL.cantidad + COL.talla + COL.marca + COL.certificacion}%`, textAlign: 'right' }]}>
              TOTAL GENERAL (activos + baja)
            </Text>
            <Text style={[styles.cell, { width: `${COL.precio}%`, textAlign: 'right' }]}>{formatMoney(total)}</Text>
            <Text style={[styles.cell, { width: `${COL.estado}%` }]}></Text>
            <Text style={[styles.cell, styles.lastCell, { width: `${COL.firma}%` }]}></Text>
          </View>
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>FIRMAS DEL REGISTRO</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '50%' }]}>
              <Text style={styles.label}>Nombre y apellidos</Text>
              <Text style={styles.value}>{data.deliveredBy?.fullName ?? '-'}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '50%', minHeight: 42, alignItems: 'center' }]}>
              <Text style={styles.label}>Firma responsable de entrega</Text>
              {data.deliveredBy?.signatureUrl?.startsWith('data:image/') ? (
                <Image src={data.deliveredBy.signatureUrl} style={styles.signatureImage} />
              ) : (
                <Text style={styles.signatureText}>FIRMA PENDIENTE</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Este reporte incluye todos los equipos de proteccion personal entregados al trabajador,
          independientemente de su estado actual (activo o dado de baja), para fines de auditoria y control.
          Declaro haber recibido los equipos de proteccion personal indicados, haber sido informado sobre su uso,
          conservacion y reposicion, y me comprometo a utilizarlos durante la ejecucion de mis labores.
        </Text>
      </Page>
    </Document>
  );
}

export class EppHistoryReportService {
  async generatePdf(data: EppHistoryReportData): Promise<Buffer> {
    const buffer = await renderToBuffer(<EppHistoryPDF data={data} />);
    return Buffer.from(buffer);
  }
}

export const eppHistoryReportService = new EppHistoryReportService();
