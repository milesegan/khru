import { describe, expect, it } from "vitest";
import { words } from "./words";

describe("words dataset", () => {
  it("uses a unique id for every word entry", () => {
    const ids = words.map((word) => word.id);
    const duplicateIds = ids.filter((id, index) => ids.indexOf(id) !== index);

    expect(duplicateIds).toEqual([]);
  });
});
