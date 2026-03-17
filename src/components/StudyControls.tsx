import { STUDY_CATEGORIES } from "../lib/study";
import type { StudyCategory } from "../types";

type StudyControlsProps = {
  category: StudyCategory;
  query: string;
  onCategoryChange: (category: StudyCategory) => void;
  onQueryChange: (query: string) => void;
};

/**
 * Collects the filtering controls that shape which words appear in the study queue.
 */
export function StudyControls({
  category,
  query,
  onCategoryChange,
  onQueryChange,
}: StudyControlsProps) {
  const labelClassName =
    "flex flex-1 flex-col gap-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted";
  const inputClassName =
    "w-full rounded-none border-0 border-b-2 border-edge bg-transparent px-0 py-1 text-base normal-case tracking-normal text-ink transition-colors duration-200 outline-none focus:border-accent";

  return (
    <>
      <label className={labelClassName}>
        <span>Category</span>
        <select
          className={`${inputClassName} cursor-pointer appearance-none`}
          aria-label="Study category"
          value={category}
          onChange={(event) =>
            onCategoryChange(event.target.value as StudyCategory)
          }
        >
          {STUDY_CATEGORIES.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

      <label className={labelClassName}>
        <span>Search the deck</span>
        <input
          className={inputClassName}
          aria-label="Search the deck"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Type Thai or English"
        />
      </label>
    </>
  );
}
