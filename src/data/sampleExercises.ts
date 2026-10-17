export interface SampleExercise {
  id: string;
  title: string;
  topic: string;
  previewMath: string;
  prompt: string;
  renderedText: string[];
}

export const SAMPLE_EXERCISES: SampleExercise[] = [
  {
    id: 'quad-eq',
    title: 'Ecuación Cuadrática',
    topic: 'Álgebra',
    previewMath: '2x^2 + 5x - 3 = 0',
    prompt: 'Resuelve la ecuación cuadrática encontrando los dos valores de x',
    renderedText: ['2x² + 5x - 3 = 0', 'Hallar los valores de x'],
  },
  {
    id: 'integral',
    title: 'Integral Polinomial',
    topic: 'Cálculo',
    previewMath: '\\int (3x^2 - 4x + 5)\\,dx',
    prompt: 'Calcula la integral indefinida paso a paso',
    renderedText: ['∫ (3x² - 4x + 5) dx', 'Encontrar la antiderivada'],
  },
  {
    id: 'system',
    title: 'Sistema de Ecuaciones 2×2',
    topic: 'Álgebra',
    previewMath: '\\begin{cases} 2x + 3y = 13 \\\\ 5x - y = 7 \\end{cases}',
    prompt: 'Resolver el sistema de ecuaciones lineales para x e y',
    renderedText: ['{ 2x + 3y = 13', '{ 5x -  y = 7', 'Resolver para x e y'],
  },
  {
    id: 'trig',
    title: 'Identidad Trigonométrica',
    topic: 'Trigonometría',
    previewMath: '\\frac{\\sin(2x)}{1 + \\cos(2x)} = \\tan(x)',
    prompt: 'Demuestra o simplifica la identidad trigonométrica',
    renderedText: ['Demostrar que:', 'sin(2x) / (1 + cos(2x)) = tan(x)'],
  },
  {
    id: 'derivative',
    title: 'Derivada con Regla de la Cadena',
    topic: 'Cálculo Diferencial',
    previewMath: 'f(x) = \\ln(x^2 + 4)',
    prompt: 'Hallar la primera derivada f\'(x)',
    renderedText: ['f(x) = ln(x² + 4)', 'Hallar f\'(x)'],
  },
  {
    id: 'limits',
    title: 'Límite al Infinito',
    topic: 'Cálculo',
    previewMath: '\\lim_{x \\to \\infty} \\frac{4x^3 - 2x + 1}{2x^3 + 5x^2}',
    prompt: 'Calcular el valor del límite cuando x tiende a infinito',
    renderedText: ['lim (x→∞) (4x³ - 2x + 1) / (2x³ + 5x²)', 'Calcular el límite'],
  },
];

/**
 * Generates a realistic paper/notebook snapshot of a math exercise as a base64 image data URL.
 */
export function generateSampleExerciseImage(exercise: SampleExercise): string {
  const canvas = document.createElement('canvas');
  canvas.width = 700;
  canvas.height = 420;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '';

  // Background: Realistic notebook grid paper or textbook page
  ctx.fillStyle = '#faf9f5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Faint grid lines (like a math notebook)
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  const gridSize = 24;
  for (let x = 0; x < canvas.width; x += gridSize) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, canvas.height);
    ctx.stroke();
  }
  for (let y = 0; y < canvas.height; y += gridSize) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(canvas.width, y);
    ctx.stroke();
  }

  // Notebook red margin line
  ctx.strokeStyle = '#fca5a5';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(60, 0);
  ctx.lineTo(60, canvas.height);
  ctx.stroke();

  // Paper header/date stamp
  ctx.fillStyle = '#94a3b8';
  ctx.font = '14px sans-serif';
  ctx.fillText(`EJERCICIO DE ${exercise.topic.toUpperCase()}`, 80, 45);

  // Handwritten/Pen style exercise
  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 32px "Courier New", monospace, serif';

  exercise.renderedText.forEach((line, index) => {
    ctx.fillText(line, 80, 130 + index * 55);
  });

  // A small subtle doodle or checkmark
  ctx.strokeStyle = '#4f46e5';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(610, 80, 30, 0, Math.PI * 2);
  ctx.stroke();
  ctx.font = 'bold 16px sans-serif';
  ctx.fillStyle = '#4f46e5';
  ctx.fillText('N° ' + (SAMPLE_EXERCISES.indexOf(exercise) + 1), 594, 86);

  return canvas.toDataURL('image/jpeg', 0.9);
}
