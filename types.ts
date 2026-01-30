
export interface GameRecord {
  player_code: string;
  round: number;
  score: number;
  slices: number;
  correct_answers: number;
  total_questions: number;
  timestamp: string;
}

export interface QuizQuestion {
  question: string;
  options: string[];
  correct: number;
}

export interface FruitState {
  id: number;
  icon: string;
  type: 'normal' | 'bonus' | 'bomb';
  x: number;
  y: number;
  velocityY: number;
  velocityX: number;
  isSliced: boolean;
  gravity: number;
}

export enum GameView {
  CODE_ENTRY = 'CODE_ENTRY',
  START_SCREEN = 'START_SCREEN',
  GAMEPLAY = 'GAMEPLAY',
  RESULT = 'RESULT',
  LEADERBOARD = 'LEADERBOARD'
}
