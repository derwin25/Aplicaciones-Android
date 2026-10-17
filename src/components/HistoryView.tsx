import React, { useState } from 'react';
import {
  History,
  Bookmark,
  Search,
  Trash2,
  Calendar,
  Sparkles,
  ArrowRight,
  FolderOpen,
} from 'lucide-react';
import { MathSolution } from '../types/math';
import MathView from './MathView';

interface HistoryViewProps {
  solutions: MathSolution[];
  onSelectSolution: (solution: MathSolution) => void;
  onDeleteSolution: (id: string) => void;
  onClearAll: () => void;
  onNewPhoto: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  solutions,
  onSelectSolution,
  onDeleteSolution,
  onClearAll,
  onNewPhoto,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string>('all');

  const topics = ['all', ...Array.from(new Set(solutions.map((s) => s.topic).filter(Boolean)))];

  const filtered = solutions.filter((sol) => {
    if (onlyFavorites && !sol.isFavorite) return false;
    if (selectedTopic !== 'all' && sol.topic !== selectedTopic) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = sol.title.toLowerCase().includes(q);
      const matchTranscription = (sol.problemTranscription || '').toLowerCase().includes(q);
      const matchTopic = (sol.topic || '').toLowerCase().includes(q);
      return matchTitle || matchTranscription || matchTopic;
    }
    return true;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 text-slate-100 overflow-y-auto pb-24">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">Historial de Ejercicios</h2>
            <span className="text-xs bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">
              {solutions.length}
            </span>
          </div>

          {solutions.length > 0 && (
            <button
              onClick={onClearAll}
              className="text-xs text-rose-400 hover:text-rose-300 flex items-center gap-1 transition"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Borrar todo
            </button>
          )}
        </div>

        {/* Search input */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por fórmula, tema o título..."
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Topic Filters & Favorites toggle */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar text-xs">
          <button
            onClick={() => setOnlyFavorites(!onlyFavorites)}
            className={`px-3 py-1 rounded-full font-semibold flex items-center gap-1 transition flex-shrink-0 ${
              onlyFavorites
                ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                : 'bg-slate-800/80 text-slate-400 border border-slate-700/60'
            }`}
          >
            <Bookmark className="w-3 h-3" />
            Favoritos
          </button>

          {topics.map((t) => (
            <button
              key={t}
              onClick={() => setSelectedTopic(t)}
              className={`px-3 py-1 rounded-full font-medium transition flex-shrink-0 capitalize ${
                selectedTopic === t
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800/80 text-slate-400 hover:text-white'
              }`}
            >
              {t === 'all' ? 'Todos los temas' : t}
            </button>
          ))}
        </div>
      </div>

      {/* Solutions List */}
      <div className="p-4 space-y-3">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center text-center p-8 space-y-4 text-slate-400">
            <div className="w-16 h-16 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
              <FolderOpen className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-300 mb-1">
                {solutions.length === 0 ? 'No hay ejercicios escaneados todavía' : 'Sin resultados para tu búsqueda'}
              </h3>
              <p className="text-xs text-slate-500 max-w-xs">
                {solutions.length === 0
                  ? 'Toma una foto a cualquier ejercicio con la cámara o prueba un ejercicio de muestra para comenzar.'
                  : 'Prueba cambiando los filtros o el término de búsqueda.'}
              </p>
            </div>
            {solutions.length === 0 && (
              <button
                onClick={onNewPhoto}
                className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 transition active:scale-95"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                Escanear mi primer ejercicio
              </button>
            )}
          </div>
        ) : (
          filtered.map((sol) => (
            <div
              key={sol.id}
              onClick={() => onSelectSolution(sol)}
              className="group bg-slate-900 border border-slate-800 hover:border-indigo-500/50 rounded-2xl p-4 shadow-sm transition cursor-pointer relative overflow-hidden"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                    {sol.topic}
                  </span>
                  <span className="text-[10px] text-slate-500 flex items-center gap-1 font-mono">
                    <Calendar className="w-3 h-3" />
                    {new Date(sol.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {sol.isFavorite && (
                    <Bookmark className="w-3.5 h-3.5 text-rose-400 fill-rose-400" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteSolution(sol.id);
                    }}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 opacity-60 group-hover:opacity-100 transition"
                    title="Eliminar de historial"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <h4 className="text-sm font-bold text-white mb-2 group-hover:text-indigo-300 transition line-clamp-1">
                {sol.title}
              </h4>

              {/* Math preview */}
              <div className="bg-slate-950/80 border border-slate-800/80 rounded-xl p-2.5 mb-2 text-center overflow-x-auto">
                <MathView content={sol.problemTranscription} displayMode={true} />
              </div>

              {/* Final Answer snippet */}
              <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-800/80">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold truncate">
                  <span className="text-slate-400 text-[11px]">Respuesta:</span>
                  <span className="font-mono">{sol.finalAnswer.replace(/\$/g, '')}</span>
                </div>
                <div className="flex items-center gap-1 text-[11px] font-semibold text-indigo-400 group-hover:translate-x-1 transition flex-shrink-0">
                  Ver pasos
                  <ArrowRight className="w-3 h-3" />
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default HistoryView;
