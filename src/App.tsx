import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
import { HeroHeader } from "./components/HeroHeader";
import { StudyCard } from "./components/StudyCard";
import { StudyControls } from "./components/StudyControls";
import { StudyStats } from "./components/StudyStats";
import { words as defaultWords } from "./data/words";
import {
  applyRating,
  countKnownWords,
  getDueWords,
  getMatchingWords,
  loadProgress,
  saveProgress,
} from "./lib/study";
import type { StudyCategory, StudyProgress, WordEntry } from "./types";

type AppProps = {
  words?: WordEntry[];
};

export default function App({ words = defaultWords }: AppProps) {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<StudyCategory>("all");
  const [revealed, setRevealed] = useState(false);
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
  const knownWords = useMemo(() => countKnownWords(progress), [progress]);

  useEffect(() => {
    setRevealed(false);
  }, [currentWord?.id, deferredQuery]);

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

  return (
    <main className="app-shell">
      <HeroHeader />

      <section className="study-layout">
        <StudyControls
          category={category}
          query={query}
          onCategoryChange={setCategory}
          onQueryChange={setQuery}
        />
        <StudyStats
          totalWords={categoryWords.length}
          readyWords={dueWords.length}
          knownWords={knownWords}
        />

        {currentWord ? (
          <StudyCard
            word={currentWord}
            revealed={revealed}
            onReveal={() => setRevealed(true)}
            onRate={handleRating}
          />
        ) : (
          <EmptyStudyState hasMatches={matchingWords.length > 0} />
        )}
      </section>
    </main>
  );
}
