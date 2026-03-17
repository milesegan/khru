import { Provider, createStore, useAtom, useSetAtom } from "jotai";
import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
import { StudyCard } from "./components/StudyCard";
import { StudyControls } from "./components/StudyControls";
import { StudyStats } from "./components/StudyStats";
import { conversation as defaultConversation } from "./data/conversation";
import { words as defaultWords } from "./data/words";
import {
  applyRating,
  countKnownItems,
  getMatchingItems,
  getStudyItems,
  resetProgressForItemIds,
  STUDY_CATEGORY_OPTIONS,
} from "./lib/study";
import {
  categoryAtom,
  currentItemIdAtom,
  getInitialProgress,
  modeAtom,
  progressAtom,
  queryAtom,
  revealedCardKeyAtom,
  studyDecksAtom,
} from "./state/study";
import type { StudyDecks, StudyEntry, StudyMode } from "./types";

type AppProps = {
  words?: StudyEntry[];
  conversation?: StudyEntry[];
};

type StudyViewProps = {
  decks: StudyDecks;
};

type StudyStateHydratorProps = {
  decks: StudyDecks;
};

function StudyView({ decks }: StudyViewProps) {
  const [mode, setMode] = useAtom(modeAtom);
  const [query, setQuery] = useAtom(queryAtom);
  const [category, setCategory] = useAtom(categoryAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const [revealedCardKey, setRevealedCardKey] = useAtom(revealedCardKeyAtom);
  const [currentItemId, setCurrentItemId] = useAtom(currentItemIdAtom);
  const deferredQuery = useDeferredValue(query);
  const activeDeck = decks[mode];
  const categoryOptions = STUDY_CATEGORY_OPTIONS[mode];

  const studyItems = useMemo(
    () =>
      getStudyItems(
        activeDeck,
        progress,
        mode,
        new Date(),
        deferredQuery,
        category,
      ),
    [activeDeck, category, deferredQuery, mode, progress],
  );
  const matchingItems = useMemo(
    () => getMatchingItems(activeDeck, mode, deferredQuery, category),
    [activeDeck, category, deferredQuery, mode],
  );
  const categoryItems = useMemo(
    () => getMatchingItems(activeDeck, mode, "", category),
    [activeDeck, category, mode],
  );
  const currentItem = useMemo(() => {
    if (studyItems.length === 0) {
      return null;
    }

    return (
      studyItems.find((item) => item.id === currentItemId) ?? studyItems[0]
    );
  }, [currentItemId, studyItems]);
  const currentCardKey = currentItem
    ? `${mode}:${currentItem.id}:${query}`
    : "";
  const knownItems = useMemo(
    () => countKnownItems(progress, mode),
    [mode, progress],
  );
  const revealed = currentCardKey !== "" && revealedCardKey === currentCardKey;
  const resetItemIds = useMemo(
    () => categoryItems.map((item) => item.id),
    [categoryItems],
  );
  const selectedCategoryLabel =
    categoryOptions.find((option) => option.value === category)?.label ??
    (mode === "words" ? "All words" : "All sentences");
  const itemLabel = mode === "words" ? "words" : "sentences";
  const resetLabel =
    category === "all"
      ? `Clear all known ${itemLabel} and reset study progress?`
      : `Clear known ${itemLabel} and reset study progress for ${selectedCategoryLabel}?`;

  useEffect(() => {
    const nextItemId = currentItem?.id ?? "";

    if (nextItemId !== currentItemId) {
      setCurrentItemId(nextItemId);
    }
  }, [currentItem?.id, currentItemId, setCurrentItemId]);

  function handleRating(rating: "again" | "okay" | "known") {
    if (!currentItem) {
      return;
    }

    const currentItemIndex = studyItems.findIndex(
      (item) => item.id === currentItem.id,
    );
    const nextVisibleItemId =
      studyItems[(currentItemIndex + 1) % studyItems.length]?.id ?? "";
    const now = new Date();
    const nextProgress = applyRating(
      progress,
      mode,
      currentItem.id,
      rating,
      now,
    );
    const nextStudyItems = getStudyItems(
      activeDeck,
      nextProgress,
      mode,
      now,
      deferredQuery,
      category,
    );
    const nextItemId = nextStudyItems.some(
      (item) => item.id === nextVisibleItemId,
    )
      ? nextVisibleItemId
      : (nextStudyItems[0]?.id ?? "");

    setProgress(nextProgress);
    setCurrentItemId(nextItemId);
    setRevealedCardKey("");
  }

  function handleModeChange(nextMode: StudyMode) {
    const nextStudyItems = getStudyItems(
      decks[nextMode],
      progress,
      nextMode,
      new Date(),
      "",
      "all",
    );

    setMode(nextMode);
    setQuery("");
    setCategory("all");
    setRevealedCardKey("");
    setCurrentItemId(nextStudyItems[0]?.id ?? "");
  }

  function handleResetProgress() {
    const nextProgress =
      category === "all"
        ? getInitialProgress(decks)
        : resetProgressForItemIds(progress, mode, resetItemIds);
    const nextStudyItems = getStudyItems(
      activeDeck,
      nextProgress,
      mode,
      new Date(),
      deferredQuery,
      category,
    );

    setRevealedCardKey("");
    setProgress(nextProgress);
    setCurrentItemId(nextStudyItems[0]?.id ?? "");
  }

  return (
    <main className="mx-auto flex w-[min(1120px,calc(100%-2rem))] flex-col gap-8 py-6">
      <header className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-col gap-4 md:max-w-[48rem] md:flex-1 md:flex-row md:items-end md:gap-8">
          <StudyControls
            mode={mode}
            category={category}
            categoryOptions={categoryOptions}
            query={query}
            onModeChange={handleModeChange}
            onCategoryChange={setCategory}
            onQueryChange={setQuery}
          />
        </div>
        <StudyStats
          totalWords={categoryItems.length}
          readyWords={studyItems.length}
          knownWords={knownItems}
          resetLabel={resetLabel}
          onResetProgress={handleResetProgress}
        />
      </header>

      <div className="flex min-h-[50vh] flex-1 items-center justify-center">
        {currentItem ? (
          <StudyCard
            key={currentCardKey}
            item={currentItem}
            mode={mode}
            revealed={revealed}
            onReveal={() => setRevealedCardKey(currentCardKey)}
            onRate={handleRating}
          />
        ) : (
          <EmptyStudyState mode={mode} hasMatches={matchingItems.length > 0} />
        )}
      </div>
    </main>
  );
}

function StudyStateHydrator({ decks }: StudyStateHydratorProps) {
  const setDecks = useSetAtom(studyDecksAtom);

  useEffect(() => {
    setDecks(decks);
  }, [decks, setDecks]);

  return <StudyView decks={decks} />;
}

export default function App({
  words = defaultWords,
  conversation = defaultConversation,
}: AppProps) {
  const decks = useMemo(
    () => ({
      words,
      conversation,
    }),
    [conversation, words],
  );
  const [store] = useState(() => {
    const studyStore = createStore();
    studyStore.set(studyDecksAtom, decks);
    return studyStore;
  });

  useEffect(() => {
    store.set(studyDecksAtom, decks);
  }, [decks, store]);

  return (
    <Provider store={store}>
      <StudyStateHydrator decks={decks} />
    </Provider>
  );
}
