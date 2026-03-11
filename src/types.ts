export type StudyRating = "again" | "okay" | "known";

export type WordEntry = {
  id: string;
  thai: string;
  transliteration: string;
  meaning: string;
  patternNote: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tags: string[];
};

export type WordProgress = {
  familiarity: number;
  exposureCount: number;
  lastRating: StudyRating | null;
  lastReviewedAt: string | null;
  dueAt: string | null;
};

export type StudyProgress = {
  words: Record<string, WordProgress>;
};
