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
    <section className="w-full max-w-[32rem] px-3 py-2 text-left md:px-5">
      <div className="grid justify-items-center gap-4">
        <div className="grid w-full max-w-[24rem] grid-cols-2 gap-3 md:gap-6">
          <article className="grid gap-1 border-r border-edge/35 pr-3 text-center md:pr-6">
            <span className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Deck size
            </span>
            <strong
              data-testid="total-count"
              className="font-serif text-[1.6rem] font-medium leading-none text-ink md:text-[1.8rem]"
            >
              {totalWords}
            </strong>
          </article>
          <article className="grid gap-1 pl-1 text-center md:pl-0">
            <span className="text-[0.68rem] uppercase tracking-[0.18em] text-muted">
              Known
            </span>
            <strong
              data-testid="known-count"
              className="font-serif text-[1.6rem] font-medium leading-none text-ink md:text-[1.8rem]"
            >
              {knownWords}
            </strong>
          </article>
        </div>
        <div className="flex justify-center">
          <button
            type="button"
            className="inline-flex items-center gap-1.5 rounded-full border border-edge/55 bg-transparent px-3 py-1.5 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-muted transition-[border-color,color,background] duration-200 hover:border-accent/30 hover:bg-[color-mix(in_srgb,_oklch(98%_0.02_75)_55%,_white)] hover:text-accent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:border-edge/40 disabled:text-muted/60 disabled:hover:border-edge/40 disabled:hover:bg-transparent disabled:hover:text-muted/60"
            aria-label="Clear known words and reset study progress"
            title={resetLabel}
            onClick={handleResetClick}
            disabled={knownWords === 0}
          >
            <LuRotateCcw aria-hidden="true" className="h-3.5 w-3.5" />
            <span>Reset progress</span>
          </button>
        </div>
      </div>
    </section>
  );
}
