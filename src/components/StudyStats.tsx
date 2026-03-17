import { LuRotateCcw } from "react-icons/lu";

type StudyStatsProps = {
  totalWords: number;
  readyWords: number;
  knownWords: number;
  onResetProgress: () => void;
};

/**
 * Shows the three high-level counters that summarize the current study slice.
 */
export function StudyStats({
  totalWords,
  readyWords,
  knownWords,
  onResetProgress,
}: StudyStatsProps) {
  function handleResetClick() {
    const confirmed = window.confirm(
      "Clear all known words and reset study progress?",
    );

    if (!confirmed) {
      return;
    }

    onResetProgress();
  }

  return (
    <div className="stats">
      <article>
        <span>Deck size</span>
        <strong data-testid="total-count">{totalWords}</strong>
      </article>
      <article>
        <span>Ready now</span>
        <strong data-testid="ready-count">{readyWords}</strong>
      </article>
      <article>
        <span>Known</span>
        <div className="stat-value-row">
          <strong data-testid="known-count">{knownWords}</strong>
          <button
            type="button"
            className="stats-icon-button"
            aria-label="Clear known words and reset study progress"
            onClick={handleResetClick}
          >
            <LuRotateCcw aria-hidden="true" className="stats-icon" />
          </button>
        </div>
      </article>
    </div>
  );
}
