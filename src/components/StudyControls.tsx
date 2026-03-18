import { STUDY_MODE_OPTIONS } from "../lib/study";
import type { StudyCategory, StudyMode } from "../types";

type StudyControlsProps = {
  mode: StudyMode;
  category: StudyCategory;
  categoryOptions: { value: StudyCategory; label: string }[];
  onModeChange: (mode: StudyMode) => void;
  onCategoryChange: (category: StudyCategory) => void;
};

/**
 * Collects the filtering controls that shape which words appear in the study queue.
 */
export function StudyControls({
  mode,
  category,
  categoryOptions,
  onModeChange,
  onCategoryChange,
}: StudyControlsProps) {
  const labelClassName =
    "grid min-w-0 gap-1 text-[0.65rem] uppercase tracking-[0.18em] text-muted";
  const inputClassName =
    "w-full rounded-none border-0 border-b-2 border-edge bg-transparent px-0 py-1 text-base normal-case tracking-normal text-ink transition-colors duration-200 outline-none focus:border-accent";

  return (
    <>
      <label className={labelClassName}>
        <span>Mode</span>
        <select
          className={`${inputClassName} cursor-pointer appearance-none`}
          aria-label="Study mode"
          value={mode}
          onChange={(event) => onModeChange(event.target.value as StudyMode)}
        >
          {STUDY_MODE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>

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
          {categoryOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
    </>
  );
}
