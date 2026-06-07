import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabaseServer';

export async function POST(req: NextRequest) {
  try {
    // 1. Validar sesión
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // 2. Obtener datos del body
    const body = await req.json();
    const { 
      photoUrl, 
      areaName, 
      subareaName, 
      inspectionType, 
      existingObservation 
    } = body;

    if (!photoUrl) {
      return NextResponse.json({ error: 'Se requiere una URL de imagen' }, { status: 400 });
    }

    const apiKey = process.env.AI_API_KEY;
    const apiUrl = process.env.AI_API_URL || 'https://api.openai.com/v1/chat/completions';

    if (!apiKey) {
      console.error('AI_API_KEY no configurada');
      return NextResponse.json({ error: 'Servicio de IA no configurado' }, { status: 500 });
    }

    // 3. Construir el Prompt técnico para SST (Perú)
    const prompt = `
      Eres un Ingeniero Senior experto en Seguridad y Salud en el Trabajo (SST) en Perú, con amplios conocimientos en la Ley 29783.
      Analiza la siguiente imagen de una inspección industrial y proporciona una sugerencia técnica detallada para un hallazgo.
      
      CONTEXTO DE LA INSPECCIÓN:
      - Área: ${areaName || 'No especificada'}
      - Subárea / Zona: ${subareaName || 'No especificada'}
      - Tipo de inspección: ${inspectionType || 'General'}
      ${existingObservation ? `- Observación preliminar del inspector: ${existingObservation}` : ''}

      INSTRUCCIONES:
      Proporciona tu respuesta estrictamente en formato JSON con los siguientes campos:
      1. "suggestedObservation": Descripción técnica, clara y objetiva de lo que se observa en la imagen (enfócate en peligros o incumplimientos).
      2. "suggestedCause": Análisis breve de la posible causa raíz (falta de control, comportamiento, falla de equipo, etc.).
      3. "suggestedRecommendation": Medida correctiva o preventiva inmediata recomendada para mitigar el riesgo.
      4. "suggestedFindingType": Clasificación exacta. Debe ser solo uno de estos valores: "ACTO_INSEGURO", "CONDICION_INSEGURA", "OBSERVACION_POSITIVA".
      5. "suggestedSeverity": Nivel de severidad técnica. Debe ser una sola letra: "A" (Crítico/Alto), "B" (Serio/Medio), "C" (Leve/Bajo).

      REGLAS ADICIONALES:
      - Idioma: Español (Perú).
      - Tono: Profesional, técnico y directo.
      - Si la imagen es una observación positiva, resalta el buen comportamiento o control.
    `;

    // 4. Llamada a la API de IA (Vision + Chat)
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "gpt-4o", // Modelo con capacidades de visión
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
              {
                type: "image_url",
                image_url: {
                  url: photoUrl, // URL pública o firmada de Supabase Storage
                },
              },
            ],
          },
        ],
        response_format: { type: "json_object" },
        temperature: 0.3, // Baja temperatura para mayor consistencia técnica
      })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Error de API de IA:', errorData);
      throw new Error('Error en el servicio de análisis de imagen');
    }

    const aiResponse = await response.json();
    const suggestion = JSON.parse(aiResponse.choices[0].message.content);

    // 5. Devolver sugerencia al frontend
    return NextResponse.json(suggestion);

  } catch (error: any) {
    console.error('Error en suggest-finding:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al procesar la sugerencia' },
      { status: 500 }
    );
  }
}
