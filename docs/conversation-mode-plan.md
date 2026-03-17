# Add Selectable Conversation Sentence Mode

## Summary

Introduce a top-level study mode switch with two decks: existing `words` and new `conversation`. The new mode teaches single short Thai sentences for everyday situations, keeps its own progress, and uses the same flashcard flow: Thai on the front, then transliteration, English meaning, note, and audio on reveal.

## Implementation Changes

### Deck and state model

- Add `StudyMode = "words" | "conversation"` and make the study screen active-deck driven instead of hard-coded to the words dataset.
- Generalize the current study item type in [src/types.ts](/Users/miles/c/khru/src/types.ts) so both decks share the same card contract: `id`, Thai text, transliteration, marked transliteration, meaning, note, difficulty, and tags.
- Replace the fixed category union with per-mode category config. Keep `"all"` for both modes; add conversation categories: `greetings`, `courtesy`, `introductions`, `needs`, `directions`, and `time`.
- Add a mode selector to the study controls. On mode change, reset the active UI slice for that deck: clear search, set category to `"all"`, clear reveal state, and show the first available card.

### Conversation content

- Add a new conversation dataset under `src/data/` with a starter deck of 36 short everyday sentences.
- Scope v1 content to core daily basics: greetings, thanks/sorry, self-introductions, simple requests/needs, where/how-far questions, and basic time/day questions.
- Keep cards as single-sentence units, not dialogue pairs.
- Prefix conversation ids with `conv-` so ids remain unique across decks.

### Progress and filtering

- Replace the single progress shape with per-mode progress buckets in [src/lib/study.ts](/Users/miles/c/khru/src/lib/study.ts), with independent `words` and `conversation` maps.
- Do not migrate legacy saved state. Use a new storage key/schema and allow existing users to start fresh.
- Keep search behavior unchanged in both modes: Thai, transliteration, marked transliteration, and English meaning should all match.
- Scope counters, ready/known counts, empty-state copy, and reset actions to the active mode only. Category-scoped reset should continue to apply only within the selected mode.

### Audio layout and tooling

- Split static audio paths by deck:
  - words: `public/audio/th/words/<id>.opus`
  - conversation: `public/audio/th/conversation/<id>.opus`
- Replace the current word-only audio helper with a deck-aware helper that resolves the correct subdirectory from the active mode.
- Extend [scripts/generate-thai-audio.mjs](/Users/miles/c/khru/scripts/generate-thai-audio.mjs) so it can generate audio for both datasets instead of parsing only `src/data/words.ts`.
- Add a `--mode=words|conversation|all` option to the generator; default to `all`.
- Update README instructions to reflect the new per-mode audio directories and generation workflow.

## Test Plan

- Add dataset tests for unique ids within each deck and across both decks combined.
- Add study-helper tests for per-mode progress initialization, conversation category matching, and active-mode reset behavior.
- Add app tests for mode switching, sentence-card reveal flow, sentence search/category filtering, progress isolation between modes, and mode-specific reset/counter behavior.
- Update audio tests to verify deck-aware asset paths and generator mode selection.

## Assumptions

- The new mode is a separate deck, not a category inside the words deck.
- Each conversation card teaches exactly one sentence.
- Sentence mode ships with full audio assets in v1.
- Existing saved progress can be discarded by switching to a new storage key/schema.
- Existing word-mode study behavior should remain unchanged apart from the new mode selector, reset of stored progress, and deck-specific audio paths.
