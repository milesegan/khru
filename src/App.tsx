import { useDeferredValue, useMemo, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
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
      <header className="top-bar">
        <div className="controls-group">
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
        />
      </header>

      <div className="main-content">
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
