import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Shared server-side Gemini client
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Endpoint: Solve Math Problem from Image
app.post('/api/solve-math', async (req, res) => {
  try {
    const { imageBase64, mimeType = 'image/jpeg', userPrompt = '' } = req.body;

    if (!imageBase64 && !userPrompt) {
      return res.status(400).json({ error: 'Se requiere una imagen o un ejercicio matemático escrito.' });
    }

    const systemInstruction = `Eres MathLens AI, el tutor y solucionador matemático más avanzado del mundo para estudiantes de primaria, secundaria y universidad.
Tu misión es analizar la imagen del ejercicio de matemáticas (escrita a mano, impresa en libro, pizarra o pantalla), transcribirla fielmente con LaTeX y resolverla paso a paso con máxima rigurosidad y claridad pedagógica en español.

Debes responder SIEMPRE con un objeto JSON válido (sin formato markdown adicional fuera del JSON, solo el JSON puro) con la siguiente estructura exacta:
{
  "title": "Título corto y descriptivo del ejercicio (ej. 'Ecuación Cuadrática por Fórmula General')",
  "topic": "Rama de las matemáticas (ej. 'Álgebra', 'Cálculo Diferencial', 'Aritmética', 'Trigonometría', 'Geometría', 'Álgebra Lineal', 'Estadística y Probabilidad')",
  "difficulty": "Nivel de dificultad: 'Básico', 'Intermedio' o 'Avanzado'",
  "problemTranscription": "Transcripción exacta del ejercicio en LaTeX entre signos de dólar (ej. '$2x^2 + 5x - 3 = 0$')",
  "problemDescription": "Breve explicación en texto de lo que pide el problema",
  "finalAnswer": "Respuesta final destacada y simplificada al máximo, usando LaTeX (ej. '$x_1 = \\\\frac{1}{2},\\\\quad x_2 = -3$')",
  "tutorSummary": "Resumen pedagógico amigable de 1 a 2 oraciones sobre la estrategia utilizada para resolverlo.",
  "steps": [
    {
      "stepNumber": 1,
      "title": "Nombre del paso (ej. 'Identificar coeficientes')",
      "explanation": "Explicación detallada de POR QUÉ se hace esto y qué regla matemática se aplica.",
      "mathExpression": "Fórmula o expresión matemática resultante de este paso en LaTeX (ej. '$a = 2,\\\\ b = 5,\\\\ c = -3$')",
      "tip": "Consejo o advertencia sobre errores comunes (opcional, ej. 'Cuidado con los signos al sustituir')"
    }
  ],
  "verification": "Paso de comprobación para verificar que el resultado es correcto (ej. sustitución de variables).",
  "keyFormulas": ["Lista de fórmulas o teoremas clave utilizados, en LaTeX (ej. '$x = \\\\frac{-b \\\\pm \\\\sqrt{b^2 - 4ac}}{2a}$', '$D = b^2 - 4ac$')"],
  "alternativeMethods": ["Mención breve de otros métodos posibles para resolverlo (ej. 'Método de Factorización por aspa simple')"],
  "graphInfo": {
    "hasGraph": true,
    "type": "function",
    "formulaLabel": "f(x) = 2x^2 + 5x - 3",
    "roots": ["0.5", "-3"],
    "vertex": "(-1.25, -6.125)",
    "description": "Parábola con ramas hacia arriba y vértice mínimo."
  }
}

Reglas importantes:
1. Asegúrate de transcribir fielmente símbolos, fracciones, exponentes, integrales, derivadas, matrices, vectores o figuras.
2. Si la imagen contiene varios ejercicios, resuelve el principal o el más visible en el centro, y aclara en problemDescription.
3. Si la imagen es borrosa o no contiene matemáticas reconocibles, responde con:
   {"error": "No se pudo identificar claramente un ejercicio matemático. Por favor enfoca bien la foto con buena iluminación e inténtalo de nuevo."}
4. Usa doble barra invertida en strings JSON para comandos de LaTeX (ejemplo: \\\\frac{a}{b}, \\\\sqrt{x}, \\\\pm).
5. Devuelve EXCLUSIVAMENTE el JSON.`;

    const contents: any[] = [];
    const parts: any[] = [];

    if (imageBase64) {
      // Clean base64 string if data URL prefix exists
      const cleanBase64 = imageBase64.replace(/^data:image\/[a-zA-Z]+;base64,/, '');
      parts.push({
        inlineData: {
          mimeType: mimeType || 'image/jpeg',
          data: cleanBase64,
        },
      });
    }

    let promptText = 'Analiza esta imagen y resuelve el ejercicio matemático paso a paso según las instrucciones.';
    if (userPrompt && userPrompt.trim()) {
      promptText += ` Indicación adicional del estudiante: "${userPrompt.trim()}".`;
    }
    parts.push({ text: promptText });

    contents.push({ parts });

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: { parts },
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        temperature: 0.2, // low temperature for mathematical precision
      },
    });

    const rawText = response.text || '';
    let parsedData: any;

    try {
      parsedData = JSON.parse(rawText);
    } catch {
      // Fallback regex extraction if there's markdown wrappings
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        parsedData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error('No se pudo procesar la respuesta del modelo como JSON.');
      }
    }

    if (parsedData.error) {
      return res.status(422).json({ error: parsedData.error });
    }

    return res.json(parsedData);
  } catch (error: any) {
    console.error('Error in /api/solve-math:', error);
    return res.status(500).json({
      error: error?.message || 'Error al procesar el ejercicio matemático.',
    });
  }
});

// Endpoint: Multi-turn Math Tutor Chatbot
app.post('/api/math-chat', async (req, res) => {
  try {
    const { messages, currentProblemContext } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ error: 'Se requiere un historial de mensajes.' });
    }

    let systemInstruction = `Eres 'Tutor MathLens', un profesor particular de matemáticas de élite, empático, motivador y extraordinariamente didáctico.
Tu objetivo es responder cualquier pregunta o duda que tenga el estudiante, aclarar pasos del ejercicio que está resolviendo, enseñar conceptos fundamentales y motivarlo.

Instrucciones pedagógicas:
1. Explica con claridad cristalina, desglosando los conceptos difíciles con analogías y lenguaje accesible.
2. Si el estudiante pregunta por qué se hizo un paso en particular, explica la razón lógica detrás de la regla matemática.
3. Utiliza notación matemática formateada con LaTeX: usa $...$ para matemáticas en línea (ej. $x = 3$) y $$...$$ para fórmulas en bloque destacadas.
4. Si el estudiante te pide un ejercicio similar para practicar o una prueba rápida, proporciónale uno adecuado a su nivel.
5. Sé siempre alentador, paciente y cortés en español.`;

    if (currentProblemContext) {
      systemInstruction += `\n\nCONTEXTO ACTUAL DEL EJERCICIO QUE EL ESTUDIANTE ESTÁ RESOLVIENDO:
- Título: ${currentProblemContext.title || 'Ejercicio'}
- Problema original: ${currentProblemContext.problemTranscription || currentProblemContext.problemDescription || ''}
- Respuesta final: ${currentProblemContext.finalAnswer || ''}
- Pasos de solución: ${JSON.stringify(currentProblemContext.steps || [])}
- Fórmulas clave: ${JSON.stringify(currentProblemContext.keyFormulas || [])}`;
    }

    // Format contents for Gemini generateContent
    const contents = messages.map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }));

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents,
      config: {
        systemInstruction,
        temperature: 0.7,
      },
    });

    const replyText = response.text || 'No pude generar una respuesta. Por favor intenta reformular tu pregunta.';
    return res.json({ reply: replyText });
  } catch (error: any) {
    console.error('Error in /api/math-chat:', error);
    return res.status(500).json({
      error: error?.message || 'Error al comunicarse con el tutor de matemáticas.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function setupServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MathLens server listening on port ${PORT}`);
  });
}

setupServer();
