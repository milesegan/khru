import type { StudyRating, WordEntry } from "../types";

type StudyCardProps = {
  word: WordEntry;
  revealed: boolean;
  onReveal: () => void;
  onRate: (rating: StudyRating) => void;
};

/**
 * Displays the active flashcard and the reveal/rating actions for that word.
 */
export function StudyCard({
  word,
  revealed,
  onReveal,
  onRate,
}: StudyCardProps) {
  return (
    <article className="card-panel">
      <p className="card-label">Current card</p>
      <div className="thai-word">{word.thai}</div>
      {!revealed ? (
        <button className="reveal-button" onClick={onReveal}>
          Reveal reading clues
        </button>
      ) : (
        <div className="card-details" aria-live="polite">
          <p>{word.transliteration}</p>
          <p>{word.meaning}</p>
          <p>{word.patternNote}</p>
          <div className="rating-row">
            <button
              className="rating-button subtle"
              onClick={() => onRate("again")}
            >
              Again
            </button>
            <button className="rating-button" onClick={() => onRate("okay")}>
              Okay
            </button>
            <button
              className="rating-button strong"
              onClick={() => onRate("known")}
            >
              Known
            </button>
          </div>
        </div>
      )}
    </article>
  );
}
