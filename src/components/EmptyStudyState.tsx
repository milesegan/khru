type EmptyStudyStateProps = {
  hasMatches: boolean;
};

/**
 * Explains why no card is currently available for the selected filters.
 */
export function EmptyStudyState({ hasMatches }: EmptyStudyStateProps) {
  return (
    <article className="flex w-full max-w-3xl flex-col items-center gap-6 text-center text-muted">
      <p className="m-0 text-xl">
        {hasMatches
          ? "You are caught up for now."
          : "No words match this search yet."}
      </p>
      <p className="mt-2 text-base">
        {hasMatches
          ? "Come back later or change your search to explore more words."
          : "Try a Thai spelling, an English meaning, or a transliteration clue."}
      </p>
    </article>
  );
}
