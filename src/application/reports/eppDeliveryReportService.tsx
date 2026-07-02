import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from '@react-pdf/renderer';

export type EppDeliveryReportItem = {
  name: string;
  bodyZone?: string;
  deliveryDate?: string;
  quantity: number;
  unit?: string;
  size?: string;
  certification?: string;
  unitPrice?: number;
  currency?: string;
  observation?: string;
  workerSignatureUrl?: string;
};

export type EppDeliveryReportData = {
  documentCode?: string;
  revision?: string;
  deliveryDate: string;
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
  deliveredBy: {
    fullName: string;
    signatureUrl?: string;
  };
  items: EppDeliveryReportItem[];
};

const colors = {
  red: '#E62727',
  paper: '#F3F2EC',
  border: '#111111',
  softBorder: '#DCDCDC',
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
  footerNote: {
    marginTop: 8,
    color: '#333333',
    fontSize: 6,
    lineHeight: 1.3,
  },
});

function SignatureCell({ src }: { src?: string }) {
  const isDataImage = src?.startsWith('data:image/');

  return (
    <View style={[styles.cell, { width: '12%', minHeight: 38, alignItems: 'center' }]}>
      {isDataImage ? <Image src={src} style={styles.signatureImage} /> : <Text style={styles.signatureText}>PENDIENTE</Text>}
    </View>
  );
}

const moneyFormatter = new Intl.NumberFormat('es-PE', {
  style: 'currency',
  currency: 'PEN',
});

function formatMoney(value?: number) {
  return moneyFormatter.format(Number(value ?? 0));
}

function EppDeliveryPDF({ data }: { data: EppDeliveryReportData }) {
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
              <Text style={styles.subtitle}>REGISTRO DE ENTREGA DE ELEMENTOS Y EQUIPOS DE PROTECCION PERSONAL</Text>
            </View>
            <View style={[styles.cell, styles.metaBox, styles.lastCell]}>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Codigo</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.documentCode ?? 'R-MIC&M-SSO-008'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%' }]}>Revision</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%' }]}>{data.revision ?? '02'}</Text>
              </View>
              <View style={styles.row}>
                <Text style={[styles.cell, styles.label, { width: '42%', borderBottomWidth: 0 }]}>Fecha</Text>
                <Text style={[styles.cell, styles.value, styles.lastCell, { width: '58%', borderBottomWidth: 0 }]}>{data.deliveryDate}</Text>
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
            <Text style={[styles.cell, styles.headerFill, { width: '4%' }]}>Item</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '22%' }]}>EPP entregado</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Fecha</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '8%' }]}>Cantidad</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '7%' }]}>Talla</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '10%' }]}>Certificacion</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '8%' }]}>P. Unit.</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '8%' }]}>Subtotal</Text>
            <Text style={[styles.cell, styles.headerFill, { width: '11%' }]}>Observacion</Text>
            <Text style={[styles.cell, styles.headerFill, styles.lastCell, { width: '12%' }]}>Firma trabajador</Text>
          </View>

          {data.items.map((item, index) => (
            <View style={styles.row} key={`${item.name}-${index}`} wrap={false}>
              <Text style={[styles.cell, { width: '4%', textAlign: 'center' }]}>{index + 1}</Text>
              <Text style={[styles.cell, { width: '22%' }]}>{item.name}</Text>
              <Text style={[styles.cell, { width: '10%', textAlign: 'center' }]}>{item.deliveryDate ?? data.deliveryDate}</Text>
              <Text style={[styles.cell, { width: '8%', textAlign: 'center' }]}>
                {item.quantity} {item.unit ?? ''}
              </Text>
              <Text style={[styles.cell, { width: '7%', textAlign: 'center' }]}>{item.size ?? '-'}</Text>
              <Text style={[styles.cell, { width: '10%' }]}>{item.certification ?? '-'}</Text>
              <Text style={[styles.cell, { width: '8%', textAlign: 'right' }]}>{formatMoney(item.unitPrice)}</Text>
              <Text style={[styles.cell, { width: '8%', textAlign: 'right' }]}>{formatMoney((item.unitPrice ?? 0) * item.quantity)}</Text>
              <Text style={[styles.cell, { width: '11%' }]}>{item.observation ?? '-'}</Text>
              <SignatureCell src={item.workerSignatureUrl} />
            </View>
          ))}
        </View>

        <View style={[styles.table, { marginTop: 8 }]}>
          <View style={styles.row}>
            <Text style={[styles.cell, styles.band, { width: '100%', borderRightWidth: 0 }]}>FIRMAS DEL REGISTRO</Text>
          </View>
          <View style={styles.row}>
            <View style={[styles.cell, { width: '50%' }]}>
              <Text style={styles.label}>Nombre y apellidos</Text>
              <Text style={styles.value}>{data.deliveredBy.fullName}</Text>
            </View>
            <View style={[styles.cell, styles.lastCell, { width: '50%', minHeight: 42, alignItems: 'center' }]}>
              <Text style={styles.label}>Firma responsable de entrega</Text>
              {data.deliveredBy.signatureUrl?.startsWith('data:image/') ? (
                <Image src={data.deliveredBy.signatureUrl} style={styles.signatureImage} />
              ) : (
                <Text style={styles.signatureText}>FIRMA PENDIENTE</Text>
              )}
            </View>
          </View>
        </View>

        <Text style={styles.footerNote}>
          Declaro haber recibido los equipos de proteccion personal indicados, haber sido informado sobre su uso,
          conservacion y reposicion, y me comprometo a utilizarlos durante la ejecucion de mis labores.
        </Text>
      </Page>
    </Document>
  );
}

export class EppDeliveryReportService {
  async generatePdf(data: EppDeliveryReportData): Promise<Buffer> {
    const buffer = await renderToBuffer(<EppDeliveryPDF data={data} />);
    return Buffer.from(buffer);
  }
}

export const eppDeliveryReportService = new EppDeliveryReportService();
