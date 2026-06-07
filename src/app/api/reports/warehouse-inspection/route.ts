import { NextRequest, NextResponse } from 'next/server';
import {
  warehouseInspectionReportService,
  WarehouseInspectionReportData,
} from '@/application/reports/warehouseInspectionReportService';

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as WarehouseInspectionReportData;

    if (!data.client?.legalName || !data.items?.length) {
      return NextResponse.json(
        { error: 'Se requiere razon social y al menos un item de inspeccion.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await warehouseInspectionReportService.generatePdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="inspeccion-almacenes.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating warehouse inspection PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar inspeccion de almacenes.' },
      { status: 500 }
    );
  }
}
