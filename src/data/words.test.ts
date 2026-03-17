import { describe, expect, it } from "vitest";
import { conversation } from "./conversation";
import { words } from "./words";

function getDuplicateIds(ids: string[]) {
  return ids.filter((id, index) => ids.indexOf(id) !== index);
}

describe("study datasets", () => {
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
});
