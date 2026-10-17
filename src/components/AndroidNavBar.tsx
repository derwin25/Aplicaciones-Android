import React from 'react';
import { Camera, BookOpenCheck, MessageSquare, History, PenTool } from 'lucide-react';

export type NavTab = 'camera' | 'solution' | 'chat' | 'history' | 'draw';

interface AndroidNavBarProps {
  currentTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  hasActiveSolution: boolean;
  unreadChatCount?: number;
}

export const AndroidNavBar: React.FC<AndroidNavBarProps> = ({
  currentTab,
  onTabChange,
  hasActiveSolution,
  unreadChatCount = 0,
}) => {
  const tabs = [
    {
      id: 'camera' as NavTab,
      label: 'Escáner',
      icon: Camera,
    },
    {
      id: 'solution' as NavTab,
      label: 'Solución',
      icon: BookOpenCheck,
      badge: hasActiveSolution ? 'Listo' : undefined,
    },
    {
      id: 'chat' as NavTab,
      label: 'Tutor IA',
      icon: MessageSquare,
      badge: unreadChatCount > 0 ? `${unreadChatCount}` : undefined,
    },
    {
      id: 'draw' as NavTab,
      label: 'Pizarra',
      icon: PenTool,
    },
    {
      id: 'history' as NavTab,
      label: 'Historial',
      icon: History,
    },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-xl border-t border-slate-800/80 px-2 py-1.5 safe-area-bottom shadow-2xl">
      <div className="max-w-md mx-auto flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-3 rounded-2xl transition duration-200 active:scale-90 ${
                isActive
                  ? 'text-indigo-400 font-bold'
                  : 'text-slate-400 hover:text-slate-200 font-medium'
              }`}
            >
              {/* Material You pill highlight behind active icon */}
              <div
                className={`relative px-4 py-1 rounded-full transition-all duration-200 flex items-center justify-center ${
                  isActive ? 'bg-indigo-600/25' : 'bg-transparent'
                }`}
              >
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {tab.badge && (
                  <span className="absolute -top-1 -right-1 text-[9px] bg-gradient-to-r from-amber-500 to-rose-500 text-white font-bold px-1.5 py-0.2 rounded-full shadow-sm animate-pulse">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};

export default AndroidNavBar;
