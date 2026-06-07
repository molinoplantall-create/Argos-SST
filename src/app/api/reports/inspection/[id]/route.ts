import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';
import { inspectionReportService } from '@/application/reports/inspectionReportService';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: inspectionId } = await params;
    const supabase = await createClient();

    // 1. Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Generate PDF using service
    // The service uses RLS, so it will only return data if the user has access
    const pdfBuffer = await inspectionReportService.generateInspectionPdf(
      supabase,
      inspectionId,
      user.id
    );

    // 3. Return PDF with appropriate headers
    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="inspeccion-${inspectionId.substring(0, 8)}.pdf"`,
      },
    });

  } catch (error: any) {
    console.error('Error generating PDF:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al generar el reporte' },
      { status: 500 }
    );
  }
}
