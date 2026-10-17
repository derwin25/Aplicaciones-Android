export interface MathStep {
  stepNumber: number;
  title: string;
  explanation: string;
  mathExpression: string;
  tip?: string;
}

export interface GraphInfo {
  hasGraph: boolean;
  type: string;
  formulaLabel: string;
  roots?: string[];
  vertex?: string;
  description?: string;
}

export interface MathSolution {
  id: string;
  timestamp: number;
  title: string;
  topic: string;
  difficulty: 'Básico' | 'Intermedio' | 'Avanzado';
  problemTranscription: string;
  problemDescription: string;
  finalAnswer: string;
  tutorSummary: string;
  steps: MathStep[];
  verification?: string;
  keyFormulas?: string[];
  alternativeMethods?: string[];
  graphInfo?: GraphInfo;
  imageSnapshot?: string;
  isFavorite?: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
