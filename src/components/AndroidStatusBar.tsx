import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Signal, Sparkles } from 'lucide-react';

interface AndroidStatusBarProps {
  appName?: string;
}

export const AndroidStatusBar: React.FC<AndroidStatusBarProps> = () => {
  const [timeStr, setTimeStr] = useState<string>('12:00');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeStr(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full bg-slate-950/95 backdrop-blur-md text-slate-300 px-5 pt-2 pb-1.5 flex items-center justify-between text-xs select-none border-b border-slate-900 z-50">
      {/* Left: Time & notification icon */}
      <div className="flex items-center gap-1.5 font-semibold text-slate-200">
        <span>{timeStr}</span>
        <Sparkles className="w-2.5 h-2.5 text-indigo-400" />
      </div>

      {/* Center: Android Camera Hole Punch */}
      <div className="w-3.5 h-3.5 rounded-full bg-black border border-slate-800 shadow-inner flex items-center justify-center">
        <div className="w-1.5 h-1.5 rounded-full bg-slate-950/90" />
      </div>

      {/* Right: Network & Battery status */}
      <div className="flex items-center gap-2 text-slate-300">
        <span className="text-[10px] font-bold text-slate-400">5G</span>
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <div className="flex items-center gap-0.5">
          <BatteryMedium className="w-4 h-4 text-emerald-400" />
          <span className="text-[10px] font-mono">98%</span>
        </div>
      </div>
    </div>
  );
};

export default AndroidStatusBar;
