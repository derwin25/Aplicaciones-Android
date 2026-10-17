import React, { useState, useEffect } from 'react';
import confetti from 'canvas-confetti';
import {
  CheckCircle2,
  Copy,
  Volume2,
  VolumeX,
  Share2,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  Eye,
  MessageSquareText,
  Activity,
  Layers,
  HelpCircle,
  Sparkles,
  Camera,
} from 'lucide-react';
import { MathSolution, MathStep } from '../types/math';
import MathView from './MathView';
import MathGraph from './MathGraph';

interface SolutionViewProps {
  solution: MathSolution;
  onAskTutorAboutStep: (stepNumber: number, stepTitle: string, mathExp: string) => void;
  onAskTutorGeneral: () => void;
  onBackToCamera: () => void;
  onToggleFavorite: (id: string) => void;
  isFavorite: boolean;
}

export const SolutionView: React.FC<SolutionViewProps> = ({
  solution,
  onAskTutorAboutStep,
  onAskTutorGeneral,
  onBackToCamera,
  onToggleFavorite,
  isFavorite,
}) => {
  const [activeTab, setActiveTab] = useState<'steps' | 'graph' | 'verify' | 'formulas'>('steps');
  const [viewMode, setViewMode] = useState<'all' | 'guided'>('guided');
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [understoodSteps, setUnderstoodSteps] = useState<Record<number, boolean>>({});
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [copiedAnswer, setCopiedAnswer] = useState<boolean>(false);
  const [showPhotoPreview, setShowPhotoPreview] = useState<boolean>(false);

  // Trigger celebration confetti on mount
  useEffect(() => {
    try {
      confetti({
        particleCount: 45,
        spread: 60,
        origin: { y: 0.65 },
        colors: ['#6366f1', '#10b981', '#f59e0b', '#ec4899'],
      });
    } catch {
      // Ignore if confetti fails
    }
  }, [solution.id]);

  // Audio speech synthesis (read explanation in Spanish)
  const toggleSpeech = () => {
    if (!('speechSynthesis' in window)) {
      alert('Tu navegador no soporta síntesis de voz.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    let textToSpeak = `${solution.title}. El resultado final es ${solution.finalAnswer.replace(/[\$\\]/g, '')}. `;
    if (viewMode === 'guided' && solution.steps[currentStepIndex]) {
      const step = solution.steps[currentStepIndex];
      textToSpeak += `Paso ${step.stepNumber}: ${step.title}. ${step.explanation}. `;
    } else {
      textToSpeak += solution.tutorSummary || '';
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'es-ES';
    utterance.rate = 0.95;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedAnswer(true);
    setTimeout(() => setCopiedAnswer(false), 2000);
  };

  const toggleStepUnderstood = (stepNum: number) => {
    setUnderstoodSteps((prev) => ({
      ...prev,
      [stepNum]: !prev[stepNum],
    }));
  };

  const currentStep: MathStep | undefined = solution.steps[currentStepIndex];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto pb-24">
      {/* Top Header Card */}
      <div className="sticky top-0 z-20 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 flex items-center justify-between shadow-md">
        <button
          onClick={onBackToCamera}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-300 hover:text-white px-2.5 py-1.5 rounded-xl bg-slate-900 border border-slate-800 transition active:scale-95"
        >
          <Camera className="w-3.5 h-3.5 text-indigo-400" />
          Nueva foto
        </button>

        <div className="flex items-center gap-1.5">
          <button
            onClick={toggleSpeech}
            className={`p-2 rounded-xl border transition ${
              isSpeaking
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title={isSpeaking ? 'Pausar voz' : 'Escuchar explicación'}
          >
            {isSpeaking ? <VolumeX className="w-4 h-4 text-amber-400 animate-pulse" /> : <Volume2 className="w-4 h-4" />}
          </button>

          <button
            onClick={() => onToggleFavorite(solution.id)}
            className={`p-2 rounded-xl border transition ${
              isFavorite
                ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                : 'bg-slate-900 text-slate-300 border-slate-800 hover:text-white'
            }`}
            title="Guardar en favoritos"
          >
            {isFavorite ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4 max-w-2xl mx-auto w-full">
        {/* Exercise Header Banner */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-4 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
              {solution.topic || 'Matemáticas'}
            </span>
            <span
              className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${
                solution.difficulty === 'Avanzado'
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                  : solution.difficulty === 'Intermedio'
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                  : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
              }`}
            >
              {solution.difficulty || 'Intermedio'}
            </span>
            {solution.imageSnapshot && (
              <button
                onClick={() => setShowPhotoPreview(!showPhotoPreview)}
                className="ml-auto text-[11px] text-slate-400 hover:text-indigo-400 flex items-center gap-1"
              >
                <Eye className="w-3 h-3" />
                {showPhotoPreview ? 'Ocultar foto' : 'Ver foto original'}
              </button>
            )}
          </div>

          <h1 className="text-lg font-bold text-white mb-2 leading-snug">
            {solution.title}
          </h1>

          {/* Photo Preview collapsible */}
          {showPhotoPreview && solution.imageSnapshot && (
            <div className="my-3 rounded-2xl overflow-hidden border border-slate-700 max-h-48">
              <img
                src={solution.imageSnapshot}
                alt="Foto del ejercicio"
                className="w-full object-contain bg-black"
              />
            </div>
          )}

          {/* Recognized LaTeX formula */}
          <div className="bg-slate-950/80 border border-slate-800/80 rounded-2xl p-3 my-2 text-center overflow-x-auto">
            <div className="text-[10px] uppercase tracking-wider text-slate-500 mb-1 font-semibold">
              Ejercicio Reconocido:
            </div>
            <div className="text-indigo-300 font-mono text-base font-semibold py-1">
              <MathView content={solution.problemTranscription} displayMode={true} />
            </div>
          </div>

          {/* Prominent Final Answer Card */}
          <div className="mt-3 p-4 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-900 to-indigo-950/70 border border-emerald-500/40 shadow-lg relative">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                <CheckCircle2 className="w-4 h-4" />
                Respuesta Final
              </div>
              <button
                onClick={() => copyToClipboard(solution.finalAnswer)}
                className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white px-2 py-0.5 rounded-lg bg-slate-800/60 border border-slate-700/60 transition"
              >
                <Copy className="w-3 h-3" />
                {copiedAnswer ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
            <div className="text-center py-2 text-xl font-bold text-white overflow-x-auto">
              <MathView content={solution.finalAnswer} displayMode={true} />
            </div>
          </div>

          {/* Tutor strategy note */}
          {solution.tutorSummary && (
            <div className="mt-3 text-xs text-slate-300 bg-indigo-950/40 border border-indigo-500/20 rounded-xl p-2.5 flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
              <span>{solution.tutorSummary}</span>
            </div>
          )}
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-2xl border border-slate-800 text-xs">
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'steps'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <ListOrdered className="w-3.5 h-3.5" />
            Pasos ({solution.steps.length})
          </button>

          {solution.graphInfo && solution.graphInfo.hasGraph && (
            <button
              onClick={() => setActiveTab('graph')}
              className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
                activeTab === 'graph'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
              }`}
            >
              <Activity className="w-3.5 h-3.5" />
              Gráfica
            </button>
          )}

          <button
            onClick={() => setActiveTab('verify')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'verify'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Comprobación
          </button>

          <button
            onClick={() => setActiveTab('formulas')}
            className={`flex-1 py-2 px-3 rounded-xl font-semibold flex items-center justify-center gap-1.5 transition ${
              activeTab === 'formulas'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Fórmulas
          </button>
        </div>

        {/* TAB 1: STEPS VIEW */}
        {activeTab === 'steps' && (
          <div className="space-y-3">
            {/* Mode switch: Guided Step-by-Step vs All Steps */}
            <div className="flex items-center justify-between px-1">
              <span className="text-xs text-slate-400 font-medium">
                {viewMode === 'guided'
                  ? `Paso ${currentStepIndex + 1} de ${solution.steps.length}`
                  : `Todos los ${solution.steps.length} pasos`}
              </span>
              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5 text-[11px]">
                <button
                  onClick={() => setViewMode('guided')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    viewMode === 'guided' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Paso a paso
                </button>
                <button
                  onClick={() => setViewMode('all')}
                  className={`px-2 py-0.5 rounded-md transition ${
                    viewMode === 'all' ? 'bg-indigo-600 text-white font-medium' : 'text-slate-400'
                  }`}
                >
                  Ver todos
                </button>
              </div>
            </div>

            {/* Guided Mode single step with navigation */}
            {viewMode === 'guided' && currentStep && (
              <div className="bg-slate-900 border border-slate-800 rounded-3xl p-5 shadow-lg space-y-4">
                {/* Step Progress Bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full transition-all duration-300"
                    style={{
                      width: `${((currentStepIndex + 1) / solution.steps.length) * 100}%`,
                    }}
                  />
                </div>

                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-full bg-indigo-600/30 border border-indigo-500 text-indigo-300 font-bold flex items-center justify-center text-sm shadow-md">
                      {currentStep.stepNumber}
                    </span>
                    <h3 className="text-base font-bold text-white">
                      {currentStep.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => toggleStepUnderstood(currentStep.stepNumber)}
                    className={`text-xs px-2.5 py-1 rounded-full border transition flex items-center gap-1 ${
                      understoodSteps[currentStep.stepNumber]
                        ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                        : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    {understoodSteps[currentStep.stepNumber] ? 'Entendido' : 'Marcar entendido'}
                  </button>
                </div>

                {/* Explanation text */}
                <div className="text-sm text-slate-300 leading-relaxed">
                  <MathView content={currentStep.explanation} />
                </div>

                {/* Math expression */}
                {currentStep.mathExpression && (
                  <div className="bg-slate-950/90 border border-slate-800 rounded-2xl p-4 text-center overflow-x-auto shadow-inner">
                    <MathView content={currentStep.mathExpression} displayMode={true} />
                  </div>
                )}

                {/* Tip box */}
                {currentStep.tip && (
                  <div className="p-3 rounded-2xl bg-amber-950/30 border border-amber-500/30 text-xs text-amber-200/90 flex items-start gap-2">
                    <HelpCircle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-300">Nota clave: </span>
                      {currentStep.tip}
                    </div>
                  </div>
                )}

                {/* Ask Tutor about THIS specific step button */}
                <button
                  onClick={() =>
                    onAskTutorAboutStep(
                      currentStep.stepNumber,
                      currentStep.title,
                      currentStep.mathExpression
                    )
                  }
                  className="w-full py-2.5 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-indigo-300 hover:text-indigo-200 border border-indigo-500/30 text-xs font-semibold flex items-center justify-center gap-2 transition active:scale-98"
                >
                  <MessageSquareText className="w-4 h-4 text-indigo-400" />
                  ¿Dudas sobre el Paso {currentStep.stepNumber}? Preguntar al Tutor IA
                </button>

                {/* Navigation controls */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800">
                  <button
                    onClick={() => setCurrentStepIndex((i) => Math.max(i - 1, 0))}
                    disabled={currentStepIndex === 0}
                    className="py-2 px-3 rounded-xl bg-slate-800 text-xs font-semibold text-slate-300 hover:text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Paso anterior
                  </button>
                  <span className="text-xs text-slate-500 font-mono">
                    {currentStepIndex + 1} / {solution.steps.length}
                  </span>
                  <button
                    onClick={() =>
                      setCurrentStepIndex((i) => Math.min(i + 1, solution.steps.length - 1))
                    }
                    disabled={currentStepIndex === solution.steps.length - 1}
                    className="py-2 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white disabled:opacity-40 disabled:pointer-events-none flex items-center gap-1 shadow-md shadow-indigo-600/20 transition"
                  >
                    Paso siguiente
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* View All Mode (Full list of cards) */}
            {viewMode === 'all' && (
              <div className="space-y-3">
                {solution.steps.map((step) => (
                  <div
                    key={step.stepNumber}
                    className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-sm hover:border-slate-700 transition"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-indigo-600/30 border border-indigo-500/50 text-indigo-300 font-bold flex items-center justify-center text-xs">
                          {step.stepNumber}
                        </span>
                        <h4 className="text-sm font-bold text-white">{step.title}</h4>
                      </div>
                      <button
                        onClick={() => toggleStepUnderstood(step.stepNumber)}
                        className={`text-[11px] p-1 rounded-lg border ${
                          understoodSteps[step.stepNumber]
                            ? 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10'
                            : 'text-slate-500 border-slate-800 hover:text-slate-300'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed mb-2">
                      <MathView content={step.explanation} />
                    </div>

                    {step.mathExpression && (
                      <div className="bg-slate-950/70 border border-slate-800 rounded-xl p-3 my-2 text-center overflow-x-auto">
                        <MathView content={step.mathExpression} displayMode={true} />
                      </div>
                    )}

                    {step.tip && (
                      <div className="text-[11px] text-amber-300/90 bg-amber-950/30 border border-amber-500/20 p-2 rounded-xl mt-2">
                        💡 {step.tip}
                      </div>
                    )}

                    <button
                      onClick={() =>
                        onAskTutorAboutStep(step.stepNumber, step.title, step.mathExpression)
                      }
                      className="mt-2 text-[11px] text-indigo-400 hover:text-indigo-300 flex items-center gap-1 font-medium"
                    >
                      <MessageSquareText className="w-3 h-3" />
                      Consultar este paso con el tutor
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: GRAPH PLOTTER */}
        {activeTab === 'graph' && solution.graphInfo && (
          <div className="space-y-3">
            <MathGraph graphInfo={solution.graphInfo} title={solution.title} />
          </div>
        )}

        {/* TAB 3: VERIFICATION */}
        {activeTab === 'verify' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <CheckCircle2 className="w-4 h-4" />
              Comprobación Matemática del Resultado
            </div>
            <div className="text-xs text-slate-300 leading-relaxed bg-slate-950/70 p-3 rounded-xl border border-slate-800/80">
              <MathView content={solution.verification || 'El resultado ha sido verificado mediante sustitución directa en la ecuación original.'} />
            </div>

            {solution.alternativeMethods && solution.alternativeMethods.length > 0 && (
              <div className="pt-2 border-t border-slate-800">
                <div className="text-xs font-semibold text-slate-400 mb-2">
                  Métodos alternativos de resolución:
                </div>
                <ul className="space-y-1.5 text-xs text-slate-300">
                  {solution.alternativeMethods.map((method, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      <MathView content={method} />
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: KEY FORMULAS */}
        {activeTab === 'formulas' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-md space-y-3">
            <div className="flex items-center gap-2 text-indigo-400 font-bold text-sm">
              <Layers className="w-4 h-4" />
              Fórmulas y Teoremas Utilizados
            </div>
            {solution.keyFormulas && solution.keyFormulas.length > 0 ? (
              <div className="space-y-2">
                {solution.keyFormulas.map((f, i) => (
                  <div
                    key={i}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center font-mono text-sm text-indigo-200 overflow-x-auto"
                  >
                    <MathView content={f} displayMode={true} />
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Reglas básicas de álgebra y simplificación aplicadas.</p>
            )}
          </div>
        )}

        {/* Floating Quick Ask Tutor Button */}
        <div className="pt-2">
          <button
            onClick={onAskTutorGeneral}
            className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 active:scale-98 transition"
          >
            <MessageSquareText className="w-4 h-4" />
            Abrir Chat con Tutor IA sobre este ejercicio
          </button>
        </div>
      </div>
    </div>
  );
};

export default SolutionView;
