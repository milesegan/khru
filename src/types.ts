export type StudyRating = "again" | "okay" | "known";

export type StudyMode = "words" | "conversation";

export type WordStudyCategory =
  | "all"
  | "basics"
  | "people"
  | "food"
  | "places"
  | "time"
  | "actions"
  | "describing"
  | "home"
  | "body"
  | "signs";

export type ConversationStudyCategory =
  | "all"
  | "practice"
  | "greetings"
  | "courtesy"
  | "introductions"
  | "needs"
  | "directions"
  | "time";

export type StudyCategory = WordStudyCategory | ConversationStudyCategory;

export type StudyEntry = {
  id: string;
  thai: string;
  transliteration: string;
  meaning: string;
  note: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};

export type StudyProgressEntry = {
  familiarity: number;
  exposureCount: number;
  lastRating: StudyRating | null;
  lastReviewedAt: string | null;
  dueAt: string | null;
};

export type StudyDecks = Record<StudyMode, StudyEntry[]>;

export type StudyProgress = Record<
  StudyMode,
  Record<string, StudyProgressEntry>
>;
