import { Provider, createStore, useAtom, useSetAtom } from "jotai";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
import { StudyCard } from "./components/StudyCard";
import { StudyControls } from "./components/StudyControls";
import { StudyStats } from "./components/StudyStats";
import { words as defaultWords } from "./data/words";
import {
  applyRating,
  countKnownWords,
  getMatchingWords,
  getStudyWords,
  resetProgressForWordIds,
  STUDY_CATEGORIES,
} from "./lib/study";
import {
  categoryAtom,
  currentWordIdAtom,
  getInitialProgress,
  progressAtom,
  queryAtom,
  revealedCardKeyAtom,
  wordsAtom,
} from "./state/study";
import type { WordEntry } from "./types";

type AppProps = {
  words?: WordEntry[];
};

type StudyViewProps = {
  words: WordEntry[];
};

type StudyStateHydratorProps = {
  words: WordEntry[];
};

function StudyView({ words }: StudyViewProps) {
  const [query, setQuery] = useAtom(queryAtom);
  const [category, setCategory] = useAtom(categoryAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const [revealedCardKey, setRevealedCardKey] = useAtom(revealedCardKeyAtom);
  const [currentWordId, setCurrentWordId] = useAtom(currentWordIdAtom);
  const deferredQuery = useDeferredValue(query);

  const studyWords = useMemo(
    () => getStudyWords(words, progress, new Date(), deferredQuery, category),
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
  const currentWord = useMemo(() => {
    if (studyWords.length === 0) {
      return null;
    }

    return (
      studyWords.find((word) => word.id === currentWordId) ?? studyWords[0]
    );
  }, [currentWordId, studyWords]);
  const currentCardKey = currentWord
    ? `${currentWord.id}:${deferredQuery}`
    : "";
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

  useEffect(() => {
    const nextWordId = currentWord?.id ?? "";

    if (nextWordId !== currentWordId) {
      setCurrentWordId(nextWordId);
    }
  }, [currentWord?.id, currentWordId, setCurrentWordId]);

  function handleRating(rating: "again" | "okay" | "known") {
    if (!currentWord) {
      return;
    }

    const currentWordIndex = studyWords.findIndex(
      (word) => word.id === currentWord.id,
    );
    const nextVisibleWordId =
      studyWords[(currentWordIndex + 1) % studyWords.length]?.id ?? "";
    const now = new Date();
    const nextProgress = applyRating(progress, currentWord.id, rating, now);
    const nextStudyWords = getStudyWords(
      words,
      nextProgress,
      now,
      deferredQuery,
      category,
    );
    const nextWordId = nextStudyWords.some(
      (word) => word.id === nextVisibleWordId,
    )
      ? nextVisibleWordId
      : (nextStudyWords[0]?.id ?? "");

    setProgress(nextProgress);
    setCurrentWordId(nextWordId);
    setRevealedCardKey("");
  }

  function handleResetProgress() {
    const nextProgress =
      category === "all"
        ? getInitialProgress(words)
        : resetProgressForWordIds(progress, resetWordIds);
    const nextStudyWords = getStudyWords(
      words,
      nextProgress,
      new Date(),
      deferredQuery,
      category,
    );

    setRevealedCardKey("");
    setProgress(nextProgress);
    setCurrentWordId(nextStudyWords[0]?.id ?? "");
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
          readyWords={studyWords.length}
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

function StudyStateHydrator({ words }: StudyStateHydratorProps) {
  const setWords = useSetAtom(wordsAtom);

  useEffect(() => {
    setWords(words);
  }, [setWords, words]);

  return <StudyView words={words} />;
}

export default function App({ words = defaultWords }: AppProps) {
  const [store] = useState(() => {
    const studyStore = createStore();
    studyStore.set(wordsAtom, words);
    return studyStore;
  });

  useEffect(() => {
    store.set(wordsAtom, words);
  }, [store, words]);

  return (
    <Provider store={store}>
      <StudyStateHydrator words={words} />
    </Provider>
  );
}
