import React from 'react';
import { BingoCellData } from '../types';

interface BingoBoardProps {
  grid: BingoCellData[];
  onCellClick: (id: number) => void;
  winningIndices: number[];
}

export const BingoBoard: React.FC<BingoBoardProps> = ({ grid, onCellClick, winningIndices }) => {
  return (
    <div className="grid grid-cols-5 gap-2 sm:gap-3 w-full max-w-2xl mx-auto aspect-square p-2 bg-slate-200/50 rounded-2xl border border-slate-200">
      {grid.map((cell) => {
        const isWinningCell = winningIndices.includes(cell.id);
        
        return (
          <button
            key={cell.id}
            onClick={() => onCellClick(cell.id)}
            disabled={cell.isFree}
            className={`
              relative flex items-center justify-center p-1 sm:p-2 rounded-xl text-[9px] sm:text-xs md:text-sm font-medium leading-tight text-center transition-all duration-300
              ${
                cell.isFree
                  ? 'bg-indigo-600 text-white shadow-inner'
                  : cell.checked
                  ? 'bg-emerald-500 text-white shadow-inner transform scale-[0.98]'
                  : 'bg-white text-slate-700 hover:bg-slate-50 shadow-sm hover:shadow-md'
              }
              ${isWinningCell ? 'ring-4 ring-yellow-400 z-10 animate-pulse' : ''}
            `}
          >
            {isWinningCell && (
               <div className="absolute inset-0 bg-yellow-400/20 rounded-xl animate-ping" />
            )}
            <span className="break-words w-full select-none">
              {cell.text}
            </span>
            {cell.checked && !cell.isFree && (
              <div className="absolute top-1 right-1 w-2 h-2 sm:w-3 sm:h-3 bg-white/30 rounded-full" />
            )}
          </button>
        );
      })}
    </div>
  );
};