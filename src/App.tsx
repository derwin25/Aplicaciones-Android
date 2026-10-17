import React, { useState, useEffect } from 'react';
import {
  Camera,
  BookOpenCheck,
  MessageSquare,
  History,
  PenTool,
  AlertCircle,
  Smartphone,
  Maximize2,
  Minimize2,
  Sparkles,
} from 'lucide-react';
import { MathSolution, ChatMessage } from './types/math';
import AndroidStatusBar from './components/AndroidStatusBar';
import AndroidNavBar, { NavTab } from './components/AndroidNavBar';
import CameraView from './components/CameraView';
import SolutionView from './components/SolutionView';
import TutorChat from './components/TutorChat';
import HistoryView from './components/HistoryView';
import DrawCanvas from './components/DrawCanvas';

const INITIAL_DEMO_SOLUTION: MathSolution = {
  id: 'demo-quad-1',
  timestamp: Date.now() - 3600000,
  title: 'Ecuación Cuadrática de Segundo Grado',
  topic: 'Álgebra',
  difficulty: 'Intermedio',
  problemTranscription: '$2x^2 + 5x - 3 = 0$',
  problemDescription: 'Resolver la ecuación polinómica de segundo grado para encontrar los valores de x.',
  finalAnswer: '$x_1 = \\frac{1}{2}, \\quad x_2 = -3$',
  tutorSummary: 'Aplicamos la fórmula general cuadrática identificando los coeficientes numéricos y calculando el discriminante para hallar las dos soluciones reales.',
  steps: [
    {
      stepNumber: 1,
      title: 'Identificar los coeficientes',
      explanation: 'La ecuación cuadrática estándar tiene la forma $ax^2 + bx + c = 0$. Identificamos los valores de cada coeficiente:',
      mathExpression: 'a = 2, \\quad b = 5, \\quad c = -3',
      tip: 'Mantén los signos de cada número con especial cuidado (el término independiente es negativo).',
    },
    {
      stepNumber: 2,
      title: 'Calcular el discriminante',
      explanation: 'El discriminante $D = b^2 - 4ac$ determina el tipo y cantidad de raíces. Como $D > 0$, obtendremos 2 raíces reales distintas:',
      mathExpression: 'D = (5)^2 - 4(2)(-3) = 25 - (-24) = 25 + 24 = 49',
      tip: 'Recuerda que menos por menos da más: $-4 \\times 2 \\times (-3) = +24$.',
    },
    {
      stepNumber: 3,
      title: 'Aplicar la fórmula general',
      explanation: 'Sustituimos $a$, $b$ y el discriminante en la fórmula resolvente cuadrática:',
      mathExpression: 'x = \\frac{-b \\pm \\sqrt{D}}{2a} = \\frac{-5 \\pm \\sqrt{49}}{2(2)} = \\frac{-5 \\pm 7}{4}',
    },
    {
      stepNumber: 4,
      title: 'Separar los dos casos del signo ±',
      explanation: 'Evaluamos el signo positivo y negativo por separado para obtener las dos soluciones finales:',
      mathExpression: 'x_1 = \\frac{-5 + 7}{4} = \\frac{2}{4} = \\frac{1}{2}, \\qquad x_2 = \\frac{-5 - 7}{4} = \\frac{-12}{4} = -3',
    },
  ],
  verification: 'Sustituyendo $x = -3$: $2(-3)^2 + 5(-3) - 3 = 2(9) - 15 - 3 = 18 - 18 = 0$. La igualdad se cumple con total exactitud.',
  keyFormulas: [
    'x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}',
    'D = b^2 - 4ac',
  ],
  alternativeMethods: [
    'Método del aspa simple: $(2x - 1)(x + 3) = 0$',
    'Método de completación de cuadrados',
  ],
  graphInfo: {
    hasGraph: true,
    type: 'function',
    formulaLabel: 'f(x) = 2x^2 + 5x - 3',
    roots: ['0.5', '-3'],
    vertex: '(-1.25, -6.125)',
    description: 'Parábola que abre hacia arriba con raíces en x = 0.5 y x = -3.',
  },
  isFavorite: true,
};

export default function App() {
  const [currentTab, setCurrentTab] = useState<NavTab>('camera');
  const [activeSolution, setActiveSolution] = useState<MathSolution | null>(() => {
    const saved = localStorage.getItem('mathlens_active_solution');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return INITIAL_DEMO_SOLUTION;
      }
    }
    return INITIAL_DEMO_SOLUTION;
  });

  const [solutionsHistory, setSolutionsHistory] = useState<MathSolution[]>(() => {
    const saved = localStorage.getItem('mathlens_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      } catch {
        // Fallback
      }
    }
    return [INITIAL_DEMO_SOLUTION];
  });

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(() => {
    const saved = localStorage.getItem('mathlens_chat');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return [];
      }
    }
    return [];
  });

  const [isSolving, setIsSolving] = useState<boolean>(false);
  const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [useDeviceFrame, setUseDeviceFrame] = useState<boolean>(false);
  const [initialChatPrompt, setInitialChatPrompt] = useState<string | undefined>(undefined);

  // Sync state to localStorage
  useEffect(() => {
    localStorage.setItem('mathlens_history', JSON.stringify(solutionsHistory));
  }, [solutionsHistory]);

  useEffect(() => {
    if (activeSolution) {
      localStorage.setItem('mathlens_active_solution', JSON.stringify(activeSolution));
    }
  }, [activeSolution]);

  useEffect(() => {
    localStorage.setItem('mathlens_chat', JSON.stringify(chatMessages));
  }, [chatMessages]);

  // Main Solver Action (via Camera photo, Gallery, or Doodle)
  const handleSolveMath = async (imageBase64: string, userPrompt?: string) => {
    try {
      setIsSolving(true);
      setErrorBanner(null);

      const res = await fetch('/api/solve-math', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64,
          mimeType: 'image/jpeg',
          userPrompt,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al resolver el ejercicio.');
      }

      const newSolution: MathSolution = {
        ...data,
        id: 'sol-' + Date.now(),
        timestamp: Date.now(),
        imageSnapshot: imageBase64,
        isFavorite: false,
      };

      setActiveSolution(newSolution);
      setSolutionsHistory((prev) => [newSolution, ...prev.filter((s) => s.id !== newSolution.id)]);

      // Switch to solution view immediately
      setCurrentTab('solution');

      // Add a greeting in tutor chat for this problem
      const welcomeMsg: ChatMessage = {
        id: 'msg-' + Date.now(),
        role: 'assistant',
        content: `¡He analizado y resuelto tu ejercicio de **${newSolution.title}**!\n\nEl resultado final es: ${newSolution.finalAnswer}.\n\n¿Tienes alguna duda sobre los pasos, la fórmula aplicada o deseas practicar un ejercicio similar? ¡Estoy aquí para ayudarte!`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, welcomeMsg]);
    } catch (err: any) {
      console.error('Solve error:', err);
      setErrorBanner(err.message || 'No se pudo resolver el ejercicio. Intenta con otra foto más nítida.');
    } finally {
      setIsSolving(false);
    }
  };

  // Multi-Turn Chatbot Message Handler
  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: 'usr-' + Date.now(),
      role: 'user',
      content: userText,
      timestamp: Date.now(),
    };

    const updatedHistory = [...chatMessages, userMsg];
    setChatMessages(updatedHistory);
    setIsChatLoading(true);

    try {
      const res = await fetch('/api/math-chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: updatedHistory.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          currentProblemContext: activeSolution,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Error al comunicarse con el tutor.');
      }

      const assistantMsg: ChatMessage = {
        id: 'ast-' + Date.now(),
        role: 'assistant',
        content: data.reply || 'Aquí tienes la explicación paso a paso.',
        timestamp: Date.now(),
      };

      setChatMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      console.error('Chat error:', err);
      const errMsg: ChatMessage = {
        id: 'err-' + Date.now(),
        role: 'assistant',
        content: `⚠️ Hubo un inconveniente al consultar con el tutor: ${err.message}. Por favor intenta de nuevo.`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsChatLoading(false);
      setInitialChatPrompt(undefined);
    }
  };

  // Ask tutor specifically about a step
  const handleAskTutorAboutStep = (stepNumber: number, stepTitle: string, mathExp: string) => {
    const prompt = `Tengo una duda en el Paso ${stepNumber} ("${stepTitle}"): ${mathExp}. ¿Podrías explicarme detalladamente por qué se realiza esta operación y qué propiedad matemática se aplica?`;
    setCurrentTab('chat');
    handleSendMessage(prompt);
  };

  // Ask tutor generally about current exercise
  const handleAskTutorGeneral = () => {
    setCurrentTab('chat');
  };

  // Toggle favorite
  const handleToggleFavorite = (id: string) => {
    setSolutionsHistory((prev) =>
      prev.map((sol) => (sol.id === id ? { ...sol, isFavorite: !sol.isFavorite } : sol))
    );
    if (activeSolution && activeSolution.id === id) {
      setActiveSolution((prev) => (prev ? { ...prev, isFavorite: !prev.isFavorite } : null));
    }
  };

  // Delete solution from history
  const handleDeleteSolution = (id: string) => {
    setSolutionsHistory((prev) => prev.filter((sol) => sol.id !== id));
    if (activeSolution && activeSolution.id === id) {
      const remaining = solutionsHistory.filter((s) => s.id !== id);
      setActiveSolution(remaining.length > 0 ? remaining[0] : null);
    }
  };

  // Clear all history
  const handleClearAllHistory = () => {
    if (confirm('¿Estás seguro de que deseas borrar todo el historial?')) {
      setSolutionsHistory([]);
      setActiveSolution(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-0 md:p-4 selection:bg-indigo-500/30">
      {/* Top Banner on Desktop allowing to toggle Android Device Frame or Full Screen */}
      <div className="hidden md:flex items-center justify-between w-full max-w-md mb-2 px-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="font-semibold text-slate-300">MathLens Android PWA</span>
        </div>
        <button
          onClick={() => setUseDeviceFrame(!useDeviceFrame)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition"
        >
          {useDeviceFrame ? (
            <>
              <Maximize2 className="w-3.5 h-3.5 text-indigo-400" />
              <span>Pantalla Completa</span>
            </>
          ) : (
            <>
              <Smartphone className="w-3.5 h-3.5 text-indigo-400" />
              <span>Marco Android</span>
            </>
          )}
        </button>
      </div>

      {/* Main Container: Mobile viewport or Android Device Mockup */}
      <div
        className={`w-full bg-slate-950 flex flex-col relative overflow-hidden transition-all duration-300 ${
          useDeviceFrame
            ? 'max-w-[430px] h-[92vh] max-h-[880px] rounded-[48px] border-[10px] border-slate-800 shadow-[0_0_60px_rgba(0,0,0,0.8)] ring-1 ring-slate-700/60'
            : 'max-w-md h-screen md:h-[95vh] md:max-h-[900px] md:rounded-[36px] md:border md:border-slate-800 md:shadow-2xl'
        }`}
      >
        {/* Android Status Bar */}
        <AndroidStatusBar />

        {/* Global Error Banner */}
        {errorBanner && (
          <div className="bg-rose-500/20 border-b border-rose-500/40 p-3 flex items-start gap-2 text-rose-200 text-xs z-50 animate-fadeIn">
            <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 leading-snug">{errorBanner}</div>
            <button
              onClick={() => setErrorBanner(null)}
              className="text-xs font-bold text-rose-300 hover:text-white px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Main View Area */}
        <div className="flex-1 relative overflow-hidden flex flex-col">
          {currentTab === 'camera' && (
            <CameraView
              onCaptureImage={handleSolveMath}
              isLoading={isSolving}
              onOpenDrawMode={() => setCurrentTab('draw')}
            />
          )}

          {currentTab === 'solution' && (
            activeSolution ? (
              <SolutionView
                solution={activeSolution}
                onAskTutorAboutStep={handleAskTutorAboutStep}
                onAskTutorGeneral={handleAskTutorGeneral}
                onBackToCamera={() => setCurrentTab('camera')}
                onToggleFavorite={handleToggleFavorite}
                isFavorite={!!activeSolution.isFavorite}
              />
            ) : (
              <div className="h-full flex flex-col items-center justify-center p-6 text-center space-y-4">
                <BookOpenCheck className="w-16 h-16 text-slate-600" />
                <h3 className="text-base font-bold text-white">No hay ejercicio activo</h3>
                <p className="text-xs text-slate-400 max-w-xs">
                  Toma una foto con la cámara para escanear y resolver cualquier ejercicio matemático paso a paso.
                </p>
                <button
                  onClick={() => setCurrentTab('camera')}
                  className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/30"
                >
                  <Camera className="w-4 h-4" />
                  Abrir Cámara
                </button>
              </div>
            )
          )}

          {currentTab === 'chat' && (
            <TutorChat
              currentSolution={activeSolution}
              messages={chatMessages}
              onSendMessage={handleSendMessage}
              isLoading={isChatLoading}
              onClearChat={() => setChatMessages([])}
              initialPrompt={initialChatPrompt}
            />
          )}

          {currentTab === 'draw' && (
            <DrawCanvas
              onSolveDoodle={handleSolveMath}
              isLoading={isSolving}
            />
          )}

          {currentTab === 'history' && (
            <HistoryView
              solutions={solutionsHistory}
              onSelectSolution={(sol) => {
                setActiveSolution(sol);
                setCurrentTab('solution');
              }}
              onDeleteSolution={handleDeleteSolution}
              onClearAll={handleClearAllHistory}
              onNewPhoto={() => setCurrentTab('camera')}
            />
          )}
        </div>

        {/* Android Material Bottom Navigation Bar */}
        <AndroidNavBar
          currentTab={currentTab}
          onTabChange={(tab) => setCurrentTab(tab)}
          hasActiveSolution={!!activeSolution}
        />
      </div>
    </div>
  );
}
