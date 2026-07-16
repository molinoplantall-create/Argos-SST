import { NextRequest, NextResponse } from 'next/server';
import { eppHistoryReportService, EppHistoryReportData } from '@/application/reports/eppHistoryReportService';

export async function POST(request: NextRequest) {
  try {
    const data = (await request.json()) as EppHistoryReportData;

    if (!data.worker?.fullName || !data.items?.length) {
      return NextResponse.json(
        { error: 'Se requiere trabajador y al menos un EPP en el historial.' },
        { status: 400 }
      );
    }

    const pdfBuffer = await eppHistoryReportService.generatePdf(data);

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': 'attachment; filename="historial-epp.pdf"',
      },
    });
  } catch (error: any) {
    console.error('Error generating EPP history PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar historial de EPP.' },
      { status: 500 }
    );
  }
}
