type StudyStatsProps = {
  totalWords: number;
  readyWords: number;
  knownWords: number;
};

/**
 * Shows the three high-level counters that summarize the current study slice.
 */
export function StudyStats({
  totalWords,
  readyWords,
  knownWords,
}: StudyStatsProps) {
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
        <strong data-testid="known-count">{knownWords}</strong>
      </article>
    </div>
  );
}
