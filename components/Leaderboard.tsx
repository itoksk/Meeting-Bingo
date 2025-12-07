import React from 'react';
import { LeaderboardEntry, Language } from '../types';
import { TRANSLATIONS } from '../translations';

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  currentGameId?: string;
  language?: Language;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({ entries, currentGameId, language = 'en' }) => {
  if (entries.length === 0) return null;
  const t = TRANSLATIONS[language];

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="w-full max-w-sm bg-white rounded-2xl shadow-lg border border-slate-100 overflow-hidden mt-4 lg:mt-0">
      <div className="bg-slate-50 px-4 py-3 border-b border-slate-100">
        <h3 className="font-bold text-slate-800 flex items-center gap-2 text-sm sm:text-base">
          <svg className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
          {t.fastestBingos}
        </h3>
      </div>
      <div className="divide-y divide-slate-100 max-h-[200px] lg:max-h-[300px] overflow-y-auto custom-scrollbar">
        {entries.slice(0, 10).map((entry, index) => (
          <div 
            key={entry.id} 
            className={`px-4 py-2 flex justify-between items-center hover:bg-slate-50 transition-colors ${entry.id === currentGameId ? 'bg-yellow-50' : ''}`}
          >
            <div className="flex items-center gap-2">
              <span className={`
                flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold
                ${index === 0 ? 'bg-yellow-100 text-yellow-700' : 
                  index === 1 ? 'bg-slate-200 text-slate-700' :
                  index === 2 ? 'bg-orange-100 text-orange-700' : 'text-slate-400'}
              `}>
                {index + 1}
              </span>
              <div className="flex flex-col">
                <span className="text-xs sm:text-sm font-medium text-slate-800 truncate max-w-[100px] sm:max-w-[120px]">
                  {entry.topic}
                </span>
                <span className="text-[9px] text-slate-400">
                  {new Date(entry.date).toLocaleDateString()}
                </span>
              </div>
            </div>
            <span className="font-mono text-xs sm:text-sm font-semibold text-slate-600">
              {formatTime(entry.time)}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};