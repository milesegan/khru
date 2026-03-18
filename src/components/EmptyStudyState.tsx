import type { StudyMode } from "../types";

type EmptyStudyStateProps = {
  hasMatches: boolean;
  mode: StudyMode;
};

/**
 * Explains why no card is currently available for the selected filters.
 */
export function EmptyStudyState({ hasMatches, mode }: EmptyStudyStateProps) {
  const itemLabel = mode === "words" ? "words" : "sentences";

  return (
    <article className="flex w-full max-w-3xl flex-col items-center gap-6 text-center text-muted">
      <p className="m-0 text-xl">
        {hasMatches
          ? "You are caught up for now."
          : `No ${itemLabel} in this category yet.`}
      </p>
      <p className="mt-2 text-base">
        {hasMatches
          ? `Come back later or switch categories to explore more ${itemLabel}.`
          : "Try another category or study mode to keep going."}
      </p>
    </article>
  );
}
