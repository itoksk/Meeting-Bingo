import React, { useEffect, useState } from 'react';

interface TimerProps {
  startTime: number | null;
  endTime: number | null;
}

export const Timer: React.FC<TimerProps> = ({ startTime, endTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!startTime) return;
    
    if (endTime) {
      setElapsed(endTime - startTime);
      return;
    }

    const interval = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 100);

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-slate-900 text-white px-4 py-2 rounded-full font-mono text-xl shadow-lg border border-slate-700">
      {formatTime(elapsed)}
    </div>
  );
};