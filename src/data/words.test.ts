import { describe, expect, it } from "vitest";
import { conversation } from "./conversation";
import { AGE_VOCABULARY } from "./age-levels";
import { words } from "./words";
import { getMatchingItems } from "../lib/study";
import type { AgeStudyCategory } from "../types";

function getDuplicateIds(ids: string[]) {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

describe("study datasets", () => {
  it.each<[AgeStudyCategory, number]>([
    ["age-6", 65],
    ["age-7", 62],
    ["age-8", 62],
    ["age-9", 50],
    ["age-10", 60],
    ["age-11", 50],
  ])("contains the complete %s study list exactly once", (category, count) => {
    const expectedWords = AGE_VOCABULARY[category];
    const categoryWords = getMatchingItems(words, "words", "", category);

    expect(expectedWords).toHaveLength(count);
    expect(new Set(expectedWords).size).toBe(count);
    expect(categoryWords.map((item) => item.thai).sort()).toEqual(
      [...expectedWords].sort(),
    );
    for (const item of categoryWords) {
      expect(item.transliteration.trim()).not.toBe("");
      expect(item.meaning.trim()).not.toBe("");
    }
  });

  it("keeps the 349 study-sheet words in separate age groups", () => {
    const ageWords = Object.values(AGE_VOCABULARY).flat();

    expect(ageWords).toHaveLength(349);
    expect(new Set(ageWords).size).toBe(349);
  });

  it("uses a unique id for every word entry", () => {
    expect(getDuplicateIds(words.map((word) => word.id))).toEqual([]);
  });

  it("uses a unique id for every conversation entry", () => {
    expect(getDuplicateIds(conversation.map((item) => item.id))).toEqual([]);
  });

  it("keeps ids unique across both decks", () => {
    const allIds = [...words, ...conversation].map((item) => item.id);

    expect(getDuplicateIds(allIds)).toEqual([]);
  });

  it("classifies the image vocabulary by entry structure", () => {
    const wordIds = new Set(words.map((item) => item.id));
    const conversationIds = new Set(conversation.map((item) => item.id));

    expect([...wordIds]).toEqual(
      expect.arrayContaining([
        "hru-hraa",
        "wa-we",
        "luk-lik",
        "noi-naa",
        "yum-yim",
        "yuk-yik",
      ]),
    );
    expect([...conversationIds]).toEqual(
      expect.arrayContaining([
        "conv-mo-du",
        "conv-pai-nai",
        "conv-no-mai",
        "conv-khao-lam",
        "conv-muean-kan",
        "conv-mu-yong",
      ]),
    );
  });
});
