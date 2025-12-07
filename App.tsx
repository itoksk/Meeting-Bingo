import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameSettings, BingoCellData, LeaderboardEntry, MeetingAnalysis, Language } from './types';
import { generateBingoPhrases, analyzeMeetingResult } from './services/geminiService';
import { SetupForm } from './components/SetupForm';
import { BingoBoard } from './components/BingoBoard';
import { Timer } from './components/Timer';
import { WinModal } from './components/WinModal';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';
import { TRANSLATIONS } from './translations';

// Win patterns (rows, cols, diagonals)
const WIN_PATTERNS = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
];

const App: React.FC = () => {
  const [language, setLanguage] = useState<Language>('en');
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [settings, setSettings] = useState<GameSettings>({ topic: '', roles: [], industry: '', language: 'en' });
  const [grid, setGrid] = useState<BingoCellData[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [endTime, setEndTime] = useState<number | null>(null);
  const [winningIndices, setWinningIndices] = useState<number[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [currentGameId, setCurrentGameId] = useState<string>('');
  const [showConfetti, setShowConfetti] = useState(false);
  const [analysis, setAnalysis] = useState<MeetingAnalysis | null>(null);

  // Load leaderboard from local storage on mount
  useEffect(() => {
    const saved = localStorage.getItem('bingo_leaderboard');
    if (saved) {
      setLeaderboard(JSON.parse(saved));
    }
  }, []);

  const handleStartGame = async (newSettings: GameSettings) => {
    setSettings(newSettings);
    setGameState(GameState.LOADING);

    try {
      const phrases = await generateBingoPhrases(newSettings.topic, newSettings.industry, newSettings.roles, newSettings.language);
      
      const newGrid: BingoCellData[] = phrases.map((text, index) => ({
        id: index < 12 ? index : index + 1, // Shift index after center
        text,
        checked: false,
        isFree: false
      }));

      // Insert FREE space at index 12
      newGrid.splice(12, 0, {
        id: 12,
        text: "FREE",
        checked: true,
        isFree: true
      });

      setGrid(newGrid);
      setStartTime(Date.now());
      setEndTime(null);
      setWinningIndices([]);
      setAnalysis(null);
      setGameState(GameState.PLAYING);
      setCurrentGameId(crypto.randomUUID());
    } catch (error) {
      console.error(error);
      setGameState(GameState.SETUP); // Return to setup on error
      alert("Failed to generate bingo card. Please try again.");
    }
  };

  const checkWin = useCallback((currentGrid: BingoCellData[]) => {
    for (const pattern of WIN_PATTERNS) {
      if (pattern.every(index => currentGrid[index].checked)) {
        return pattern;
      }
    }
    return null;
  }, []);

  const handleCellClick = (id: number) => {
    if (gameState !== GameState.PLAYING) return;

    setGrid(prevGrid => {
      const newGrid = [...prevGrid];
      const index = newGrid.findIndex(cell => cell.id === id);
      if (index === -1 || newGrid[index].isFree) return prevGrid;

      newGrid[index] = { ...newGrid[index], checked: !newGrid[index].checked };
      
      const winPattern = checkWin(newGrid);
      
      if (winPattern) {
        handleWin(winPattern, newGrid);
      }

      return newGrid;
    });
  };

  const handleWin = (pattern: number[], winningGrid: BingoCellData[]) => {
    const now = Date.now();
    const start = startTime || now;
    const timeElapsed = now - start;
    
    setEndTime(now);
    setWinningIndices(pattern);
    setShowConfetti(true);
    setGameState(GameState.WON);

    const newEntry: LeaderboardEntry = {
      id: currentGameId,
      time: timeElapsed,
      date: new Date().toISOString(),
      topic: settings.topic
    };

    setLeaderboard(prev => {
      const updated = [...prev, newEntry].sort((a, b) => a.time - b.time);
      localStorage.setItem('bingo_leaderboard', JSON.stringify(updated));
      return updated;
    });

    // Trigger Analysis
    const winningPhrases = winningGrid
      .filter(cell => pattern.includes(cell.id) && !cell.isFree)
      .map(cell => cell.text);

    analyzeMeetingResult(settings.topic, winningPhrases, timeElapsed, settings.language)
      .then(result => setAnalysis(result))
      .catch(err => console.error("Analysis failed", err));

    // Stop confetti after 5 seconds
    setTimeout(() => setShowConfetti(false), 5000);
  };

  const handlePlayAgain = () => {
    setGameState(GameState.SETUP);
    setShowConfetti(false);
    setAnalysis(null);
  };

  // Simple Confetti Elements
  const renderConfetti = () => {
    if (!showConfetti) return null;
    return (
      <div className="fixed inset-0 pointer-events-none z-40 overflow-hidden">
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            key={i}
            className="confetti"
            style={{
              left: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
              backgroundColor: ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'][Math.floor(Math.random() * 5)]
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="h-screen bg-slate-50 flex flex-col overflow-hidden">
      {renderConfetti()}
      
      {/* Header - Fixed Height */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 z-20 shrink-0 shadow-sm">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-slate-800 text-lg hidden sm:block">
              {TRANSLATIONS[language].title}
            </span>
          </div>
          {gameState === GameState.PLAYING && (
            <div className="absolute left-1/2 transform -translate-x-1/2">
               <Timer startTime={startTime} endTime={endTime} />
            </div>
          )}
          {gameState === GameState.PLAYING && (
            <Button variant="outline" onClick={() => setGameState(GameState.SETUP)} className="!py-1.5 !px-3 !text-xs sm:!text-sm">
              {TRANSLATIONS[language].quit}
            </Button>
          )}
        </div>
      </header>

      {/* Main Content - Scrollable */}
      <main className="flex-1 w-full max-w-6xl mx-auto p-4 sm:p-6 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-200">
        
        {/* Setup & Loading State */}
        {(gameState === GameState.SETUP || gameState === GameState.LOADING) && (
          <div className="w-full h-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6 lg:gap-12 py-2">
            {/* Form Section */}
            <div className="w-full max-w-lg flex-shrink-0 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <SetupForm 
                onStart={handleStartGame} 
                isLoading={gameState === GameState.LOADING}
                language={language}
                setLanguage={setLanguage}
              />
            </div>
            
            {/* Leaderboard Section - Wraps to bottom on mobile, side on desktop */}
            <div className="w-full max-w-sm animate-in fade-in slide-in-from-right-4 duration-700 delay-100">
               <Leaderboard entries={leaderboard} language={language} />
               <div className="mt-4 text-center lg:text-left text-xs text-slate-400 max-w-xs mx-auto lg:mx-0 leading-relaxed">
                  <p>Tips: Customize roles for higher accuracy. The AI adapts the phrases based on the industry and personas you choose!</p>
               </div>
            </div>
          </div>
        )}

        {/* Playing State */}
        {(gameState === GameState.PLAYING || gameState === GameState.WON) && (
          <div className="flex flex-col items-center justify-center min-h-full pb-8 animate-in zoom-in-95 duration-300">
            <div className="mb-4 sm:mb-6 text-center">
              <h2 className="text-xl sm:text-2xl font-bold text-slate-800 mb-1">{settings.topic}</h2>
              <div className="text-slate-500 text-xs sm:text-sm flex gap-2 justify-center flex-wrap items-center">
                 {settings.industry && <span className="font-medium bg-slate-100 px-2 py-0.5 rounded text-slate-600">{settings.industry}</span>}
                 {settings.roles.length > 0 && <span className="text-slate-300">•</span>}
                 {settings.roles.length > 0 && (
                   <span className="italic">{settings.roles.join(', ')}</span>
                 )}
              </div>
            </div>
            
            <div className="w-full max-w-xl">
               <BingoBoard 
                 grid={grid} 
                 onCellClick={handleCellClick} 
                 winningIndices={winningIndices}
               />
            </div>
          </div>
        )}
      </main>

      {gameState === GameState.WON && endTime && startTime && (
        <WinModal 
          timeMs={endTime - startTime} 
          onPlayAgain={handlePlayAgain}
          topic={settings.topic}
          analysis={analysis}
          language={language}
        />
      )}
    </div>
  );
};

export default App;