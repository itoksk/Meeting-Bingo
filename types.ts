export interface BingoCellData {
  id: number;
  text: string;
  checked: boolean;
  isFree: boolean;
}

export type Language = 'en' | 'ja' | 'de' | 'fr';

export interface GameSettings {
  topic: string;
  roles: string[];
  industry: string;
  language: Language;
}

export interface LeaderboardEntry {
  id: string;
  time: number; // milliseconds
  date: string;
  topic: string;
}

export interface MeetingAnalysis {
  boredomScore: number;
  commentary: string;
}

export enum GameState {
  SETUP = 'SETUP',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  ANALYZING = 'ANALYZING',
  WON = 'WON'
}
