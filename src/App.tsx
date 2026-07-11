import { Provider, createStore, useAtom, useSetAtom } from "jotai";
import { useEffect, useMemo, useRef, useState } from "react";
import { EmptyStudyState } from "./components/EmptyStudyState";
import { HeroHeader } from "./components/HeroHeader";
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
  revealedCardKeyAtom,
  studyDecksAtom,
} from "./state/study";
import type { StudyDecks, StudyEntry, StudyMode } from "./types";
import { getRewardAudioSrc } from "./lib/audio";

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
  const [category, setCategory] = useAtom(categoryAtom);
  const [progress, setProgress] = useAtom(progressAtom);
  const [revealedCardKey, setRevealedCardKey] = useAtom(revealedCardKeyAtom);
  const [currentItemId, setCurrentItemId] = useAtom(currentItemIdAtom);
  const rewardAudioTemplateRef = useRef<HTMLAudioElement | null>(null);
  const activeRewardAudioRef = useRef(new Set<HTMLAudioElement>());
  const activeDeck = decks[mode];
  const categoryOptions = STUDY_CATEGORY_OPTIONS[mode];

  const studyItems = useMemo(
    () => getStudyItems(activeDeck, progress, mode, new Date(), "", category),
    [activeDeck, category, mode, progress],
  );
  const matchingItems = useMemo(
    () => getMatchingItems(activeDeck, mode, "", category),
    [activeDeck, category, mode],
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
  const currentCardKey = currentItem ? `${mode}:${currentItem.id}` : "";
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
    const activeRewardAudio = activeRewardAudioRef.current;
    const rewardAudioTemplate = rewardAudioTemplateRef.current;

    return () => {
      for (const rewardAudioElement of activeRewardAudio) {
        try {
          rewardAudioElement.pause();
        } catch {
          // jsdom does not implement HTMLMediaElement playback controls.
        }
        rewardAudioElement.currentTime = 0;
      }

      activeRewardAudio.clear();

      if (rewardAudioTemplate) {
        rewardAudioTemplate.currentTime = 0;
      }
    };
  }, []);

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
      "",
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
      "",
      category,
    );

    setRevealedCardKey("");
    setProgress(nextProgress);
    setCurrentItemId(nextStudyItems[0]?.id ?? "");
  }

  function handlePlayRewardAudio() {
    if (!rewardAudioTemplateRef.current) {
      return;
    }

    // Safari can intermittently drop rapid replays on a reused HTMLAudioElement.
    const rewardAudioPlayback = rewardAudioTemplateRef.current.cloneNode(
      true,
    ) as HTMLAudioElement;
    activeRewardAudioRef.current.add(rewardAudioPlayback);

    const cleanupRewardPlayback = () => {
      activeRewardAudioRef.current.delete(rewardAudioPlayback);
      rewardAudioPlayback.removeEventListener("ended", cleanupRewardPlayback);
      rewardAudioPlayback.removeEventListener("error", cleanupRewardPlayback);
    };

    rewardAudioPlayback.addEventListener("ended", cleanupRewardPlayback);
    rewardAudioPlayback.addEventListener("error", cleanupRewardPlayback);

    void rewardAudioPlayback.play().catch(() => {
      cleanupRewardPlayback();
    });
  }

  return (
    <main className="mx-auto grid min-h-dvh w-[min(1120px,calc(100%-2rem))] grid-rows-[auto_minmax(0,1fr)_auto] gap-8 py-6">
      <header className="grid gap-5">
        <HeroHeader />
        <div className="grid w-full grid-cols-2 items-end gap-4 md:max-w-[32rem] md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] md:gap-8">
          <StudyControls
            mode={mode}
            category={category}
            categoryOptions={categoryOptions}
            onModeChange={handleModeChange}
            onCategoryChange={setCategory}
          />
        </div>
      </header>

      <div className="grid place-items-center">
        {currentItem ? (
          <StudyCard
            key={currentCardKey}
            item={currentItem}
            mode={mode}
            revealed={revealed}
            onReveal={() => setRevealedCardKey(currentCardKey)}
            onPlayRewardAudio={handlePlayRewardAudio}
            onRate={handleRating}
          />
        ) : (
          <EmptyStudyState mode={mode} hasMatches={matchingItems.length > 0} />
        )}
      </div>

      <footer className="grid justify-center">
        <StudyStats
          totalWords={categoryItems.length}
          knownWords={knownItems}
          resetLabel={resetLabel}
          onResetProgress={handleResetProgress}
        />
      </footer>
      <audio
        ref={rewardAudioTemplateRef}
        preload="auto"
        src={getRewardAudioSrc()}
        aria-hidden="true"
      />
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
