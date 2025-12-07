import React, { useState, useEffect, useCallback } from 'react';
import { GameState, GameSettings, BingoCellData, LeaderboardEntry, MeetingAnalysis } from './types';
import { generateBingoPhrases, analyzeMeetingResult } from './services/geminiService';
import { SetupForm } from './components/SetupForm';
import { BingoBoard } from './components/BingoBoard';
import { Timer } from './components/Timer';
import { WinModal } from './components/WinModal';
import { Leaderboard } from './components/Leaderboard';
import { Button } from './components/Button';

// Win patterns (rows, cols, diagonals)
const WIN_PATTERNS = [
  [0, 1, 2, 3, 4], [5, 6, 7, 8, 9], [10, 11, 12, 13, 14], [15, 16, 17, 18, 19], [20, 21, 22, 23, 24], // Rows
  [0, 5, 10, 15, 20], [1, 6, 11, 16, 21], [2, 7, 12, 17, 22], [3, 8, 13, 18, 23], [4, 9, 14, 19, 24], // Cols
  [0, 6, 12, 18, 24], [4, 8, 12, 16, 20] // Diagonals
];

const App: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>(GameState.SETUP);
  const [settings, setSettings] = useState<GameSettings>({ topic: '', roles: [], industry: '' });
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
      const phrases = await generateBingoPhrases(newSettings.topic, newSettings.industry, newSettings.roles);
      
      const newGrid: BingoCellData[] = phrases.map((text, index) => ({
        id: index < 12 ? index : index + 1, // Shift index after center
        text,
        checked: false,
        isFree: false
      }));

      // Insert FREE space at index 12
      newGrid.splice(12, 0, {
        id: 12,
        text: "FREE SPACE",
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

    analyzeMeetingResult(settings.topic, winningPhrases, timeElapsed)
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
    <div className="min-h-screen bg-slate-50 flex flex-col overflow-y-auto">
      {renderConfetti()}
      
      {/* Header */}
      <header className="bg-white border-b border-slate-200 px-4 py-3 sticky top-0 z-20">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🎯</span>
            <span className="font-bold text-slate-800 hidden sm:block">Meeting Bingo</span>
          </div>
          {gameState === GameState.PLAYING && (
            <Timer startTime={startTime} endTime={endTime} />
          )}
          {gameState === GameState.PLAYING && (
            <Button variant="outline" onClick={() => setGameState(GameState.SETUP)} className="!py-1 !px-3 !text-sm">
              Quit
            </Button>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 w-full max-w-4xl mx-auto p-4 flex flex-col items-center">
        {gameState === GameState.SETUP || gameState === GameState.LOADING ? (
          <div className="w-full flex flex-col items-center mt-8">
            <SetupForm onStart={handleStartGame} isLoading={gameState === GameState.LOADING} />
            <Leaderboard entries={leaderboard} />
          </div>
        ) : (
          <div className="w-full flex flex-col items-center animate-in fade-in duration-500">
            <div className="mb-4 text-center">
              <h2 className="text-xl font-bold text-slate-800">{settings.topic}</h2>
              <div className="text-slate-500 text-sm flex gap-2 justify-center flex-wrap">
                 {settings.industry && <span>{settings.industry} •</span>}
                 {settings.roles.length > 0 ? (
                   <span>{settings.roles.join(', ')}</span>
                 ) : (
                   <span>General</span>
                 )}
              </div>
            </div>
            
            <BingoBoard 
              grid={grid} 
              onCellClick={handleCellClick} 
              winningIndices={winningIndices}
            />
          </div>
        )}
      </main>

      {gameState === GameState.WON && endTime && startTime && (
        <WinModal 
          timeMs={endTime - startTime} 
          onPlayAgain={handlePlayAgain}
          topic={settings.topic}
          analysis={analysis}
        />
      )}
    </div>
  );
};

export default App;