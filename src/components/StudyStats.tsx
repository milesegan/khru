import { LuRotateCcw } from "react-icons/lu";

type StudyStatsProps = {
  totalWords: number;
  readyWords: number;
  knownWords: number;
  resetLabel: string;
  onResetProgress: () => void;
};

/**
 * Shows the three high-level counters that summarize the current study slice.
 */
export function StudyStats({
  totalWords,
  readyWords,
  knownWords,
  resetLabel,
  onResetProgress,
}: StudyStatsProps) {
  function handleResetClick() {
    const confirmed = window.confirm(resetLabel);

    if (!confirmed) {
      return;
    }

    onResetProgress();
  }

  return (
    <div className="flex gap-6">
      <article className="flex flex-col gap-[0.15rem]">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Deck size
        </span>
        <strong
          data-testid="total-count"
          className="font-serif text-xl font-medium leading-none text-ink"
        >
          {totalWords}
        </strong>
      </article>
      <article className="flex flex-col gap-[0.15rem]">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Ready now
        </span>
        <strong
          data-testid="ready-count"
          className="font-serif text-xl font-medium leading-none text-ink"
        >
          {readyWords}
        </strong>
      </article>
      <article className="flex flex-col gap-[0.15rem]">
        <span className="text-[0.65rem] uppercase tracking-[0.18em] text-muted">
          Known
        </span>
        <div className="flex items-center gap-[0.45rem]">
          <strong
            data-testid="known-count"
            className="font-serif text-xl font-medium leading-none text-ink"
          >
            {knownWords}
          </strong>
          <button
            type="button"
            className="mb-[-3px] inline-flex h-5 w-5 items-center justify-center border-none bg-transparent p-0 text-muted transition-[color,transform] duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Clear known words and reset study progress"
            title={resetLabel}
            onClick={handleResetClick}
          >
            <LuRotateCcw aria-hidden="true" className="h-4 w-4" />
          </button>
        </div>
      </article>
    </div>
  );
}
