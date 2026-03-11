type EmptyStudyStateProps = {
  hasMatches: boolean;
};

/**
 * Explains why no card is currently available for the selected filters.
 */
export function EmptyStudyState({ hasMatches }: EmptyStudyStateProps) {
  return (
    <article className="card-panel empty-state">
      <p>
        {hasMatches
          ? "You are caught up for now."
          : "No words match this search yet."}
      </p>
      <p className="empty-detail">
        {hasMatches
          ? "Come back later or change your search to explore more words."
          : "Try a Thai spelling, an English meaning, or a transliteration clue."}
      </p>
    </article>
  );
}
