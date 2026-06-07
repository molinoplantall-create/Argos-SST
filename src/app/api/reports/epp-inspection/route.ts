import { NextRequest, NextResponse } from 'next/server';
import { eppInspectionReportService, EppInspectionReportData } from '@/application/reports/eppInspectionReportService';

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as EppInspectionReportData;

    if (!data.worker?.fullName || !data.items?.length) {
      return NextResponse.json(
        { error: 'Se requiere trabajador y al menos un EPP inspeccionado.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await eppInspectionReportService.generatePdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="inspeccion-epp.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating EPP inspection PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar inspeccion de EPP.' },
      { status: 500 }
    );
  }
}
