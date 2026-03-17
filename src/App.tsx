import { useDeferredValue, useMemo, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
import { StudyCard } from "./components/StudyCard";
import { StudyControls } from "./components/StudyControls";
import { StudyStats } from "./components/StudyStats";
import { words as defaultWords } from "./data/words";
import {
  applyRating,
  countKnownWords,
  createInitialProgress,
  resetProgressForWordIds,
  getDueWords,
  getMatchingWords,
  loadProgress,
  saveProgress,
  STUDY_CATEGORIES,
} from "./lib/study";
import type { StudyCategory, StudyProgress, WordEntry } from "./types";

type AppProps = {
  words?: WordEntry[];
};

export default function App({ words = defaultWords }: AppProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<StudyCategory>("all");
  const deferredQuery = useDeferredValue(query);
  const [progress, setProgress] = useState<StudyProgress>(() =>
    loadProgress(words, window.localStorage),
  );

  const dueWords = useMemo(
    () => getDueWords(words, progress, new Date(), deferredQuery, category),
    [category, deferredQuery, progress, words],
  );
  const matchingWords = useMemo(
    () => getMatchingWords(words, deferredQuery, category),
    [category, deferredQuery, words],
  );
  const categoryWords = useMemo(
    () => getMatchingWords(words, "", category),
    [category, words],
  );
  const currentWord = dueWords[0] ?? null;
  const currentCardKey = currentWord
    ? `${currentWord.id}:${deferredQuery}`
    : "";
  const [revealedCardKey, setRevealedCardKey] = useState("");
  const knownWords = useMemo(() => countKnownWords(progress), [progress]);
  const revealed = currentCardKey !== "" && revealedCardKey === currentCardKey;
  const resetWordIds = useMemo(
    () => categoryWords.map((word) => word.id),
    [categoryWords],
  );
  const selectedCategoryLabel =
    STUDY_CATEGORIES.find((option) => option.value === category)?.label ??
    "All words";
  const resetLabel =
    category === "all"
      ? "Clear all known words and reset study progress?"
      : `Clear known words and reset study progress for ${selectedCategoryLabel}?`;

  function handleRating(rating: "again" | "okay" | "known") {
    if (!currentWord) {
      return;
    }

    setProgress((currentProgress) => {
      const nextProgress = applyRating(
        currentProgress,
        currentWord.id,
        rating,
        new Date(),
      );
      saveProgress(nextProgress, window.localStorage);
      return nextProgress;
    });
  }

  function handleResetProgress() {
    setProgress((currentProgress) => {
      const nextProgress =
        category === "all"
          ? createInitialProgress(words)
          : resetProgressForWordIds(currentProgress, resetWordIds);
      setRevealedCardKey("");
      saveProgress(nextProgress, window.localStorage);
      return nextProgress;
    });
  }

  return (
    <main className="mx-auto flex w-[min(1120px,calc(100%-2rem))] flex-col gap-8 py-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:max-w-[32rem] md:flex-1 md:flex-row md:items-end md:gap-8">
          <StudyControls
            category={category}
            query={query}
            onCategoryChange={setCategory}
            onQueryChange={setQuery}
          />
        </div>
        <StudyStats
          totalWords={categoryWords.length}
          readyWords={dueWords.length}
          knownWords={knownWords}
          resetLabel={resetLabel}
          onResetProgress={handleResetProgress}
        />
      </header>

      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        {currentWord ? (
          <StudyCard
            key={currentCardKey}
            word={currentWord}
            revealed={revealed}
            onReveal={() => setRevealedCardKey(currentCardKey)}
            onRate={handleRating}
          />
        ) : (
          <EmptyStudyState hasMatches={matchingWords.length > 0} />
        )}
      </div>
    </main>
  );
}
