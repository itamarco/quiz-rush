export interface Quiz {
  id: string;
  title: string;
  description: string | null;
  time_limit: number;
  created_at: string;
  user_id: string;
}

export interface Question {
  id: string;
  quiz_id: string;
  text: string;
  options: string[];
  correct_index: number;
  order: number;
}

export interface Game {
  id: string;
  quiz_id: string;
  pin: string;
  status: "waiting" | "playing" | "finished";
  current_question: number;
  created_at: string;
}

export interface Player {
  id: string;
  game_id: string;
  nickname: string;
  score: number;
  joined_at: string;
}

export interface Answer {
  id: string;
  game_id: string;
  player_id: string;
  question_index: number;
  answer_index: number;
  time_taken: number;
  points: number;
}

export interface GameEvent {
  type:
    | "question_start"
    | "question_end"
    | "player_answered"
    | "leaderboard_update"
    | "game_end";
  payload?: unknown;
}

export interface QuestionStartPayload {
  questionIndex: number;
  question: Question;
  timeLimit: number;
}

export interface LeaderboardEntry {
  player_id: string;
  nickname: string;
  score: number;
  rank: number;
}
