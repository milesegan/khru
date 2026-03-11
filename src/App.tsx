import { useDeferredValue, useEffect, useMemo, useState } from "react";
import { words as defaultWords } from "./data/words";
import {
  applyRating,
  countKnownWords,
  getDueWords,
  getMatchingWords,
  loadProgress,
  saveProgress,
} from "./lib/study";
import type { StudyProgress, WordEntry } from "./types";

type AppProps = {
  words?: WordEntry[];
};

export default function App({ words = defaultWords }: AppProps) {
  const [query, setQuery] = useState("");
  const [revealed, setRevealed] = useState(false);
  const deferredQuery = useDeferredValue(query);
  const [progress, setProgress] = useState<StudyProgress>(() =>
    loadProgress(words, window.localStorage),
  );

  const dueWords = useMemo(
    () => getDueWords(words, progress, new Date(), deferredQuery),
    [deferredQuery, progress, words],
  );
  const matchingWords = useMemo(
    () => getMatchingWords(words, deferredQuery),
    [deferredQuery, words],
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
      <section className="hero">
        <p className="eyebrow">Khru Thai Reader</p>
      </section>

      <section className="study-layout">
        <label className="search-field">
          <span>Search the deck</span>
          <input
            aria-label="Search the deck"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Type Thai, English, or transliteration"
          />
        </label>

        <div className="stats">
          <article>
            <span>Total words</span>
            <strong data-testid="total-count">{words.length}</strong>
          </article>
          <article>
            <span>Ready now</span>
            <strong data-testid="ready-count">{dueWords.length}</strong>
          </article>
          <article>
            <span>Known</span>
            <strong data-testid="known-count">{knownWords}</strong>
          </article>
        </div>

        {currentWord ? (
          <article className="card-panel">
            <p className="card-label">Current card</p>
            <div className="thai-word">{currentWord.thai}</div>
            {!revealed ? (
              <button
                className="reveal-button"
                onClick={() => setRevealed(true)}
              >
                Reveal reading clues
              </button>
            ) : (
              <div className="card-details" aria-live="polite">
                <p>{currentWord.transliteration}</p>
                <p>{currentWord.meaning}</p>
                <p>{currentWord.patternNote}</p>
                <div className="rating-row">
                  <button
                    className="rating-button subtle"
                    onClick={() => handleRating("again")}
                  >
                    Again
                  </button>
                  <button
                    className="rating-button"
                    onClick={() => handleRating("okay")}
                  >
                    Okay
                  </button>
                  <button
                    className="rating-button strong"
                    onClick={() => handleRating("known")}
                  >
                    Known
                  </button>
                </div>
              </div>
            )}
          </article>
        ) : (
          <article className="card-panel empty-state">
            <p>
              {matchingWords.length === 0
                ? "No words match this search yet."
                : "You are caught up for now."}
            </p>
            <p className="empty-detail">
              {matchingWords.length === 0
                ? "Try a Thai spelling, an English meaning, or a transliteration clue."
                : "Come back later or change your search to explore more words."}
            </p>
          </article>
        )}
      </section>
    </main>
  );
}
