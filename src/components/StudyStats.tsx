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
        <div className="flex items-center gap-3">
          <strong
            data-testid="known-count"
            className="font-serif text-[1.75rem] font-medium leading-none text-ink md:text-[2rem]"
          >
            {knownWords}
          </strong>
          <button
            type="button"
            className="inline-flex translate-y-px items-center gap-1.5 rounded-full border border-edge/70 bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_78%,_white)] px-2.5 py-1 leading-none text-[0.68rem] font-medium uppercase tracking-[0.14em] text-muted transition-[border-color,color,background] duration-200 hover:border-accent/40 hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:border-edge/50 disabled:bg-transparent disabled:text-muted/60 disabled:hover:text-muted/60"
            aria-label="Clear known words and reset study progress"
            title={resetLabel}
            onClick={handleResetClick}
            disabled={knownWords === 0}
          >
            <LuRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </article>
    </div>
  );
}
