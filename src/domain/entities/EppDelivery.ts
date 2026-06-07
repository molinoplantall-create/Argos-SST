export type EppDeliveryStatus = 'BORRADOR' | 'EMITIDO' | 'FIRMADO' | 'ANULADO';

export interface IEppDeliveryItem {
  id: string;
  eppId: string;
  eppName: string;
  bodyZone?: string;
  quantity: number;
  unit: string;
  size?: string;
  certification?: string;
  unitPrice?: number;
  currency?: string;
  observation?: string;
  workerSignatureUrl?: string;
  signedAt?: Date;
}

export interface IEppDelivery {
  id: string;
  clientId: string;
  workerId: string;
  deliveredById: string;
  deliveryDate: Date;
  status: EppDeliveryStatus;
  items: IEppDeliveryItem[];
  deliveredBySignatureUrl?: string;
  documentCode?: string;
  notes?: string;
}

export class EppDelivery implements IEppDelivery {
  constructor(
    public id: string,
    public clientId: string,
    public workerId: string,
    public deliveredById: string,
    public deliveryDate: Date,
    public items: IEppDeliveryItem[],
    public status: EppDeliveryStatus = 'BORRADOR',
    public deliveredBySignatureUrl?: string,
    public documentCode?: string,
    public notes?: string
  ) {}

  static create(data: Omit<IEppDelivery, 'id' | 'status'> & { status?: EppDeliveryStatus }): EppDelivery {
    if (!data.clientId) throw new Error('El cliente es obligatorio para una entrega de EPP.');
    if (!data.workerId) throw new Error('El trabajador es obligatorio para una entrega de EPP.');
    if (!data.deliveredById) throw new Error('El responsable de entrega es obligatorio.');
    if (data.items.length === 0) throw new Error('Debe entregar al menos un EPP.');

    data.items.forEach((item) => {
      if (item.quantity <= 0) throw new Error(`La cantidad de ${item.eppName} debe ser mayor a cero.`);
    });

    return new EppDelivery(
      crypto.randomUUID(),
      data.clientId,
      data.workerId,
      data.deliveredById,
      data.deliveryDate,
      data.items,
      data.status ?? 'BORRADOR',
      data.deliveredBySignatureUrl,
      data.documentCode,
      data.notes
    );
  }

  signItem(itemId: string, workerSignatureUrl: string) {
    if (!workerSignatureUrl) throw new Error('La firma del trabajador es obligatoria para el EPP entregado.');

    const item = this.items.find((deliveryItem) => deliveryItem.id === itemId);
    if (!item) throw new Error('No se encontro el EPP entregado.');

    item.workerSignatureUrl = workerSignatureUrl;
    item.signedAt = new Date();
  }

  signResponsible(signatureUrl: string) {
    if (!signatureUrl) throw new Error('La firma del responsable de entrega es obligatoria.');
    this.deliveredBySignatureUrl = signatureUrl;
  }

  allItemsSigned(): boolean {
    return this.items.length > 0 && this.items.every((item) => Boolean(item.workerSignatureUrl));
  }

  canBeIssued(): boolean {
    return this.allItemsSigned() && Boolean(this.deliveredBySignatureUrl);
  }

  issue() {
    if (!this.canBeIssued()) {
      throw new Error('Para emitir la entrega deben firmar el trabajador por cada EPP y el responsable de entrega.');
    }

    this.status = 'FIRMADO';
  }
}
