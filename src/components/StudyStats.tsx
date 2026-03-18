import { LuRotateCcw } from "react-icons/lu";

type StudyStatsProps = {
  totalWords: number;
  knownWords: number;
  resetLabel: string;
  onResetProgress: () => void;
};

/**
 * Shows the three high-level counters that summarize the current study slice.
 */
export function StudyStats({
  totalWords,
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
    <div className="grid grid-flow-col justify-center gap-10">
      <article className="grid gap-1">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          Deck size
        </span>
        <strong
          data-testid="total-count"
          className="font-serif text-[1.75rem] font-medium leading-none text-ink md:text-[2rem]"
        >
          {totalWords}
        </strong>
      </article>
      <article className="grid gap-1">
        <span className="text-[0.72rem] uppercase tracking-[0.18em] text-muted">
          Known
        </span>
        <div className="grid grid-flow-col items-center justify-start gap-2">
          <strong
            data-testid="known-count"
            className="font-serif text-[1.75rem] font-medium leading-none text-ink md:text-[2rem]"
          >
            {knownWords}
          </strong>
          <button
            type="button"
            className="inline-flex h-6 w-6 items-center justify-center border-none bg-transparent p-0 text-muted transition-[color,transform] duration-200 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            aria-label="Clear known words and reset study progress"
            title={resetLabel}
            onClick={handleResetClick}
          >
            <LuRotateCcw aria-hidden="true" className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>
      </article>
    </div>
  );
}
