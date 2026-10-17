import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Bot,
  User,
  Sparkles,
  Trash2,
  Copy,
  Check,
  Volume2,
  ArrowDown,
  BookOpen,
} from 'lucide-react';
import { ChatMessage, MathSolution } from '../types/math';
import MathView from './MathView';

interface TutorChatProps {
  currentSolution: MathSolution | null;
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
  isLoading: boolean;
  onClearChat: () => void;
  initialPrompt?: string;
}

export const TutorChat: React.FC<TutorChatProps> = ({
  currentSolution,
  messages,
  onSendMessage,
  isLoading,
  onClearChat,
  initialPrompt,
}) => {
  const [inputText, setInputText] = useState<string>('');
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle incoming initial prompt
  useEffect(() => {
    if (initialPrompt) {
      setInputText(initialPrompt);
      inputRef.current?.focus();
    }
  }, [initialPrompt]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText.trim());
    setInputText('');
  };

  const copyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const speakMessage = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[\$\*\#\_]/g, '');
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = 'es-ES';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  };

  const quickPills = [
    '¿Por qué se aplicó ese paso?',
    'Explícamelo con una analogía simple',
    'Dame un ejercicio similar para practicar',
    '¿Hay otra forma de resolverlo?',
    '¿Cómo verifico mi resultado a mano?',
  ];

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100">
      {/* Tutor Header */}
      <div className="bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 flex items-center justify-between z-10 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="relative">
            <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center text-white shadow-md">
              <Bot className="w-5 h-5" />
            </div>
            <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-slate-900" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h2 className="text-sm font-bold text-white">Tutor MathLens</h2>
              <span className="text-[10px] bg-indigo-500/20 text-indigo-300 font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                Gemini 3.8 Flash
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Profesor particular de matemáticas IA</p>
          </div>
        </div>

        {messages.length > 0 && (
          <button
            onClick={onClearChat}
            className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition"
            title="Limpiar conversación"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Linked Problem Context Badge (if active solution exists) */}
      {currentSolution && (
        <div className="bg-indigo-950/40 border-b border-indigo-500/20 px-4 py-2 flex items-center justify-between text-xs text-indigo-200">
          <div className="flex items-center gap-1.5 overflow-hidden">
            <BookOpen className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
            <span className="text-slate-400 text-[11px]">Contexto:</span>
            <span className="font-semibold truncate">{currentSolution.title}</span>
          </div>
          <span className="font-mono text-[11px] text-indigo-300 ml-2 flex-shrink-0">
            {currentSolution.finalAnswer.replace(/\$/g, '')}
          </span>
        </div>
      )}

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-inner">
              <Sparkles className="w-8 h-8 text-indigo-400 animate-pulse" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white mb-1">
                ¿Tienes dudas sobre tu ejercicio?
              </h3>
              <p className="text-xs text-slate-400 max-w-sm leading-relaxed">
                Pregúntame cualquier duda sobre fórmulas, pasos específicos o conceptos matemáticos.
                ¡Te lo explicaré paso a paso con la máxima claridad!
              </p>
            </div>

            {/* Quick Starter Chips */}
            <div className="w-full max-w-md pt-2 space-y-2">
              <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider text-left pl-1">
                Preguntas frecuentes sugeridas:
              </div>
              <div className="flex flex-col gap-1.5">
                {quickPills.map((pill, i) => (
                  <button
                    key={i}
                    onClick={() => onSendMessage(pill)}
                    className="text-left text-xs text-slate-300 bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/40 rounded-xl px-3.5 py-2.5 transition active:scale-98 flex items-center justify-between group"
                  >
                    <span>{pill}</span>
                    <span className="text-indigo-400 opacity-0 group-hover:opacity-100 transition text-xs font-mono">
                      →
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${
                msg.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {msg.role === 'assistant' && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0 mt-0.5 shadow-md">
                  <Bot className="w-4 h-4" />
                </div>
              )}

              <div
                className={`max-w-[85%] rounded-2xl p-3.5 text-xs shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-tr-none'
                    : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none space-y-2'
                }`}
              >
                <div className="leading-relaxed">
                  <MathView content={msg.content} />
                </div>

                {msg.role === 'assistant' && (
                  <div className="flex items-center justify-end gap-1.5 pt-1.5 border-t border-slate-800/80 text-slate-400">
                    <button
                      onClick={() => speakMessage(msg.content)}
                      className="p-1 rounded hover:text-white transition"
                      title="Escuchar respuesta"
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => copyMessage(msg.id, msg.content)}
                      className="p-1 rounded hover:text-white transition"
                      title="Copiar texto"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>
                )}
              </div>

              {msg.role === 'user' && (
                <div className="w-8 h-8 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-300 flex-shrink-0 mt-0.5">
                  <User className="w-4 h-4" />
                </div>
              )}
            </div>
          ))
        )}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 flex items-center justify-center text-white flex-shrink-0">
              <Bot className="w-4 h-4 animate-spin" />
            </div>
            <div className="bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none p-3.5 text-xs text-slate-400 flex items-center gap-2">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.2s]" />
                <span className="w-2 h-2 rounded-full bg-indigo-500 animate-bounce [animation-delay:0.4s]" />
              </div>
              <span>Tutor MathLens pensando...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Suggested Quick Question Chips above input bar */}
      {messages.length > 0 && (
        <div className="px-4 py-1.5 bg-slate-950/80 border-t border-slate-800/60 overflow-x-auto flex gap-1.5 no-scrollbar">
          {quickPills.slice(0, 3).map((pill, i) => (
            <button
              key={i}
              onClick={() => onSendMessage(pill)}
              disabled={isLoading}
              className="flex-shrink-0 text-[11px] text-slate-400 hover:text-indigo-300 bg-slate-900 border border-slate-800 rounded-full px-3 py-1 transition disabled:opacity-40"
            >
              {pill}
            </button>
          ))}
        </div>
      )}

      {/* Input Message Form */}
      <div className="p-3 bg-slate-900/90 backdrop-blur-md border-t border-slate-800">
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder="Pregúntale al tutor sobre cualquier paso o fórmula..."
            disabled={isLoading}
            className="flex-1 bg-slate-950 border border-slate-700/80 rounded-2xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition shadow-inner"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="w-11 h-11 rounded-2xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:pointer-events-none text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 transition active:scale-95 flex-shrink-0"
            title="Enviar mensaje"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};

export default TutorChat;
