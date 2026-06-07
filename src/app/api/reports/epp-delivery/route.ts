import { NextRequest, NextResponse } from 'next/server';
import { eppDeliveryReportService, EppDeliveryReportData } from '@/application/reports/eppDeliveryReportService';

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as EppDeliveryReportData;

    if (!data.worker?.fullName || !data.items?.length) {
      return NextResponse.json(
        { error: 'Se requiere trabajador y al menos un EPP entregado.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await eppDeliveryReportService.generatePdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="entrega-epp.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating EPP delivery PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar entrega de EPP.' },
      { status: 500 }
    );
  }
}
