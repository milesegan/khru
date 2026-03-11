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
  return (
    <>
      <label className="search-field">
        <span>Category</span>
        <select
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

      <label className="search-field">
        <span>Search the deck</span>
        <input
          aria-label="Search the deck"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Type Thai or English"
        />
      </label>
    </>
  );
}
